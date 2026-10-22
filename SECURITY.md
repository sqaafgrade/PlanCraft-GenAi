# Security Blueprint — PlanCraft GenAI

## 1. Overview & Threat Model
PlanCraft GenAI implements an enterprise-level full-stack security model adhering strictly to OWASP Top 10 best practices. The application protects sensitive event information, prevents unauthorized access, isolates user data, safeguards AI prompts against injection, and prevents credential exposure.

---

## 2. Defensive Layers & Request Hardening

### §2.1 Perimeter Protection (`server.ts`)
*   **Helmet Middleware with Strict CSP:** Enforces standard Content Security Policy directives:
    *   `defaultSrc: ["'self'"]`
    *   `scriptSrc: ["'self'"]`
    *   `styleSrc: ["'self'", "'unsafe-inline'"]`
    *   `imgSrc: ["'self'", 'data:', 'https:']`
    *   `connectSrc: ["'self'", 'https://*.googleapis.com', 'https://*.firebaseapp.com']`
    *   `objectSrc: ["'none'"]`
    *   `upgradeInsecureRequests: []`
    *   Protects against cross-site scripting (XSS), clickjacking, and MIME-sniffing.
*   **Dynamic CORS Host Matching:** Access is strictly bounded to authorized local environments and trusted hosting domains (`*.web.app`, `*.firebaseapp.com`, `*.onrender.com`). Arbitrary external domains or wildcards (`*`) are explicitly rejected.
*   **Rate Limiting:** Protects AI generation endpoints against denial-of-service (DoS) and API quota exhaustion with a 30 req/minute/IP limit via `express-rate-limit`.
*   **Payload Size Limitation:** Enforces a strict 15 KB JSON body size cap within `express.json({ limit: '15kb' })` to reject oversized payload buffer exploits.

### §2.2 Parameter Sanitization & Explicit Range Validation
All user-provided inputs to POST endpoints are strictly validated prior to processing:
*   **Type Guard Verification:** Asserts that every field matches its expected primitive or array type using `validatePlanPayload`.
*   **Bounds Validation:** Numeric constraints enforce human and logical limits:
    *   Guest count must be between 1 and 100,000.
    *   Total budget must be non-negative and capped at $100,000,000.
    *   Duration in hours must be between 1 and 72.
*   **Strict Enum Sanitization:** Categorical values must strictly match the `VALID_EVENT_TYPES` and `VALID_LANGUAGES` allowlists.
*   **ISO Date Validation:** Event dates must match `YYYY-MM-DD` with valid calendar days, preventing SQL/NoSQL query injection or malformed date math.

### §2.3 AI Prompt Injection Prevention
*   **Control Character Stripping:** All user-provided freeform text (location, themes, preferences, special requests) routed to Google Gemini is sanitized by stripping non-printable control characters (`\x00-\x1f`) before prompt interpolation.
*   **String Length Constraints:** String parameters are strictly bounded (e.g., location ≤ 100 chars, theme ≤ 200 chars, translation text ≤ 2,000 chars) to prevent buffer and token exhaustion attacks.
*   **Structured Output Isolation:** AI output is parsed via strict JSON regular expression matching (`/\{[\s\S]*\}/`) and validated against expected interfaces before accepting or storing.

### §2.4 API Key Cryptographic Custody
*   **Server-Side Execution Only:** The `GEMINI_API_KEY` is exclusively read and utilized by the Node.js backend runtime (`server.ts`). Secret keys are never exposed in client bundles, headers, or client-accessible storage.
*   **Environment Segregation:** Secrets are documented via `.env.example` with placeholders only. Real keys are stored in uncommitted `.env` files protected by `.gitignore`.

### §2.5 Global Error Handling & Information Leakage Prevention (CWE-209)
*   The Express error handler logs internal details on the server for debugging while returning a generic `{ error: 'Internal Server Error' }` JSON response with HTTP 500.
*   Stack traces, filesystem paths, and internal library exceptions are never disclosed to clients.

### §2.6 Cloud Data Isolation & User Ownership
*   Firestore security rules (`firestore.rules`) strictly enforce per-user isolation:
    ```javascript
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
    ```
*   Users cannot read, write, or enumerate events belonging to other authenticated accounts.
