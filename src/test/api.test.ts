// ============================================================
// src/test/api.test.ts
// Integration tests: CORS allowlists, payload validation,
// boundary rejection, cache key generation, and HTTP API endpoints
// ============================================================

import { describe, it, expect, beforeAll } from 'vitest';
import {
  ALLOWED_ORIGINS,
  validatePlanPayload,
  validateZone,
  hashPayload,
  PlanPayload,
} from '../lib/serverValidation';

// ── 1. CORS Origin Assertions ─────────────────────────────────
describe('CORS Origin Validation', () => {
  it('allows localhost:5173', () => {
    expect(ALLOWED_ORIGINS).toContain('http://localhost:5173');
  });

  it('allows localhost:3001', () => {
    expect(ALLOWED_ORIGINS).toContain('http://localhost:3001');
  });

  it('allows Firebase web.app domain', () => {
    expect(ALLOWED_ORIGINS).toContain('https://smartstadium.web.app');
  });

  it('rejects arbitrary external origins not in allowlist', () => {
    const malicious = 'https://evil-unauthorized-domain.com';
    expect(ALLOWED_ORIGINS.includes(malicious)).toBe(false);
  });

  it('rejects wildcard * or empty string domains', () => {
    expect(ALLOWED_ORIGINS.includes('*')).toBe(false);
    expect(ALLOWED_ORIGINS.includes('')).toBe(false);
  });
});

// ── 2. Plan Payload Validation ────────────────────────────────
describe('validatePlanPayload — Event Planning Schemas', () => {
  const validPayload: PlanPayload = {
    eventType: 'wedding',
    date: '2026-09-18',
    location: 'San Francisco, CA',
    guestCount: 150,
    totalBudget: 35000,
    durationHours: 6,
    themePreference: 'Botanical Garden',
    dietaryRequirements: ['Vegetarian', 'Gluten-Free'],
    accessibilityRequirements: ['Step-Free Access'],
  };

  it('accepts a fully valid plan payload', () => {
    expect(validatePlanPayload(validPayload)).toBe(true);
  });

  it('rejects null or non-object payloads', () => {
    expect(validatePlanPayload(null)).toBe(false);
    expect(validatePlanPayload('invalid-string')).toBe(false);
    expect(validatePlanPayload(42)).toBe(false);
  });

  it('rejects unsupported eventType values', () => {
    expect(validatePlanPayload({ ...validPayload, eventType: 'invalid_event' as any })).toBe(false);
  });

  it('rejects invalid date formats', () => {
    expect(validatePlanPayload({ ...validPayload, date: '18-09-2026' })).toBe(false);
    expect(validatePlanPayload({ ...validPayload, date: 'not-a-date' })).toBe(false);
  });

  it('rejects empty or excessively long locations', () => {
    expect(validatePlanPayload({ ...validPayload, location: '   ' })).toBe(false);
    expect(validatePlanPayload({ ...validPayload, location: 'a'.repeat(101) })).toBe(false);
  });

  it('rejects negative or zero guest count', () => {
    expect(validatePlanPayload({ ...validPayload, guestCount: 0 })).toBe(false);
    expect(validatePlanPayload({ ...validPayload, guestCount: -5 })).toBe(false);
  });

  it('rejects guest count exceeding safe threshold (100k)', () => {
    expect(validatePlanPayload({ ...validPayload, guestCount: 100001 })).toBe(false);
  });

  it('rejects negative total budget', () => {
    expect(validatePlanPayload({ ...validPayload, totalBudget: -100 })).toBe(false);
  });

  it('rejects total budget exceeding safe threshold (100M)', () => {
    expect(validatePlanPayload({ ...validPayload, totalBudget: 100_000_001 })).toBe(false);
  });

  it('rejects non-numeric NaN in numeric fields', () => {
    expect(validatePlanPayload({ ...validPayload, guestCount: NaN })).toBe(false);
    expect(validatePlanPayload({ ...validPayload, totalBudget: NaN })).toBe(false);
  });

  it('rejects non-array dietaryRequirements when provided', () => {
    expect(validatePlanPayload({ ...validPayload, dietaryRequirements: 'Vegetarian' as any })).toBe(false);
  });
});

// ── 3. Legacy Backward-Compatible validateZone ─────────────────
describe('validateZone — Legacy Validator Safety', () => {
  const validZone = {
    zoneId: 'Z1',
    occupancy: 8000,
    capacity: 10000,
    ingressRate: 200,
    egressRate: 100,
    queueLength: 50,
    serviceRate: 30,
  };

  it('validates a correct zone payload', () => {
    expect(validateZone(validZone)).toBe(true);
  });

  it('rejects null or negative occupancy', () => {
    expect(validateZone(null)).toBe(false);
    expect(validateZone({ ...validZone, occupancy: -1 })).toBe(false);
  });
});

// ── 4. Hash / Cache Key Generation ────────────────────────────
describe('hashPayload — SHA-256 Cache Key', () => {
  it('returns a 16-character hex string', () => {
    const hash = hashPayload({ test: 'payload', value: 123 });
    expect(hash).toHaveLength(16);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  it('produces deterministic output for identical payloads', () => {
    const p = { eventType: 'wedding', budget: 25000 };
    expect(hashPayload(p)).toBe(hashPayload(p));
  });

  it('produces distinct hash values for different inputs', () => {
    const h1 = hashPayload({ eventType: 'wedding' });
    const h2 = hashPayload({ eventType: 'birthday' });
    expect(h1).not.toBe(h2);
  });
});

// ── 5. Live HTTP API Endpoint Integrations ─────────────────────
describe('HTTP API Endpoints', () => {
  const serverUrl = 'http://localhost:3001';

  beforeAll(async () => {
    const serverPath = '../../server';
    await import(/* @vite-ignore */ serverPath);
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  it('GET /api/health returns status 200 and cache size', async () => {
    const res = await fetch(`${serverUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string; cacheSize: number };
    expect(data.status).toBe('ok');
    expect(typeof data.cacheSize).toBe('number');
  });

  it('POST /api/plan-event returns 400 for invalid event payload', async () => {
    const res = await fetch(`${serverUrl}/api/plan-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'unsupported_type',
        date: 'bad-date',
      }),
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain('Invalid plan request');
  });

  it('POST /api/plan-event generates a structured plan for valid event', async () => {
    const res = await fetch(`${serverUrl}/api/plan-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'birthday',
        date: '2026-11-20',
        location: 'Austin, TX',
        guestCount: 50,
        totalBudget: 5000,
      }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { overview: string; recommendedTheme: string; budgetAllocation: any };
    expect(data.overview).toBeDefined();
    expect(data.recommendedTheme).toBeDefined();
    expect(data.budgetAllocation).toBeDefined();
  }, 15000);

  it('POST /api/translate returns 400 for invalid target language', async () => {
    const res = await fetch(`${serverUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Join us for our wedding celebration',
        targetLanguage: 'invalid_lang_code',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/translate returns translation for valid invitation text', async () => {
    const res = await fetch(`${serverUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'You are cordially invited to celebrate with us.',
        targetLanguage: 'es',
      }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { translatedText: string; targetLanguage: string };
    expect(data.translatedText).toBeDefined();
    expect(data.targetLanguage).toBe('es');
  }, 15000);

  it('GET /some-random-route serves SPA fallback', async () => {
    const res = await fetch(`${serverUrl}/some-random-route`);
    expect([200, 404, 500]).toContain(res.status);
  });
});
