import 'dotenv/config';
import { ALLOWED_ORIGINS, VALID_EVENT_TYPES, EventTypeString, VALID_LANGUAGES, LangCode, PlanPayload, validatePlanPayload, validateZone, hashPayload } from './src/lib/serverValidation';
declare const app: import("express-serve-static-core").Express;
interface CacheEntry<T = unknown> {
    data: T;
    generatedAt: number;
}
declare const aiCache: Map<string, CacheEntry<unknown>>;
export { ALLOWED_ORIGINS, VALID_EVENT_TYPES, EventTypeString, VALID_LANGUAGES, LangCode, PlanPayload, validatePlanPayload, validateZone, hashPayload, };
declare const insightCache: Map<string, CacheEntry<unknown>>;
export { app, aiCache, insightCache };
