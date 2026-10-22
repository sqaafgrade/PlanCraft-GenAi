import 'dotenv/config';
declare const app: import("express-serve-static-core").Express;
declare const ALLOWED_ORIGINS: string[];
interface CacheEntry<T = unknown> {
    data: T;
    generatedAt: number;
}
declare const aiCache: Map<string, CacheEntry<unknown>>;
declare function hashPayload(obj: unknown): string;
export declare const VALID_EVENT_TYPES: readonly ["wedding", "birthday", "community", "anniversary", "corporate", "party"];
export type EventTypeString = (typeof VALID_EVENT_TYPES)[number];
export declare const VALID_LANGUAGES: readonly ["en", "ar", "fr", "es", "pt", "de", "zh", "ja", "ko", "ru", "hi", "it", "nl", "pl", "tr", "fa", "ur", "id", "ms", "th", "he"];
export type LangCode = (typeof VALID_LANGUAGES)[number];
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
export declare function validatePlanPayload(p: unknown): p is PlanPayload;
export declare function validateZone(z: unknown): boolean;
declare const insightCache: Map<string, CacheEntry<unknown>>;
export { app, aiCache, insightCache, ALLOWED_ORIGINS, hashPayload };
