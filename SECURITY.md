# Security

## SmartStadium AI Security Blueprint

SmartStadium AI adopts an enterprise-level full-stack security model, strictly complying with OWASP best practices. The app guarantees safe data transmissions, input validation, rate limiting, and private key security.

### 1. Perimeter Protection & Request Hardening
Our Express server (`server.ts`) is fortified using standard defensive layers:

* **Helmet Headers**: Integrated `helmet()` middleware which customizes security headers, defends against clickjacking and MIME-sniffing, and specifies a strict Content Security Policy (CSP).
* **Strict CORS Policy**: Programmed dynamic host matching to strictly restrict API access, allowing only verified local hosting profiles and standard Google Cloud platforms.
* **Rate Limiting**: Protects the AI endpoint against DDoS attacks using a memory-sweeping, lightweight, clean rate-limiter that isolates abusive users while preventing memory leaks.
* **Payload Size Restrictions**: Explicitly specifies 15kb post body limits within `express.json()` to block oversized buffers.

### 2. Parameter Sanitization & Range Checks
To prevent schema exploits, SQL/noSQL injections, or shell command injections, we implement a robust type, categorical, and range checker inside our Express POST endpoints:

* **Type Guard Verification**: Asserts that every field exists and is finite.
* **Explicit Bounds Validation**: Checks that numeric metrics fall strictly within human/logical thresholds (e.g., zone capacity must be between 1 and 200,000, occupancy cannot exceed capacity, and ingress/egress rates must be non-negative).
* **Strict Enums Sanitization**: Enforces categorical selectors to match lists of predefined options (e.g., rejecting arbitrary string inputs for match phases like kickoff, halftime, etc.).

### 3. API Key Cryptographic Custody
* **Server-Side Execution Only**: All prompts and interactions with the Gemini API are executed and completed purely behind our secure Node.js backend. No secret keys are ever exposed to client-side browsers.
* **Local Env Segregation**: All sensitive variables are declared inside `.env.example` to document keys securely without committing them to git.

### 4. Prompt Injection Prevention
* **Input Sanitization**: All user-provided text routed to Gemini AI prompts is sanitized by stripping control characters (`\x00-\x1f`) before interpolation, preventing prompt injection via malformed input.
* **String Length Constraints**: Zone identifiers are capped at 50 characters, and translation text is capped at 2000 characters, preventing oversized payload abuse.

### 5. Global Error Handler
* **Information Leakage Prevention (CWE-209)**: The Express error handler returns a generic `{ error: 'Internal Server Error' }` response without exposing stack traces, internal error messages, or server paths to clients.
