# Code Quality Guidelines — SmartStadium AI

## 1. Directory Structure
We maintain strict segregation of components, custom hooks, business logic, typings, and tests:
*   `src/components/` — Modular, atomic React components (divided by feature area).
*   `src/hooks/` — Custom hooks hosting React states and lifecycle side effects.
*   `src/lib/` — Pure algorithmic compute engines (like the Dijkstra pathfinder and sustainability calculators).
*   `src/services/` — I/O side effects, data storage, and external APIs.
*   `src/types/` — Shared TypeScript type declarations and enums.
*   `src/test/` — Unit and integration tests (parallelizing component rendering, logic, and REST checks).

## 2. strict Compiler Options
We force high compiler safety thresholds in `tsconfig.json`:
*   `strict: true` — Full type strictness checks.
*   `noImplicitAny: true` — Flags variables defaulting to `any`.
*   `strictNullChecks: true` — Restricts unchecked null operations.
*   `noUnusedLocals: true` & `noUnusedParameters: true` — Blocks dead code.
*   `noEmit: true` — Restricts compiler artifacts, deferring bundling to Vite.

## 3. Linter Rules (Oxlint)
We integrate Oxlint (`.oxlintrc.json`) configured with modern rules targeting:
*   React Hooks rule compliance (preventing missing dependencies).
*   TypeScript strictness checks.
*   Standard clean-code style verification.
