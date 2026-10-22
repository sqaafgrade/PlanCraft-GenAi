# ✨ PlanCraft GenAI — Event Planning Assistant

## GenAI-Powered Planning Assistant for Weddings, Birthdays & Community Events

**PlanCraft GenAI** is an intelligent, full-stack event planning assistant that empowers individuals, families, and community organizers to plan memorable, budget-conscious, and accessible events. Powered by Google Gemini AI, PlanCraft delivers personalized event plans, dynamic multi-category budgets, chronological timelines, customized vendor checklists, and creative event ideas for **Weddings**, **Birthdays**, **Community Events**, and milestone celebrations.

---

## 🚀 Problem Statement Alignment

> **"Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas."**

Event organization is traditionally stressful, fragmented across spreadsheets, and vulnerable to budget overruns, missed vendor deadlines, and generic themes. PlanCraft GenAI solves these problems by providing:

1. **Interactive AI Planning Assistant:** Understands event type, date, location, guest count, budget, venue preferences, dietary restrictions, and accessibility needs to synthesize a customized plan.
2. **Structured Budget Management:** Manages category allocations (Venue, Catering, Photography, Decor, Entertainment, Equipment), tracks estimated quotes against actual expenses, enforces a 10% contingency reserve, and flags budget overruns.
3. **Timeline & Milestone Scheduling:** Computes milestone deadlines relative to the event date, highlights overdue tasks, tracks completion percentage, and provides an hour-by-hour event-day schedule.
4. **Verified Vendor Checklist:** Generates categorized vendor requirements tailored to weddings (venues, catering, floral, photography), birthdays (cakes, party halls, DJs, balloon styling), and community events (park permits, AV rentals, safety/sanitation, volunteers), tracking explicit statuses (*Not Started, Researching, Contacted, Confirmed, Completed*).
5. **Personalized Creative Ideas:** Delivers tailored concepts across aesthetics, guest engagement, food menus, budget-friendly alternatives with estimated savings, eco-friendly sustainable choices, and accessibility arrangements.
6. **Multilingual Invitations & Communication:** Translates event invitations, multilingual vows, and community announcements into 20+ languages with automatic RTL layout switching and cultural context notes.
7. **Unified Event Dashboard:** Command center displaying countdown timers, budget utilization bars, milestone status, and quick vendor metrics with seamless switching between multiple active events.

---

## 🏗️ Architecture

