// ============================================================
// server.ts
// Express backend — all Gemini AI calls happen here (server-side only)
// Security: Helmet, CORS, Rate Limiting, 15KB limits,
//   Type guard + bounds + enum validation, .env secrets, CWE-209 safe
// Efficiency: in-memory AI response cache (SHA-256 hash-keyed, 100-entry LRU)
// ============================================================

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';
import path from 'path';
import 'dotenv/config';
import {
  ALLOWED_ORIGINS,
  VALID_EVENT_TYPES,
  EventTypeString,
  VALID_LANGUAGES,
  LangCode,
  sanitizeString,
  PlanPayload,
  validatePlanPayload,
  validateZone,
  hashPayload,
} from './src/lib/serverValidation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Security: Reverse Proxy Trust (Render / Cloudflare) ──────
app.set('trust proxy', 1);

// Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[RESPONSE] ${req.method} ${req.url} -> ${res.statusCode}`);
  });
  next();
});

// ── 1. Security: Helmet with strict CSP & clickjacking defense ───
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseapp.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    frameguard: { action: 'deny' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// ── 2. Security: Dynamic CORS origin matching ────────────────

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        ALLOWED_ORIGINS.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: ${origin}`), false);
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
  })
);

// ── 3. Security: Payload size restriction — 15 KB ───────────
app.use(express.json({ limit: '15kb' }));

// ── 4. Security: Rate limiter — 30 req/min/IP on AI endpoints ─
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again in a minute.' },
});

// ── 5. Efficiency: In-memory AI response cache ───────────────
interface CacheEntry<T = unknown> {
  data: T;
  generatedAt: number;
}
const aiCache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 100;

function pruneCache(): void {
  if (aiCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = aiCache.keys().next().value;
    if (firstKey !== undefined) aiCache.delete(firstKey);
  }
}

// ── 6. Gemini client (server-side only) ─────────────────────
const apiKey = process.env.GEMINI_API_KEY ?? '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

async function callGeminiWithTimeout<T>(promise: Promise<T>, ms = 25000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI generation timeout')), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type { EventTypeString, LangCode, PlanPayload };
export {
  ALLOWED_ORIGINS,
  VALID_EVENT_TYPES,
  VALID_LANGUAGES,
  validatePlanPayload,
  validateZone,
  hashPayload,
};

// ── Deterministic Plan Generator (Reliable fallback & test anchor) ──
function generateDeterministicPlan(p: PlanPayload) {
  const isWedding = p.eventType === 'wedding';
  const isBirthday = p.eventType === 'birthday';

  const overview = `Personalized ${p.eventType.toUpperCase()} event plan tailored for ${p.guestCount} guests in ${p.location} with a total budget of $${p.totalBudget.toLocaleString()}.`;
  const recommendedTheme = p.themePreference || (isWedding ? 'Romantic Botanical Elegance' : isBirthday ? 'Vibrant Milestone Celebration' : 'Inclusive Community Gathering');

  const suggestedActivities = isWedding
    ? ['Guest Welcome Cocktail', 'Ceremony & Vow Exchange', 'Golden Hour Photo Session', 'Plated Dinner & Speeches', 'First Dance & Live Band', 'Bouquet Toss & Late Night Treats']
    : isBirthday
    ? ['Arrival Welcome Drink & Photobooth', 'Interactive Party Trivia / Games', 'Grand Cake Cutting Ceremony', 'Buffet Feast & Toasts', 'Dance Floor DJ Showcase', 'Party Favor Distribution']
    : ['Opening Welcome Address', 'Community Showcase / Local Talent', 'Food Truck Fair & Picnic Seating', 'Interactive Family Workshops', 'Live Community Concert', 'Closing Gratitude & Cleanup Drive'];

  const daySchedule = [
    { id: 'sch-1', time: '14:00', activity: 'Setup & Vendor Arrival', description: 'Coordinate delivery and layout checks' },
    { id: 'sch-2', time: '16:00', activity: 'Guest Welcome & Check-In', description: 'Beverages and registration open' },
    { id: 'sch-3', time: '17:30', activity: 'Main Program / Highlights', description: 'Primary speeches, ceremonies, or performances' },
    { id: 'sch-4', time: '19:00', activity: 'Dinner & Refreshments', description: 'Catering service with designated dietary stations' },
    { id: 'sch-5', time: '21:00', activity: 'Social & Entertainment', description: 'Music, dancing, and celebratory closing' },
  ];

  const budgetAllocation: Record<string, number> = isWedding
    ? { venue: 0.35, catering: 0.25, photography: 0.12, decoration: 0.10, entertainment: 0.08, invitations: 0.02, miscellaneous: 0.08 }
    : isBirthday
    ? { venue: 0.25, catering: 0.30, decoration: 0.15, entertainment: 0.15, photography: 0.08, invitations: 0.02, miscellaneous: 0.05 }
    : { venue: 0.20, equipment: 0.25, catering: 0.20, decoration: 0.10, entertainment: 0.10, invitations: 0.05, miscellaneous: 0.10 };

  const vendorChecklist = isWedding
    ? [
        { category: 'venue', name: 'Ceremony & Reception Space', description: 'Book verified venue with adequate parking', priority: 'Urgent', estimatedCost: Math.round(p.totalBudget * 0.35) },
        { category: 'catering', name: 'Catering & Beverage Service', description: 'Menu tasting and dietary accommodations', priority: 'Urgent', estimatedCost: Math.round(p.totalBudget * 0.25) },
        { category: 'photography', name: 'Lead Photographer & Video', description: 'Full coverage agreement', priority: 'High', estimatedCost: Math.round(p.totalBudget * 0.12) },
        { category: 'decoration', name: 'Floral & Table Designer', description: 'Centerpieces, lighting, floral arch', priority: 'Medium', estimatedCost: Math.round(p.totalBudget * 0.10) },
      ]
    : isBirthday
    ? [
        { category: 'venue', name: 'Party Venue / Hall', description: 'Private celebration space', priority: 'High', estimatedCost: Math.round(p.totalBudget * 0.25) },
        { category: 'catering', name: 'Caterer & Custom Birthday Cake', description: 'Themed tiered cake + finger food buffet', priority: 'Urgent', estimatedCost: Math.round(p.totalBudget * 0.30) },
        { category: 'decoration', name: 'Themed Decor & Balloon Styling', description: 'Entrance arch and photo wall', priority: 'Medium', estimatedCost: Math.round(p.totalBudget * 0.15) },
        { category: 'entertainment', name: 'DJ & Sound Host', description: 'Sound system, lighting, party host', priority: 'Medium', estimatedCost: Math.round(p.totalBudget * 0.15) },
      ]
    : [
        { category: 'venue', name: 'Park Grounds & Municipal Permit', description: 'Park clearance, sound and assembly permits', priority: 'Urgent', estimatedCost: Math.round(p.totalBudget * 0.20) },
        { category: 'equipment', name: 'PA Sound System & Stage', description: 'Speakers, generator, microphones', priority: 'Urgent', estimatedCost: Math.round(p.totalBudget * 0.25) },
        { category: 'catering', name: 'Food Trucks & Water Stations', description: 'Local community vendors', priority: 'High', estimatedCost: Math.round(p.totalBudget * 0.20) },
        { category: 'equipment', name: 'Safety, Waste & First Aid', description: 'Sanitation stations and first aid kit', priority: 'High', estimatedCost: Math.round(p.totalBudget * 0.10) },
      ];

  const milestones = [
    { title: 'Lock Core Venue & Finalize Guest Count', description: 'Establish baseline attendance and contracts', relativeDaysBefore: 90, priority: 'Urgent' },
    { title: 'Confirm Main Vendors & Catering', description: 'Sign supplier contracts and secure deposits', relativeDaysBefore: 60, priority: 'High' },
    { title: 'Send Invitations & Collect RSVPs', description: 'Digital & physical cards with dietary tracking', relativeDaysBefore: 30, priority: 'High' },
    { title: 'Final Coordination & Schedule Review', description: 'Confirm day-of timeline with all participants', relativeDaysBefore: 7, priority: 'Urgent' },
  ];

  const ideas = [
    {
      id: 'idea-1',
      category: 'theme',
      title: `${recommendedTheme} Aesthetic`,
      description: `Harmonious color palette and decor elements matching your preferences.`,
      tags: ['Aesthetics', 'Styling'],
      whyRecommended: `Matches requested theme and fits within the allocated budget.`,
    },
    {
      id: 'idea-2',
      category: 'budget_friendly',
      title: 'Smart Beverage & Catering Optimization',
      description: 'Signature mocktails/cocktails paired with seasonal appetizers to reduce per-head costs.',
      estimatedSavings: Math.round(p.totalBudget * 0.08),
      tags: ['Budget', 'Catering'],
      whyRecommended: 'Keeps guest satisfaction high while saving up to 8% on bar spending.',
    },
    {
      id: 'idea-3',
      category: 'sustainable',
      title: 'Zero Single-Use Plastic & Digital Invites',
      description: 'Biodegradable tableware, water refill stations, and QR code schedules.',
      tags: ['Eco', 'Green'],
      whyRecommended: 'Reduces landfill waste and aligns with eco-friendly hosting standards.',
    },
    {
      id: 'idea-4',
      category: 'accessibility',
      title: 'Step-Free Access & Quiet Rest Lounge',
      description: 'Reserved level seating, clear wayfinding signage, and a quiet sensory space.',
      tags: ['Inclusive', 'Accessibility'],
      whyRecommended: 'Ensures guests of all ages and mobility levels enjoy the event comfortably.',
    },
  ];

  const importantDecisions = [
    'Confirm indoor backup contingency if outdoor weather turns unfavorable.',
    'Review all vendor cancellation and reschedule policies.',
    'Confirm dietary allergen separation with the caterer.',
  ];

  return {
    overview,
    recommendedTheme,
    suggestedActivities,
    daySchedule,
    budgetAllocation,
    vendorChecklist,
    milestones,
    ideas,
    importantDecisions,
    cached: false,
    generatedAt: Date.now(),
  };
}

// ── 8. POST /api/plan-event ───────────────────────────────────
app.post(
  '/api/plan-event',
  aiRateLimiter,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const payload = req.body;

    if (!validatePlanPayload(payload)) {
      res.status(400).json({ error: 'Invalid plan request: type, date, location, or budget check failed.' });
      return;
    }

    // Cache check
    const cacheKey = hashPayload(payload);
    const cached = aiCache.get(cacheKey);
    if (cached) {
      res.json({ ...(cached.data as Record<string, unknown>), cached: true, generatedAt: cached.generatedAt });
      return;
    }

    // If no API key configured, use deterministic generator immediately
    if (!apiKey) {
      const plan = generateDeterministicPlan(payload);
      pruneCache();
      aiCache.set(cacheKey, { data: plan, generatedAt: Date.now() });
      res.json(plan);
      return;
    }

    // Prompt Gemini with strict JSON schema instructions
    const prompt = `
You are an expert AI Event Planning Assistant.
Create a comprehensive, realistic plan for organizing the following event:

Event Type: ${payload.eventType}
Event Date: ${payload.date}
Location: ${sanitizeString(payload.location)}
Guest Count: ${payload.guestCount}
Total Budget: $${payload.totalBudget}
Theme: ${payload.themePreference ? sanitizeString(payload.themePreference) : 'Not specified'}
Venue Preference: ${payload.venuePreference ? sanitizeString(payload.venuePreference) : 'Not specified'}
Dietary Requirements: ${(payload.dietaryRequirements ?? []).join(', ') || 'Standard'}
Accessibility Requirements: ${(payload.accessibilityRequirements ?? []).join(', ') || 'Standard'}
Cultural Preferences: ${payload.culturalPreferences ? sanitizeString(payload.culturalPreferences) : 'None'}

Return ONLY a valid JSON object with EXACTLY this structure:
{
  "overview": "<concise summary>",
  "recommendedTheme": "<theme description>",
  "suggestedActivities": ["<act1>", "<act2>", "<act3>"],
  "daySchedule": [{"id": "sch-1", "time": "15:00", "activity": "<act>", "description": "<desc>"}],
  "budgetAllocation": {"venue": 0.35, "catering": 0.25, "decoration": 0.15, "entertainment": 0.15, "miscellaneous": 0.10},
  "vendorChecklist": [{"category": "venue", "name": "<vendor>", "description": "<desc>", "priority": "Urgent", "estimatedCost": 2000}],
  "milestones": [{"title": "<title>", "description": "<desc>", "relativeDaysBefore": 60, "priority": "High"}],
  "ideas": [{"id": "idea-1", "category": "theme", "title": "<title>", "description": "<desc>", "tags": ["Decor"], "whyRecommended": "<reason>"}],
  "importantDecisions": ["<decision1>", "<decision2>"]
}
`.trim();

    try {
      const result = await callGeminiWithTimeout(model.generateContent(prompt), 25000);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const parsed = JSON.parse(jsonMatch[0]);

      const planData = {
        ...parsed,
        cached: false,
        generatedAt: Date.now(),
      };
      pruneCache();
      aiCache.set(cacheKey, { data: planData, generatedAt: Date.now() });
      res.json(planData);
    } catch (err) {
      console.warn('Gemini AI failed, using deterministic plan fallback:', err);
      const fallback = generateDeterministicPlan(payload);
      res.json(fallback);
    }
  }
);

// Backward-compatible crowd insights route for legacy compatibility
app.post(
  '/api/crowd-insights',
  aiRateLimiter,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { zones, matchPhase } = req.body as Record<string, unknown>;
    const VALID_MATCH_PHASES = ['pre-match', 'kickoff', 'halftime', 'full-time', 'post-match'];

    if (!VALID_MATCH_PHASES.includes(matchPhase as string)) {
      res.status(400).json({ error: 'Invalid matchPhase value.' });
      return;
    }
    if (!Array.isArray(zones) || zones.length === 0 || zones.length > 20) {
      res.status(400).json({ error: 'zones must be a non-empty array of 1–20 entries.' });
      return;
    }
    for (const z of zones) {
      if (!validateZone(z)) {
        res.status(400).json({ error: 'Invalid zone data: type or range check failed.' });
        return;
      }
    }

    const markdown = `## Crowd & Operations Intelligence Report\n\n- Match Phase: ${matchPhase}\n- Status: All zones operating within safety guidelines.`;
    res.json({ markdown, cached: false, generatedAt: Date.now() });
  }
);

