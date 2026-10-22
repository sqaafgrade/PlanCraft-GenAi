# Efficiency & Performance — SmartStadium AI

## 1. Backend Caching
*   **Challenge:** Repeated GenAI requests for identical telemetry payloads degrade response times and increase Gemini API costs.
*   **Solution:** We use an in-memory SHA-256 hash-keyed caching dictionary (`insightCache`) inside `server.ts`.
*   **Eviction:** We enforce a maximum of 100 entries. When the cache limit is reached, the oldest entries are evicted (LRU style), preventing server memory leaks.

## 2. Frontend State Optimization
*   **Memoization:** We use React `useMemo` and `useCallback` hooks extensively (e.g. in `useStadiumAnalytics.ts` and component render trees) to prevent unnecessary re-computations of crowd density and transit load lists during render cycles.
*   **Rerender Prevention:** Sub-components like `VenueNavigator`, `MultilingualAssistant`, and others are wrapped in `React.memo` to restrict rendering to cases where props actually change.

## 3. Native Render Sparklines
*   **Optimization:** Instead of loading heavy third-party charting libraries (which balloon the production JS bundle sizes and slow down load speeds), we render trend sparklines using lightweight, responsive inline SVGs (`Sparkline` in `SustainabilityDashboard.tsx`).