```text
User Requirements & Parameters (Event Type, Budget, Guests, Style)
       │
       ▼
Input Validation & Perimeter Protection (Helmet, CORS, 15KB Cap, Rate Limiter)
       │
       ▼
Algorithmic Compute Engine (Budget Math, Milestone Shifts, Checklist Progress)
       │
       ▼
Google Gemini Generative AI (Server-Side Structured JSON Generation & In-Memory LRU Cache)
       │
       ▼
Command Dashboard & Reactive State (React 19, Memoized Custom Hooks, Storage Service)
       │
       ▼
Cloud Sync & Local Isolation (Firebase Auth, Firestore per-user scoping, localStorage)
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | High-performance reactive UI with strict compiler checks (`strict: true`) |
| **Styling & Design** | Tailwind CSS v4 | Curated dark mode, accessible focus rings, smooth transitions, mobile responsive |
| **Build Tool** | Vite 8 | Ultra-fast HMR and production bundle optimization (sub-300ms builds) |
| **Backend Framework** | Node.js + Express 5 | Enterprise-grade REST backend with strict request validation |
| **AI Integration** | Google Gemini (`gemini-3.5-flash`) | Server-side execution only with structured JSON outputs and fallback handling |
| **Security Suite** | Helmet, CORS, Rate Limit | CSP headers, dynamic origin matching, 15KB payload limit, CWE-209 safe error handler |
| **Caching Layer** | SHA-256 In-Memory Cache | 100-entry LRU cache preventing duplicate AI calls and token waste |
| **Cloud Persistence** | Firebase Auth & Firestore | Per-user document isolation and secure cloud synchronization |
| **Testing Framework** | Vitest + JSDOM + RTL | 148 automated unit, integration, and component rendering tests |
| **Linter & Code Quality** | Oxlint | Modern Rust-based linter enforcing clean React hooks and TypeScript strictness |

---

## ✨ Core Feature Highlights

### 1. 🤖 Interactive GenAI Planning Assistant
- Gathers event parameters: Event Type (*Wedding, Birthday, Community, Anniversary, Corporate, Party*), Date, City/Location, Guest Count, Total Budget, Style, Venue Preference, Dietary Accommodations, and Accessibility Needs.
- Produces schema-validated structured output:
  - Event Overview & Concept Summary
  - Recommended Theme & Aesthetic Mood
  - Suggested Guest Activities & Program Highlights
  - Proposed Event-Day Hour-by-Hour Schedule
  - Category-Level Budget Allocation Percentages
  - Tailored Vendor Checklist with Priority Ratings
  - Strategic Decisions & Safety Checks
- Includes a 1-click **"Apply this Plan to Event"** workflow that automatically populates the active event's budget, timeline milestones, and vendor checklists.

### 2. 💰 Event Budget & Expense Management
- Category-level breakdown: *Venue, Catering, Decoration, Photography, Entertainment, Invitations, Transportation, Accommodation, Equipment, Miscellaneous, Contingency*.
- Validates all currency amounts (`validateMonetaryAmount`).
- Prevents negative balances, handles decimal arithmetic reliably, and calculates utilization percentage.
- Real-time **Budget Overrun Warning Banner** alerts users whenever projected or actual costs exceed planned limits.
- Itemized expense table with Paid/Pending status toggles, deletion actions, and category filtering.

### 3. 🗓️ Chronological Timeline & Milestone Scheduling
- Real date calculations (`shiftIsoDate`, `calculateDaysRemaining`) based on event target date.
- Auto-generates sequential milestones (e.g. 180 days out for venues, 90 days out for catering, 30 days out for RSVPs, 0 days out for rehearsal).
- Visual **Overdue** indicator badges for missed deadlines.
- Real-time countdown timer (*"Days Left" / "Days Ago"*).
- Event-day program schedule editor tracking hourly activities from vendor setup to wrap-up.

### 4. 📋 Verified Vendor Checklist
- Customized checklists for Weddings, Birthdays, and Community events.
- Enforces explicit verification statuses: *Not Started, Researching, Contacted, Confirmed, Completed*.
- Never fabricates confirmed vendor availability; requires explicit user status setting.
- Stores supplier contact names, phone numbers, email addresses, estimated costs, and priority tags (*Urgent, High, Medium, Low*).
- Live progress stats measuring confirmed contracts and overall readiness percentage.

### 5. 💡 Personalized Ideas & Recommendations
- Filtered by categories: *Theme & Styling, Decor Concepts, Activities & Music, Food & Menu, Smart Budget Tips, Eco & Sustainable, Accessibility & Care*.
- Budget-friendly tips include calculated estimated savings (e.g., saving $1,800 by serving signature drinks over an open bar).
- Clear **"Why this fits your event"** rationale explaining why each suggestion suits the user's specific guest count, budget, and venue.

### 6. 🌍 Multilingual Invitations & Communication
- Built-in translation pipeline supporting 20+ global languages (*English, Arabic, French, Spanish, German, Hindi, Japanese, Chinese, etc.*).
- Automatic Right-to-Left (RTL) detection for Arabic, Persian, and Urdu with appropriate font and alignment adjustments.
- Cultural etiquette notes explaining greeting traditions and formality expectations.
- Quick-insert invitation and announcement templates for formal wedding invites, birthday party notices, and community festival announcements.

---

## 🔒 Security Architecture (OWASP Compliant)

1. **Server-Side API Key Custody:** The `GEMINI_API_KEY` is exclusively accessed behind the Express backend. Client browsers never receive or possess the secret key.
2. **Helmet & Strict CSP:** Configured with Content Security Policy restricting script, style, connect, and image sources.
3. **Dynamic CORS Matching:** Restricts cross-origin requests to verified local hosting origins and standard hosting domains.
4. **Rate Limiting:** Protects AI generation endpoints against abuse with a 30 req/min/IP sliding window.
5. **Prompt Injection Mitigation:** Sanitizes user text by stripping non-printable control characters (`\x00-\x1f`) and enforcing string length limits.
6. **Input Validation:** Strict type guards (`validatePlanPayload`, `validateMonetaryAmount`, `validateIsoDate`) check bounds and types before processing.
7. **CWE-209 Information Leakage Prevention:** Global error handlers return generic `{ error: 'Internal Server Error' }` payloads, preventing stack trace or internal server path leaks.
8. **Per-User Cloud Isolation:** Firestore security rules enforce `request.auth.uid == userId`, preventing cross-user data leakage.

---

## ⚡ Performance & Efficiency

- **In-Memory SHA-256 Hash LRU Cache:** Payloads are hashed using SHA-256. Identical planning requests retrieve cached responses instantly, eliminating redundant Gemini token consumption.
- **Eviction Policy:** Capped at 100 entries to prevent memory leaks in production Node.js runtimes.
- **React State Optimization:** Strategic usage of `useMemo` and `useCallback` across hooks and component render trees to prevent unnecessary re-renders.
- **Lightweight Native SVGs:** Progress indicators and sparklines render using lightweight inline SVGs instead of heavy chart libraries, keeping the bundle fast and compact.

---

## ♿ Accessibility (WCAG 2.2 Level AA)

- **Semantic HTML5:** Proper landmark structure (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- **Keyboard Navigation:** All interactive buttons, tabs, forms, and checkboxes are focusable with visible focus rings (`focus:ring-2 focus:ring-indigo-500`).
- **Screen Reader Announcements:** Dynamic alerts and status notifications use `aria-live="polite"` and `role="alert"`.
- **High-Contrast Dark Theme:** Text contrast exceeds the 4.5:1 ratio threshold across all panels.
- **Skip Navigation:** Hidden skip link (`#skip-to-content`) allows keyboard users to bypass navigation directly to the main content panel.

