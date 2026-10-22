# Testing Strategy — SmartStadium AI

## 1. Test Architecture

### §1.1 Component Layout Rendering
*   We use Vitest + JSDOM to test that components render without crashing.
*   Verified in `src/test/rendering.test.tsx` for dashboards, navigators, command centers, and form views.

### §1.2 Logic, Hooks & Pathfinder Tests
*   **Pathfinder:** Dijkstra search verified across diverse edge layouts, disconnected graphs, single-node loops, and mode filters (see `src/test/navigation.test.ts`).
*   **Hooks:** `useNavigationAssist` React hook is fully unit-tested with `@testing-library/react`'s `renderHook`, verifying dynamic state transitions (from, to, mode) and checkpoint logic.

### §1.3 Server-Side Security & Web API Validation
*   CORS dynamic allowlists, parameter range checks, and type guards are verified in `src/test/api.test.ts`.
*   We run local HTTP integrations to assert backend endpoint response statuses (200, 400, 500, etc.).

## 2. Test Execution
To run all tests:
```bash
npm run test:run
```

To run test coverage reporting:
```bash
npm run test:coverage
```

## 3. Coverage Compliance
*   **Logical Libraries:** 100% statement and branch coverage on critical helpers (`stadiumCompute.ts`).
*   **Hooks:** 100% lines/functions coverage on the core navigation routing state.
