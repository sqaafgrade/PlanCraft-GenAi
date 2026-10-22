import 'dotenv/config';
declare const app: import("express-serve-static-core").Express;
declare const ALLOWED_ORIGINS: string[];
interface CacheEntry {
    markdown: string;
    generatedAt: number;
}
declare const insightCache: Map<string, CacheEntry>;
declare function hashPayload(obj: unknown): string;
interface ZonePayload {
    zoneId: string;
    occupancy: number;
    capacity: number;
    ingressRate: number;
    egressRate: number;
    queueLength: number;
    serviceRate: number;
}
declare function validateZone(z: unknown): z is ZonePayload;
export { app, insightCache, ALLOWED_ORIGINS, validateZone, hashPayload };
