// ============================================================
// src/lib/serverValidation.ts
// Shared domain validation, CORS allowlists, and hashing logic
// Used by server.ts and verified by integration tests
// ============================================================

export const ALLOWED_ORIGINS: readonly string[] = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://smartstadium.web.app',
  'https://smartstadium.firebaseapp.com',
  'https://genai-planner.web.app',
  'https://genai-planner.firebaseapp.com',
];

export const VALID_EVENT_TYPES = [
  'wedding',
  'birthday',
  'community',
  'anniversary',
  'corporate',
  'party',
] as const;
export type EventTypeString = (typeof VALID_EVENT_TYPES)[number];

export const VALID_LANGUAGES = [
  'en', 'ar', 'fr', 'es', 'pt', 'de', 'zh', 'ja', 'ko', 'ru', 'hi',
  'it', 'nl', 'pl', 'tr', 'fa', 'ur', 'id', 'ms', 'th', 'he',
] as const;
export type LangCode = (typeof VALID_LANGUAGES)[number];

export function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export function sanitizeString(input: string): string {
  // Strip control chars U+0000–U+001F to mitigate prompt injection
  const controlCharPattern = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(31) + ']', 'g');
  return input.replace(controlCharPattern, '').trim();
}

export interface PlanPayload {
  eventType: EventTypeString;
  date: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  durationHours?: number;
  venuePreference?: string;
  themePreference?: string;
  dietaryRequirements?: string[];
  accessibilityRequirements?: string[];
  culturalPreferences?: string;
  specialRequests?: string;
}

export function validatePlanPayload(p: unknown): p is PlanPayload {
  if (typeof p !== 'object' || p === null) return false;
  const obj = p as Record<string, unknown>;

  if (typeof obj.eventType !== 'string' || !VALID_EVENT_TYPES.includes(obj.eventType as EventTypeString)) {
    return false;
  }
  if (typeof obj.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) {
    return false;
  }
  if (typeof obj.location !== 'string' || obj.location.trim().length === 0 || obj.location.length > 100) {
    return false;
  }
  if (!isFiniteNumber(obj.guestCount) || obj.guestCount <= 0 || obj.guestCount > 100000) {
    return false;
  }
  if (!isFiniteNumber(obj.totalBudget) || obj.totalBudget < 0 || obj.totalBudget > 100_000_000) {
    return false;
  }
  if (obj.durationHours !== undefined && (!isFiniteNumber(obj.durationHours) || obj.durationHours <= 0 || obj.durationHours > 72)) {
    return false;
  }
  if (obj.venuePreference !== undefined && (typeof obj.venuePreference !== 'string' || obj.venuePreference.length > 200)) {
    return false;
  }
  if (obj.themePreference !== undefined && (typeof obj.themePreference !== 'string' || obj.themePreference.length > 200)) {
    return false;
  }
  if (obj.dietaryRequirements !== undefined && !Array.isArray(obj.dietaryRequirements)) {
    return false;
  }
  if (obj.accessibilityRequirements !== undefined && !Array.isArray(obj.accessibilityRequirements)) {
    return false;
  }
  return true;
}

// Backward-compatible zone validator for legacy test preservation
export function validateZone(z: unknown): boolean {
  if (typeof z !== 'object' || z === null) return false;
  const obj = z as Record<string, unknown>;
  if (typeof obj.zoneId !== 'string' || obj.zoneId.length === 0 || obj.zoneId.length > 50) return false;
  if (!isFiniteNumber(obj.occupancy) || (obj.occupancy as number) < 0) return false;
  if (!isFiniteNumber(obj.capacity) || (obj.capacity as number) <= 0 || (obj.capacity as number) > 200000) return false;
  if ((obj.occupancy as number) > (obj.capacity as number)) return false;
  if (!isFiniteNumber(obj.ingressRate) || (obj.ingressRate as number) < 0) return false;
  if (!isFiniteNumber(obj.egressRate) || (obj.egressRate as number) < 0) return false;
  if (!isFiniteNumber(obj.queueLength) || (obj.queueLength as number) < 0) return false;
  if (!isFiniteNumber(obj.serviceRate) || (obj.serviceRate as number) <= 0) return false;
  return true;
}

export function hashPayload(obj: unknown): string {
  const str = JSON.stringify(obj);
  let h1 = 0x811c9dc5;
  let h2 = 0x27d4eb2f;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x5bd1e995);
  }
  const s1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const s2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return (s1 + s2).slice(0, 16);
}
