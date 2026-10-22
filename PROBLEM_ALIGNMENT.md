# Problem Statement Alignment — PlanCraft GenAI

## 1. Problem Definition
> **Problem Statement:** "Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas."

Organizing milestone life events (weddings and birthdays) and large public gatherings (community events) involves coordinating multiple moving parts across budgeting, supplier coordination, chronological deadlines, and creative styling. PlanCraft GenAI directly satisfies and solves every dimension of this problem statement.

---

## 2. Feature to Requirement Mapping

### §1.1 GenAI Event Planning Assistant
*   **Requirement:** An interactive planning assistant that understands event specifications and synthesizes personalized plans.
*   **Implementation:** 
    *   Understands inputs: Event type (*Weddings, Birthdays, Community Events, Anniversaries, Corporate, Social Parties*), Event date, City/location, Estimated guest count, Total budget, Style and theme preferences, Venue preferences, Dietary accommodations (*Vegetarian, Vegan, Halal, Kosher, Gluten-Free, Nut-Free*), Accessibility requirements (*Step-Free, Wheelchair Ramps, ASL Interpreter, Quiet Space*), and Cultural requests.
    *   Generates schema-validated structured plan outputs containing: Concept overview, recommended theme, suggested guest activities, day-of hourly schedule, budget allocation ratios, tailored vendor checklist, preparation milestones, and strategic decisions.
    *   Interactive **"Apply this Plan to Event"** workflow immediately sets up the event's budget, timeline, and vendor checklist.
    *   Implemented in `src/components/Assistant/AIPlanningAssistant.tsx`, `src/hooks/useEventPlanning.ts`, and `server.ts` (`POST /api/plan-event`).

### §1.2 Structured Budget Management & Overrun Prevention
*   **Requirement:** Multi-category event budget tracking estimated expenses against actual spending with overrun warnings.
*   **Implementation:**
    *   Supports 10 standard categories: *Venue, Catering, Decoration, Photography/Videography, Entertainment, Invitations, Transportation, Accommodation, Equipment, Miscellaneous, Contingency*.
    *   Calculates total planned budget, total estimated quotes, total actual spending, remaining budget balance, and utilization percentage.
    *   Enforces a dedicated 10% contingency allocation.
    *   Performs all monetary arithmetic in a pure, deterministic compute engine (`src/lib/eventCompute.ts` — `computeBudgetSummary`) rather than relying on unreliable LLM arithmetic.
    *   Detects budget overruns and immediately renders high-visibility **Budget Overrun Warning Banners** if spending exceeds limits.
    *   Allows itemized expense management (add, edit, paid status toggle, delete) in `src/components/Budget/BudgetManager.tsx` and `src/hooks/useEventBudget.ts`.

### §1.3 Chronological Timeline & Milestone Scheduling
*   **Requirement:** Generate and manage event timelines based on event date and type, tracking milestones and daily schedules.
*   **Implementation:**
    *   Calculates real calendar dates using `shiftIsoDate` and `calculateDaysRemaining` in `src/lib/eventCompute.ts`.
    *   Generates customized milestone templates for:
        *   **Weddings:** 180 days (Budget & Guest list), 150 days (Venue booking), 120 days (Photographer engagement), 90 days (Catering tasting), 60 days (Invitations & RSVPs), 30 days (Decor & Floral), 14 days (Seating chart), 2 days (Rehearsal).
        *   **Birthdays:** 45 days (Theme & Budget), 30 days (Venue/Home space), 21 days (Cake & Catering), 14 days (Invitations), 10 days (Entertainment/DJ), 5 days (Favors & Decor), 0 days (Day-of Setup).
        *   **Community Events:** 60 days (Objectives & Organizing committee), 45 days (Park & Municipal permits), 30 days (AV & PA Equipment rentals), 20 days (Volunteer recruitment), 10 days (Food trucks & Waste management), 3 days (Schedule & First-Aid map).
    *   Flags overdue milestones with visual badges and countdown timers.
    *   Includes a minute-by-minute Event-Day program schedule editor in `src/components/Timeline/TimelineSchedule.tsx`.

### §1.4 Verified Vendor Checklist & Supplier Tracking
*   **Requirement:** Customized vendor checklist tracking tasks, contacts, costs, and explicit verification statuses.
*   **Implementation:**
    *   Auto-populates tailored vendor requirements based on event type.
    *   Enforces explicit status transitions: *Not Started, Researching, Contacted, Confirmed, Completed*.
    *   Never fabricates confirmed vendor availability; requires explicit user status setting.
    *   Stores supplier contact names, phone numbers, email addresses, and estimated costs.
    *   Includes progress tracking (total items, confirmed counts, completion percentage) and category/status filtering in `src/components/Vendors/VendorChecklist.tsx` and `src/hooks/useVendorChecklist.ts`.

### §1.5 Personalized Creative Ideas & Rationale
*   **Requirement:** AI-generated creative event ideas tailored to user budget, theme, and accessibility constraints.
*   **Implementation:**
    *   Provides creative concepts categorized into: *Themes & Styling, Decor Concepts, Activities & Music, Food & Menu, Smart Budget Tips, Eco & Sustainable Options, Accessibility & Care*.
    *   Budget-friendly ideas include estimated dollar savings (e.g., saving $1,800 by switching to signature cocktails).
    *   Every idea features an explicit **"Why this fits your event"** explanation tying the recommendation back to the user's specific guest count, budget limit, and venue constraints.
    *   Implemented in `src/components/Ideas/PersonalizedIdeas.tsx`.

### §1.6 Multilingual Invitations & Communication
*   **Requirement:** Multilingual support breaking language barriers for diverse families and international guests.
*   **Implementation:**
    *   Real-time translation across 20+ languages powered by Gemini AI with automatic Right-to-Left (RTL) layout switching.
    *   Provides cultural context notes regarding phrasing, respect levels, and celebration etiquette.
    *   Ready-to-use invitation templates for formal weddings, milestone birthdays, and community festivals.
    *   Implemented in `src/components/Multilingual/MultilingualAssistant.tsx`.

### §1.7 Unified Event Dashboard & Multi-Event Management
*   **Requirement:** An overarching command center providing visibility into all event dimensions with meaningful empty states.
*   **Implementation:**
    *   Displays event overview, location, guest count, and active event switcher.
    *   KPI cards for Countdown (*Days Remaining*), Remaining Budget balance, Vendor readiness percentage, and Milestone progress.
    *   Visual budget utilization bar and category allocation distribution cards.
    *   Handles empty states gracefully for users who haven't yet created an event.
    *   Implemented in `src/components/Dashboard/EventDashboard.tsx`.