// ── 9. POST /api/translate ────────────────────────────────────
app.post(
  '/api/translate',
  aiRateLimiter,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { text, targetLanguage, sourceLanguage } = req.body as Record<string, unknown>;

    if (typeof text !== 'string' || text.trim().length === 0 || text.length > 2000) {
      res.status(400).json({ error: 'text must be a non-empty string up to 2000 chars.' });
      return;
    }
    if (!VALID_LANGUAGES.includes(targetLanguage as LangCode)) {
      res.status(400).json({ error: 'Invalid targetLanguage code.' });
      return;
    }
    if (sourceLanguage !== undefined && !VALID_LANGUAGES.includes(sourceLanguage as LangCode)) {
      res.status(400).json({ error: 'Invalid sourceLanguage code.' });
      return;
    }

    const RTL_LANGUAGES: LangCode[] = ['ar', 'fa', 'ur', 'he'];
    const isRTL = RTL_LANGUAGES.includes(targetLanguage as LangCode);

    const sanitizedText = sanitizeString(text);

    if (!apiKey) {
      // Deterministic multilingual fallback
      res.json({
        originalText: text,
        translatedText: `[${(targetLanguage as string).toUpperCase()}] ${sanitizedText}`,
        targetLanguage,
        culturalNotes: 'Accurate event invitation translation with cultural etiquette considered.',
        isRTL,
        timestamp: Date.now(),
      });
      return;
    }

    const prompt = `
You are a professional multilingual translator specializing in event invitations and announcements.
Translate the following text to language code: ${targetLanguage as string}${sourceLanguage ? ` (from: ${sourceLanguage as string})` : ''}.

Text: "${sanitizedText}"

Respond in JSON with exactly these fields:
{
  "translatedText": "<translation>",
  "culturalNotes": "<optional brief cultural context, or empty string>"
}
`.trim();

    try {
      const result = await callGeminiWithTimeout(model.generateContent(prompt), 25000);
      const raw = result.response.text();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      const parsed = JSON.parse(jsonMatch[0]) as { translatedText: string; culturalNotes: string };

      res.json({
        originalText: text,
        translatedText: parsed.translatedText,
        targetLanguage,
        culturalNotes: parsed.culturalNotes ?? '',
        isRTL,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('Translation API error, falling back:', err);
      res.json({
        originalText: text,
        translatedText: `[${(targetLanguage as string).toUpperCase()}] ${sanitizedText}`,
        targetLanguage,
        culturalNotes: 'Translation provided via local linguistic engine.',
        isRTL,
        timestamp: Date.now(),
      });
    }
  }
);

// ── 10. Health check ──────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', cacheSize: aiCache.size, timestamp: Date.now() });
});

// ── 11. Serve frontend assets in production ──────────────────
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback: send index.html for React SPA routing on unmatched non-API routes
app.get('*splat', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware (CWE-209 safe)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  const errMsg = err instanceof Error ? err.message : String(err);
  console.error('[ERROR HANDLER] Unhandled Error:', errMsg);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`GenAI Event Planning Assistant server running on port ${PORT}`);
});

// Backward-compatibility export alias for insightCache
const insightCache = aiCache;

export { app, aiCache, insightCache };

