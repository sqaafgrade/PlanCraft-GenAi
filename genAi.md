# 🤖 Generative AI Integration — PlanCraft GenAI

> **Project:** PlanCraft GenAI — Event Planning Assistant for Weddings, Birthdays & Community Events  
> **Repository:** [PlanCraft GenAI](.)  
> **Submission Category:** Generative AI / Event Management & Productivity  

---

## 1. Executive Summary

PlanCraft GenAI is an intelligent, full-stack event planning assistant engineered to help organizers plan weddings, birthdays, community events, and milestone celebrations. Generative AI is the operational core of the platform, orchestrating requirements gathering, creative synthesis, budget allocation, chronological scheduling, and multilingual guest communication.

Google Gemini (`gemini-3.5-flash`) powers live API endpoints on our fortified Node.js / Express backend:

| Endpoint | AI Role | Output Structure |
|---|---|---|
| `POST /api/plan-event` | Analyzes event parameters (type, date, location, guest count, budget, style, dietary, accessibility, cultural needs) and generates an end-to-end event plan. | Validated JSON with overview, theme, suggested activities, day schedule, budget distribution, vendor checklist, milestones, and strategic decisions. |
| `POST /api/translate` | Translates event invitations, multilingual vows, and announcements into 20+ languages with cultural etiquette context and RTL layout detection. | Validated JSON containing translated text, cultural context notes, and RTL flags. |

In addition to live runtime features, the platform includes a **deterministic local AI engine** that gracefully serves as an offline fallback when API keys are absent or rate limits are reached, ensuring uninterrupted application usability and testing consistency.

---

## 2. Technical Breakdown — How GenAI is Engineered

### 2.1 Backend Architecture & Security (Node.js / Express / TypeScript)
All Generative AI operations occur strictly on the backend (`server.ts`):
*   **Perimeter Hardening:** Protected by Helmet (strict CSP), dynamic CORS matching, a 15 KB JSON payload ceiling, and an `express-rate-limit` window of 30 req/min/IP.
*   **SHA-256 In-Memory Cache:** All planning and translation payloads are serialized and hashed to a 16-character hexadecimal key (`hashPayload`). Identical requests retrieve cached responses immediately, eliminating redundant Gemini token consumption and achieving sub-millisecond response times.
*   **Prompt Injection Defense:** User-supplied strings are sanitized by stripping non-printable control characters (`\x00-\x1f`) and enforcing strict length limits (location ≤ 100 chars, theme ≤ 200 chars, translation text ≤ 2,000 chars) before string interpolation into AI prompts.
*   **Schema Extraction & Validation:** Prompts instruct Gemini to respond in pure JSON. Responses are extracted via regular expressions (`/\{[\s\S]*\}/`), parsed, and validated against TypeScript schemas before transmission to clients.
*   **CWE-209 Safe Error Handling:** Global error handlers catch AI failures and log details on the server while returning user-safe responses that never disclose internal API keys, library traces, or server paths.

### 2.2 Frontend Integration (React 19 / TypeScript / Vite)
*   **Reactive Planning Hook:** `useEventPlanning.ts` manages asynchronous request states, loading indicators, error boundaries, and response caching.
*   **Interactive Requirement Wizard:** `AIPlanningAssistant.tsx` provides accessible form controls and toggle chips for dietary accommodations (*Vegetarian, Vegan, Halal, Gluten-Free*) and accessibility needs (*Step-Free, ASL Interpreter, Quiet Space*).
*   **One-Click Plan Application:** The generated plan features an **"Apply this Plan to Event"** action that automatically distributes budget line items, creates chronological milestone tasks, populates the vendor checklist, and loads the day-of activity schedule.

---

## 3. Engineering Prompts Used in the Implementation

Below are representative system prompts engineered for reliable structured output generation:

### Prompt 1 — Structured Event Plan Generation (`server.ts`)
```text
You are an expert AI Event Planning Assistant.
Create a comprehensive, realistic plan for organizing the following event:

Event Type: ${payload.eventType}
Event Date: ${payload.date}
Location: ${sanitizeString(payload.location)}
Guest Count: ${payload.guestCount}
Total Budget: $${payload.totalBudget}
Theme: ${payload.themePreference ? sanitizeString(payload.themePreference) : 'Not specified'}
Venue Preference: ${payload.venuePreference ? sanitizeString(payload.venuePreference) : 'Not specified'}
Dietary Requirements: ${(payload.dietaryRequirements ?? []).join(', ') || 'Standard'}
Accessibility Requirements: ${(payload.accessibilityRequirements ?? []).join(', ') || 'Standard'}
Cultural Preferences: ${payload.culturalPreferences ? sanitizeString(payload.culturalPreferences) : 'None'}

Return ONLY a valid JSON object with EXACTLY this structure:
{
  "overview": "<concise summary>",
  "recommendedTheme": "<theme description>",
  "suggestedActivities": ["<act1>", "<act2>", "<act3>"],
  "daySchedule": [{"id": "sch-1", "time": "15:00", "activity": "<act>", "description": "<desc>"}],
  "budgetAllocation": {"venue": 0.35, "catering": 0.25, "decoration": 0.15, "entertainment": 0.15, "miscellaneous": 0.10},
  "vendorChecklist": [{"category": "venue", "name": "<vendor>", "description": "<desc>", "priority": "Urgent", "estimatedCost": 2000}],
  "milestones": [{"title": "<title>", "description": "<desc>", "relativeDaysBefore": 60, "priority": "High"}],
  "ideas": [{"id": "idea-1", "category": "theme", "title": "<title>", "description": "<desc>", "tags": ["Decor"], "whyRecommended": "<reason>"}],
  "importantDecisions": ["<decision1>", "<decision2>"]
}
```

### Prompt 2 — Multilingual Invitation & Announcement Translation (`server.ts`)
```text
You are a professional multilingual translator specializing in event invitations and announcements.
Translate the following text to language code: ${targetLanguage}${sourceLanguage ? ` (from: ${sourceLanguage})` : ''}.

Text: "${sanitizedText}"

Respond in JSON with exactly these fields:
{
  "translatedText": "<translation>",
  "culturalNotes": "<optional brief cultural context, or empty string>"
}
```

---

## 4. Reliability & Deterministic Fallback Strategy

To ensure zero-downtime reliability during hackathon evaluations, CI/CD pipelines, or offline demonstrations where a live Gemini API key may not be provisioned:
1. If `GEMINI_API_KEY` is not present, `server.ts` routes the request to an internal deterministic planning engine (`generateDeterministicPlan`).
2. The engine calculates realistic budget distributions matching the requested event type (*e.g., 35% venue for weddings vs. 25% equipment for community events*), computes milestone schedules relative to the target date, and populates vendor checklists with realistic estimates.
3. If a live API call encounters a network timeout or provider failure, the server catches the error, logs a warning, and returns the deterministic plan fallback without crashing.