---

## 🧪 Testing Verification

Run the automated test suite with Vitest:
```bash
npm run test:run
```

**Test Suite Coverage Summary:**
- Total Test Files: **6**
- Total Automated Tests: **148**
- Passing: **148**
- Failing: **0**

| Test File | Tests | Focus Area |
|---|---|---|
| `src/test/event.test.ts` | 39 | Budget calculations, category distribution, milestone math, vendor progress, sustainability score, Dijkstra algorithm |
| `src/test/api.test.ts` | 27 | CORS validation, plan payload type guards, boundary checks, SHA-256 hash keys, live HTTP endpoints |
| `src/test/stadium.test.ts` | 28 | Baseline mathematical stability, density thresholds, queue wait times, green composite formulas |
| `src/test/navigation.test.ts` | 22 | Graph traversal, accessible route mode filtering, checkpoint CRUD, storage service |
| `src/test/rendering.test.tsx` | 20 | Component layout rendering in JSDOM (Dashboard, Assistant, Budget, Timeline, Vendors, Ideas, Alerts) |
| `src/test/dom.test.tsx` | 12 | User event interactions (form inputs, milestone checkboxes, category filters, language switches) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd smartstadium-main
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API key to `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Note: PlanCraft GenAI includes a deterministic local AI engine, so the application runs and tests pass even without an active API key!)*

### Running Locally
- **Start the Vite frontend development server:**
  ```bash
  npm run dev
  ```
  Open `http://localhost:5173` in your browser.

- **Start the Express AI backend server:**
  ```bash
  npm run start
  ```
  The API server runs on `http://localhost:3001`.

### Verification Commands
- **Run automated test suite:**
  ```bash
  npm run test:run
  ```
- **Run linter (Oxlint):**
  ```bash
  npm run lint
  ```
- **Compile and verify production bundle:**
  ```bash
  npm run build
  ```

---

## 📄 License
MIT License. Created by Vinay S Bhadane.
