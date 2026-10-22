# Accessibility (A11y) Blueprint — PlanCraft GenAI

## 1. Compliance Standard
PlanCraft GenAI is designed and engineered to conform strictly to the **WCAG 2.2 Level AA** accessibility standards.

---

## 2. Accessible Design Implementation

### §2.1 Semantic HTML Structure
*   **Landmark Hierarchy:** The application organizes content using landmark HTML5 elements: `<header>`, `<nav role="tablist">`, `<main id="panel-*" role="tabpanel">`, `<section>`, `<form>`, and `<footer>`.
*   **Heading Structure:** Single `<h1>` per page with semantic `<h2>`, `<h3>`, and `<h4>` subheadings defining an accessible outline for screen reader navigation.
*   **Form Association:** Every input, select, and textarea element has a strictly associated `<label htmlFor="...">` or explicit `aria-label` description.

### §2.2 Keyboard Navigation & Focus Indicators
*   **Full Keyboard Operability:** All tabs, buttons, checkboxes, status dropdowns, and form fields are completely operable via keyboard (`Tab`, `Shift+Tab`, `Space`, `Enter`).
*   **Prominent Focus Rings:** Focus states are styled with visible high-contrast rings (`focus:ring-2 focus:ring-indigo-500 focus:outline-none`) across all controls, ensuring keyboard users always have visual clarity on active focus.
*   **Tabindex Management:** Content panels feature `tabIndex={-1}` for programmatic focus management during tab switching without disrupting natural tab order.

### §2.3 Visual Clarity, High Contrast & Color Independence
*   **Contrast Ratio:** The application uses an engineered dark theme palette where text-to-background contrast ratios exceed the WCAG AA requirement of 4.5:1 (normal text) and 3:1 (large text/graphics).
*   **Color Independence:** Status indicators (e.g. *Confirmed, Contacted, Overdue, Urgent*) never rely on color alone — every indicator combines a color badge with explicit descriptive text and icon cues.

### §2.4 Screen Reader Support & ARIA Live Regions
*   **Dynamic Alert Announcements:** Real-time budget overrun warnings and task notifications utilize `role="alert"` and `aria-live="polite"` / `aria-live="assertive"`, ensuring assistive technologies announce urgent changes immediately.
*   **Screen Reader Summaries:** Visual gauges and progress bars have adjacent text labels and accessible descriptions describing numeric values in plain language.
*   **Tablist & Panel Semantics:** Navigation tabs use `role="tab"`, `aria-selected`, and `aria-controls` attributes linking directly to their active panels.

### §2.5 Skip Navigation
*   A visually hidden "Skip to main content" link (`#skip-to-content`) is embedded at the top of `index.html`. It becomes visible upon keyboard focus, allowing users to bypass header tabs and jump directly into the main panel.

### §2.6 Noscript Fallback
*   A dedicated `<noscript>` fallback block provides a clean, styled message for users who have JavaScript disabled, clearly explaining application requirements.
