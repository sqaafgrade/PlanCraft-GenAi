# Code Quality Guidelines — PlanCraft GenAI

## 1. Directory Structure & Modular Architecture
We maintain strict separation of concerns across atomic components, custom React hooks, pure compute engines, storage services, type systems, and automated tests:

*   `src/components/` — Modular, atomic React components organized by feature domain:
    *   `Dashboard/` — `EventDashboard.tsx` (KPI metrics, countdown, active event overview)
    *   `Assistant/` — `AIPlanningAssistant.tsx` (Interactive requirements gathering and plan generation)
    *   `Budget/` — `BudgetManager.tsx` (Category allocations, itemized table, overrun warnings)
    *   `Timeline/` — `TimelineSchedule.tsx` (Milestones, date ordering, event-day schedule)
    *   `Vendors/` — `VendorChecklist.tsx` (Customized supplier checklist, status transitions)
    *   `Ideas/` — `PersonalizedIdeas.tsx` (Categorized suggestions with "Why this fits" rationale)
    *   `Multilingual/` — `MultilingualAssistant.tsx` (Invitation translation with RTL detection)
    *   `shared/` — `AlertBanner.tsx` (Accessible priority notifications and overrun banners)
*   `src/hooks/` — Custom hooks encapsulating reactive state and business side-effects:
    *   `useEventPlanning.ts` — GenAI request orchestration and structured plan parsing
    *   `useEventBudget.ts` — Budget items, memoized summary calculations, and allocations
    *   `useEventTimeline.ts` — Milestone deadlines, overdue checks, and task completion
    *   `useVendorChecklist.ts` — Vendor checklist items, verification progress, and status updates
*   `src/lib/` — Pure algorithmic compute engines:
    *   `eventCompute.ts` — Pure mathematical functions (`computeBudgetSummary`, `computeCategoryAllocations`), date arithmetic (`shiftIsoDate`, `calculateDaysRemaining`), vendor progress algorithms, and Dijkstra layout routing.
*   `src/services/` — I/O side effects and data persistence:
    *   `storageService.ts` — Safe JSON parsing, typed localStorage persistence scoped per event.
    *   `firebaseService.ts` — Per-user scoped Firestore synchronization and authentication.
*   `src/types/` — Shared TypeScript declarations and enums (`EventType`, `BudgetCategory`, `VendorStatus`, `TaskPriority`, `AIPlanResponse`, `EventSnapshot`) with zero `any` annotations.
*   `src/test/` — Unit and integration tests (158 tests across 6 suites running in Vitest + JSDOM).

---

## 2. Strict Compiler Configuration
We enforce maximum type safety in `tsconfig.json`:
*   `strict: true` — Full type strictness checking across all modules.
*   `noImplicitAny: true` — Prohibits any variables defaulting to `any`.
*   `strictNullChecks: true` — Restricts unchecked null and undefined operations.
*   `noUnusedLocals: true` & `noUnusedParameters: true` — Prevents dead code and unused arguments.
*   `noEmit: true` — Defer bundling entirely to Vite for optimal tree-shaking and compilation speed.

---

## 3. Linter Configuration (Oxlint)
We enforce automated linting via Oxlint (`.oxlintrc.json`), configured with 103 rules targeting:
*   **React Hooks Rules:** Validates correct dependency arrays in `useMemo` and `useCallback`.
*   **TypeScript Strictness:** Disallows unused imports, variables, and improper assertions.
*   **Performance & Style:** Enforces clean, modern code conventions.
*   *Validation:* `npm run lint` executes across 44 files in ~18ms with **0 warnings and 0 errors**.
