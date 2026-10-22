# Testing Strategy & Verification — PlanCraft GenAI

## 1. Test Architecture & Methodology
PlanCraft GenAI enforces a comprehensive test strategy combining unit math testing, schema boundary checks, HTTP API endpoint validation, JSDOM component rendering, and user event simulation.

We use **Vitest 4.1.10** configured with **JSDOM** and **@testing-library/react**, enabling fast, reliable, parallel test execution in under 4 seconds.

---

## 2. Test Suite Breakdown (158 Total Tests)

```text
Test Files  6 passed (6)
     Tests  158 passed (158)
  Duration  ~3.3 seconds
```

### §2.1 Event Compute Engine (`src/test/event.test.ts` — 39 Tests)
*   **Monetary Amount Validation:** Asserts non-negative finite bounds, rejects NaN, negative numbers, and overflow amounts (>100M).
*   **Budget Summary Arithmetic:** Validates total estimated, actual spent, remaining balance, 10% contingency allocation, and utilization percentages.
*   **Overrun Detection:** Tests that spending exceeding planned totals flags `isOverBudget: true` immediately.
*   **Category Allocations:** Verifies event-type specific distributions (*Weddings, Birthdays, Community Events*).
*   **Date Arithmetic:** Validates ISO `YYYY-MM-DD` strings, shifts dates accurately across months, and computes days remaining.
*   **Milestone Generation:** Tests chronological milestone task generation for weddings, birthdays, and community events.
*   **Vendor Checklist Progress:** Verifies status counts (*completed, confirmed, contacted, not started*) and completion percentages.
*   **Sustainability Scoring:** Evaluates composite eco-friendliness ratings.
*   **Dijkstra Layout Routing:** Tests graph shortest-path routing, loop handling, and unreachable node isolation.

### §2.2 Server Security & Web API Validation (`src/test/api.test.ts` — 34 Tests)
*   **CORS Dynamic Origin Checking:** Tests allowlist inclusion for local development and authorized domains (including Render production domain), verifying rejection of external attackers or wildcard origins.
*   **Plan Payload Type Guards:** Thoroughly tests `validatePlanPayload` with invalid event types, malformed dates, empty locations, out-of-bounds guest counts, negative budgets, and oversized payloads.
*   **Cache Key Determinism:** Validates SHA-256 hash generation consistency and collision resistance.
*   **Prompt Hardening & Sanitization:** Asserts control character stripping, markdown code fence escaping, and UTF-8 preservation.
*   **HTTP Integrations & Teardown:** Asserts live HTTP response codes on Express endpoints (`GET /api/health`, `POST /api/plan-event`, `POST /api/translate`, 404 JSON for unmatched `/api/*`, and SPA catch-all routing) with graceful server shutdown.

### §2.3 Component Layout Rendering (`src/test/rendering.test.tsx` — 20 Tests)
*   Tests that all primary panels (`EventDashboard`, `AIPlanningAssistant`, `BudgetManager`, `TimelineSchedule`, `VendorChecklist`, `PersonalizedIdeas`, `MultilingualAssistant`, `AlertBanner`) render without crashing.
*   Verifies proper presence of headings, metric cards, forms, and empty states.

### §2.4 DOM User Interactions & Invariants (`src/test/dom.test.tsx` — 15 Tests)
*   Simulates realistic user workflows using Testing Library's `fireEvent`:
    *   Form input typing and new expense submission in `BudgetManager`.
    *   Category dropdown filtering.
    *   Custom milestone task creation and checkbox completion toggling in `TimelineSchedule`.
    *   Vendor item additions and status updates in `VendorChecklist`.
    *   Idea category switching and custom idea additions in `PersonalizedIdeas`.
    *   Dietary preference chip toggling in `AIPlanningAssistant`.
    *   Language selection in `MultilingualAssistant`.
    *   Alert dismissal in `AlertBanner`.
    *   WCAG 2.2 Level AA landmark, tabpanel, and role compliance.
    *   Hook invariant verification: `useAppContext` throws when invoked outside provider.

### §2.5 Baseline Stability & Invariant Tests (`stadium.test.ts`, `navigation.test.ts` — 50 Tests)
*   Preserves baseline mathematical logic, Dijkstra route mode filtering, and storage persistence functions.

---

## 3. Test Execution Commands

To execute the complete automated test suite:
```bash
npm run test:run
```

To run continuous test watching during development:
```bash
npm run test
```

To generate an Istanbul/V8 code coverage report:
```bash
npm run test:coverage
```
