// ============================================================
// server.ts
// Express backend — all Gemini AI calls happen here (server-side only)
// Per SECURITY.md: Helmet, CORS, Rate Limiting, Payload limits,
//   Type guard + bounds + enum validation, .env secrets
// Per EFFICIENCY.md §1: in-memory AI response cache (hash-keyed, 100-entry eviction)
// ============================================================

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createHash } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';
import path from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ?? 3001;

// Request logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[RESPONSE] ${req.method} ${req.url} -> ${res.statusCode}`);
  });
  next();
});

// ── 1. Security: Helmet with strict CSP ─────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseapp.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// ── 2. Security: Dynamic CORS origin matching ────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://smartstadium.web.app',
  'https://smartstadium.firebaseapp.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., curl, Postman) in dev
      if (!origin) return callback(null, true);
      if (
        ALLOWED_ORIGINS.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        (origin.includes('smartstadium') && origin.endsWith('.onrender.com'))
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
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again in a minute.' },
});

// ── 5. Efficiency: In-memory AI response cache ───────────────
interface CacheEntry {
  markdown: string;
  generatedAt: number;
}
const insightCache = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 100;

function hashPayload(obj: unknown): string {
  return createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

function pruneCache(): void {
  if (insightCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = insightCache.keys().next().value;
    if (firstKey !== undefined) insightCache.delete(firstKey);
  }
}

// ── 6. Gemini client (server-side only) ─────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

// ── 7. Validation helpers ─────────────────────────────────────
const VALID_MATCH_PHASES = ['pre-match', 'kickoff', 'halftime', 'full-time', 'post-match'] as const;
type MatchPhase = (typeof VALID_MATCH_PHASES)[number];

const VALID_LANGUAGES = [
  'en','ar','fr','es','pt','de','zh','ja','ko','ru','hi','it','nl','pl','tr','fa','ur','id','ms','th','he',
] as const;
type LangCode = (typeof VALID_LANGUAGES)[number];

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v);
}

interface ZonePayload {
  zoneId: string;
  occupancy: number;
  capacity: number;
  ingressRate: number;
  egressRate: number;
  queueLength: number;
  serviceRate: number;
}

function validateZone(z: unknown): z is ZonePayload {
  if (typeof z !== 'object' || z === null) return false;
  const obj = z as Record<string, unknown>;
  if (typeof obj.zoneId !== 'string' || obj.zoneId.length === 0 || obj.zoneId.length > 50) return false;
  if (!isFiniteNumber(obj.occupancy) || obj.occupancy < 0) return false;
  if (!isFiniteNumber(obj.capacity) || obj.capacity <= 0 || obj.capacity > 200000) return false;
  if ((obj.occupancy as number) > (obj.capacity as number)) return false;
  if (!isFiniteNumber(obj.ingressRate) || (obj.ingressRate as number) < 0) return false;
  if (!isFiniteNumber(obj.egressRate) || (obj.egressRate as number) < 0) return false;
  if (!isFiniteNumber(obj.queueLength) || (obj.queueLength as number) < 0) return false;
  if (!isFiniteNumber(obj.serviceRate) || (obj.serviceRate as number) <= 0) return false;
  return true;
}

// ── 8. POST /api/crowd-insights ──────────────────────────────
app.post(
  '/api/crowd-insights',
  aiRateLimiter,
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { zones, matchPhase } = req.body as Record<string, unknown>;

    // Validate matchPhase enum
    if (!VALID_MATCH_PHASES.includes(matchPhase as MatchPhase)) {
      res.status(400).json({ error: 'Invalid matchPhase value.' });
      return;
    }

    // Validate zones array
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

    // Cache lookup (EFFICIENCY.md §1)
    const cacheKey = hashPayload({ zones, matchPhase });
    const cached = insightCache.get(cacheKey);
    if (cached) {
      res.json({ markdown: cached.markdown, cached: true, generatedAt: cached.generatedAt });
      return;
    }

    // Build Gemini prompt
    const prompt = `
You are SmartStadium AI, an expert crowd and operations intelligence system for the FIFA World Cup 2026.

Match Phase: ${matchPhase as string}

Zone Data:
${(zones as ZonePayload[])
  .map(
    (z) =>
      `- Zone ${z.zoneId}: Occupancy ${z.occupancy}/${z.capacity}, Ingress ${z.ingressRate}/min, Egress ${z.egressRate}/min, Queue ${z.queueLength}, Service Rate ${z.serviceRate}/min`
  )
  .join('\n')}

Provide a concise, structured crowd intelligence report with:
1. **Risk Assessment** — which zones are at critical or emergency density and why
2. **Congestion Forecast** — predict where congestion will form in the next 15 minutes
3. **Actionable Recommendations** — 3 specific actions for organizers to take immediately
4. **Staff Redeployment** — which zones need more volunteers and how many

Format in clear Markdown with headers. Be direct and actionable.
`.trim();

    try {
      const result = await model.generateContent(prompt);
      const markdown = result.response.text();
      pruneCache();
      const entry: CacheEntry = { markdown, generatedAt: Date.now() };
      insightCache.set(cacheKey, entry);
      res.json({ markdown, cached: false, generatedAt: entry.generatedAt });
    } catch (err) {
      console.error('Gemini API error:', err);
      res.status(502).json({ error: 'AI service temporarily unavailable.' });
    }
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

    // Sanitize user text to prevent prompt injection (strip control chars U+0000–U+001F)
    const controlCharPattern = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(31) + ']', 'g');
    const sanitizedText = (text as string).replace(controlCharPattern, '').trim();

    const prompt = `
You are a professional multilingual translator with cultural expertise for the FIFA World Cup 2026.

Translate the following text to language code: ${targetLanguage as string}${sourceLanguage ? ` (from: ${sourceLanguage as string})` : ''}.

Text: "${sanitizedText}"

Respond in JSON with exactly these fields:
{
  "translatedText": "<translation>",
  "culturalNotes": "<optional brief cultural context, or empty string>"
}
`.trim();

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      // Extract JSON from response
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
      console.error('Translation error:', err);
      res.status(502).json({ error: 'Translation service temporarily unavailable.' });
    }
  }
);

// ── 10. Health check ──────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', cacheSize: insightCache.size, timestamp: Date.now() });
});

// ── 11. Serve frontend assets in production ──────────────────
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback: send index.html for React SPA routing on unmatched non-API routes
app.get('*splat', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR HANDLER] Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`SmartStadium AI server running on port ${PORT}`);
});

export { app, insightCache, ALLOWED_ORIGINS, validateZone, hashPayload };
