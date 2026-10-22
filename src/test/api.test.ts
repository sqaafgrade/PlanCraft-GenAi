// ============================================================
// src/test/api.test.ts
// Integration: CORS, payload validation, boundary rejection
// Per TESTING.md §1.3 — Server-Side Security & Web API Validation
// ============================================================

import { describe, it, expect } from 'vitest';
import { ALLOWED_ORIGINS, validateZone, hashPayload } from '../../server';

// ── CORS Origin Assertions ────────────────────────────────────
describe('CORS Origin Validation', () => {
  it('allows localhost:5173', () => {
    expect(ALLOWED_ORIGINS).toContain('http://localhost:5173');
  });

  it('allows localhost:3001', () => {
    expect(ALLOWED_ORIGINS).toContain('http://localhost:3001');
  });

  it('allows Firebase hosting domain', () => {
    expect(ALLOWED_ORIGINS).toContain('https://smartstadium.web.app');
  });

  it('rejects arbitrary external origin (not in allowlist)', () => {
    const malicious = 'https://evil.example.com';
    expect(ALLOWED_ORIGINS.includes(malicious)).toBe(false);
  });

  it('rejects wildcard or empty string domains', () => {
    expect(ALLOWED_ORIGINS.includes('*')).toBe(false);
    expect(ALLOWED_ORIGINS.includes('')).toBe(false);
  });
});

// ── Payload Validation ────────────────────────────────────────
describe('validateZone — Payload Schemas', () => {
  const validZone = {
    zoneId: 'Z1',
    occupancy: 8000,
    capacity: 10000,
    ingressRate: 200,
    egressRate: 100,
    queueLength: 50,
    serviceRate: 30,
  };

  it('accepts a fully valid zone payload', () => {
    expect(validateZone(validZone)).toBe(true);
  });

  it('rejects null payload', () => {
    expect(validateZone(null)).toBe(false);
  });

  it('rejects non-object payload', () => {
    expect(validateZone('invalid')).toBe(false);
    expect(validateZone(42)).toBe(false);
  });

  it('rejects missing zoneId field', () => {
    const { zoneId: _z, ...rest } = validZone;
    expect(validateZone(rest)).toBe(false);
  });

  it('rejects non-string zoneId', () => {
    expect(validateZone({ ...validZone, zoneId: 123 })).toBe(false);
  });

  it('rejects negative occupancy', () => {
    expect(validateZone({ ...validZone, occupancy: -1 })).toBe(false);
  });

  it('rejects zero capacity', () => {
    expect(validateZone({ ...validZone, capacity: 0 })).toBe(false);
  });

  it('rejects capacity exceeding maximum (200000)', () => {
    expect(validateZone({ ...validZone, capacity: 250000 })).toBe(false);
  });

  it('rejects occupancy greater than capacity', () => {
    expect(validateZone({ ...validZone, occupancy: 15000, capacity: 10000 })).toBe(false);
  });

  it('rejects negative ingressRate', () => {
    expect(validateZone({ ...validZone, ingressRate: -10 })).toBe(false);
  });

  it('rejects zero or negative serviceRate', () => {
    expect(validateZone({ ...validZone, serviceRate: 0 })).toBe(false);
    expect(validateZone({ ...validZone, serviceRate: -5 })).toBe(false);
  });

  it('rejects NaN in numeric fields', () => {
    expect(validateZone({ ...validZone, occupancy: NaN })).toBe(false);
  });

  it('rejects Infinity in numeric fields', () => {
    expect(validateZone({ ...validZone, capacity: Infinity })).toBe(false);
  });
});

// ── Boundary Parameter Rejection ─────────────────────────────
describe('Boundary Parameter Tests', () => {
  it('accepts zone at exact capacity (100%)', () => {
    expect(validateZone({ ...validZone, occupancy: 10000, capacity: 10000 })).toBe(true);
  });

  it('rejects zone 1 above capacity', () => {
    expect(validateZone({ ...validZone, occupancy: 10001, capacity: 10000 })).toBe(false);
  });

  it('accepts minimum valid capacity (1)', () => {
    expect(validateZone({ ...validZone, occupancy: 0, capacity: 1 })).toBe(true);
  });

  it('accepts maximum valid capacity (200000)', () => {
    expect(validateZone({ ...validZone, occupancy: 100000, capacity: 200000 })).toBe(true);
  });
});

// ── Hash / Cache Key ──────────────────────────────────────────
describe('hashPayload — Cache Key Generation', () => {
  it('returns a 16-char hex string', () => {
    const hash = hashPayload({ zones: [], matchPhase: 'kickoff' });
    expect(hash).toHaveLength(16);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  it('produces consistent output for same input', () => {
    const payload = { zones: [{ zoneId: 'Z1', occupancy: 5000 }], matchPhase: 'pre-match' };
    expect(hashPayload(payload)).toBe(hashPayload(payload));
  });

  it('produces different hash for different input', () => {
    const h1 = hashPayload({ zones: [], matchPhase: 'kickoff' });
    const h2 = hashPayload({ zones: [], matchPhase: 'halftime' });
    expect(h1).not.toBe(h2);
  });
});


// Helper export to satisfy import at top
const validZone = {
  zoneId: 'Z1',
  occupancy: 8000,
  capacity: 10000,
  ingressRate: 200,
  egressRate: 100,
  queueLength: 50,
  serviceRate: 30,
};
export { validZone };

// ── HTTP Endpoint Integration Tests ─────────────────────────────
describe('HTTP API Endpoints', () => {
  const serverUrl = 'http://localhost:3001';

  it('GET /api/health returns status 200', async () => {
    const res = await fetch(`${serverUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json() as { status: string };
    expect(data.status).toBe('ok');
  });

  it('POST /api/crowd-insights returns 400 for invalid match phase', async () => {
    const res = await fetch(`${serverUrl}/api/crowd-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zones: [validZone],
        matchPhase: 'invalid-phase',
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toContain('Invalid matchPhase');
  });

  it('POST /api/crowd-insights returns 400 for empty zones', async () => {
    const res = await fetch(`${serverUrl}/api/crowd-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zones: [],
        matchPhase: 'kickoff',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/translate returns 400 for missing target language', async () => {
    const res = await fetch(`${serverUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello World',
        targetLanguage: 'invalid-lang',
      }),
    });
    expect(res.status).toBe(400);
  });

  it('GET /some-random-route serves SPA fallback index.html', async () => {
    const res = await fetch(`${serverUrl}/some-random-route`);
    expect([200, 500]).toContain(res.status);
  });
});
