# CaseBridge - AI Project Context & Specification

## 1. Project Overview
- **Project Name:** CaseBridge (formerly SpeakSafe)
- **Nature:** Lightweight-to-medium, privacy-focused web application for anonymous university case/complaint reporting and institutional case management.
- **Audience:**
  - Anonymous Students / University Community Members submitting reports
  - University Committee Members handling reviews and resolution
  - Committee Leads overseeing assignments and escalations
  - System Administrators configuring categories, roles, and viewing technical audit logs.

## 2. Approved Core Requirements Matrix
- **FR-01: Anonymous Complaint Submission**
  - No required personally identifiable information (no name, student ID, personal email, phone).
  - Categorization into pre-approved categories.
  - Safe narrative description with optional private attachment upload.
  - Verification that IP addresses, browser fingerprints, and hardware IDs are NOT intentionally persisted in case records.
- **FR-02: Secure, Unpredictable Tracking Code**
  - High-entropy cryptographic token generated at submission (format: `CB-XXXX-XXXX-XXXX`).
  - Stored in hashed form (SHA-256) for lookup comparison.
  - Displayed once to the student with clear copy/download warning.
- **FR-03: Complaint Tracking and Status**
  - Rate-limited lookup using the raw tracking code.
  - Status display: Received, Assigned, In Review, Action Required, Resolved, Closed.
  - Overdue condition flagged automatically based on response deadlines.
  - Safe timeline of institutional milestones.
- **FR-04: Anonymous Two-Way Communication**
  - Threaded messages between student and committee without revealing identities.
  - Student messages are authenticated solely via the verified tracking code session.
  - Committee messages attribute author role/display title rather than private identifiers.
- **FR-05: Committee Authentication & RBAC**
  - Three staff roles: Committee Member, Committee Lead, System Administrator.
  - Secure credential validation, session expiry, and privilege segregation.
- **FR-06: Complaint Assignment & Workflow**
  - Queue management, triaging, priority setting (Low, Medium, High, Critical).
  - Assignment to designated committee members by Committee Leads.
  - Internal investigative notes isolated from student view.
- **FR-07: Audit Trail & Accountability**
  - Tamper-evident logging of status changes, priority changes, assignments, note additions, and administrative actions.
- **FR-08: Secure Evidence Attachments**
  - Client and server-side MIME type whitelist (PDF, PNG, JPG, JPEG, TXT, DOCX), 5MB size limit.
  - Strip metadata (EXIF/GPS) and store with randomized storage keys.
- **NFR-09: Privacy, Integrity, Validation & Abuse Protection**
  - Input sanitization against XSS/injection.
  - Rate limiting on submissions and tracking lookups.
  - Honest privacy boundary: distinguish application-level anonymity from transport/infrastructure telemetry.
- **FR-10: Escalation & Response Deadlines**
  - Standard resolution/response SLA targets (e.g. Critical: 24h, High: 72h, Medium: 7 days, Low: 14 days).
  - Visual indicators for overdue cases requiring immediate institutional action.

## 3. Technology Alignment
- Frontend / Interactive Applet: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons for responsive, accessible, zero-glitch UI.
- Backend Architecture: Modular TypeScript API layer + Python 3.11 / Flask / MySQL 8.0 schema reference implementation for Docker/Render deployments.

## 4. Stage 2 Database Schema & Security Models
- **Database Engine:** MySQL 8.0 exclusively (SQLite explicitly prohibited).
- **Core Entities:** `roles`, `users`, `complaint_categories`, `cases`, `assignments`, `messages`, `case_events`, `attachments`, `escalations`, `notifications`, `system_settings`.
- **Whistleblower Shielding:** The internal integer `cases.id` is never exposed. The student receives a high-entropy `CB-XXXX-XXXX-XXXX` token; lookup is performed against `SHA-256(token + salt)`.
- **Application-Level Encryption:** Sensitive narrative and dialogue are encrypted using AES-256 (Fernet) via `CASE_ENCRYPTION_KEY`.
- **Zero-PII Mandate:** Names, student IDs, emails, IP addresses, and hardware telemetry are never persisted in case tables.

## 5. Stage 3 Public Website, Student Experience & UI Content
- **Public Pages:** 8 approved pages implemented (`/`, `/about`, `/how-it-works`, `/submit`, `/track`, `/privacy`, `/security`, `/faq`).
- **UI Design Tokens:** System font stack (zero external downloads), WCAG 2.2 AA visible focus rings, 44px touch targets, prefers-reduced-motion, restrained state badges.
- **Copywriting & SEO:** Search-intent aware metadata, unique titles/descriptions, plain-language whistleblower protection, candid network boundaries, and emergency hotline notices.
- **Privacy & Security Integrity:** Permitted file attachments (5MB max), anti-enumeration safe error states, and strict isolation of internal committee-only notes.

## 6. Stage 5 Core Case Management Engine
- **Function 1 (Submission):** Server-side validation, category & narrative validation, unpredictable token generation, SHA-256 peppered digest storage, initial `Received` status, deadline calculation, zero student PII.
- **Function 2 (Tracking):** Rate-limited lookup, format validation, safe non-enumerating rejection, strict isolation of internal integer IDs, confidential notes, and staff credentials.
- **Function 3 (Lifecycle):** Legal state machine (`Received` -> `Assigned` -> `In Review` -> `Action Required` -> `Resolved` -> `Closed`). Overdue condition dynamically evaluated.
- **Function 4 (Messaging):** Student <-> Committee dialogue; explicit separation between public thread and staff-only internal notes.
- **Function 5 (Assignment):** Role-restricted delegation by Committee Leads; supports assign, reassign, and unassign with immutable audit entries.
- **Function 6 (Priority):** Low, Medium, High, Critical with SLA deadline adjustments; role-restricted.
- **Function 7 (Attachments):** Allowed PDF, PNG, JPG, JPEG under 5MB. Extension & MIME validation, randomized storage keys, non-executable storage.
- **Function 8 (Escalation & Deadlines):** Configurable SLA deadlines, dynamic overdue condition, automated escalation event logging, and lead alert banners.
- **Function 9 (Audit Events):** Comprehensive append-only logging of transitions without sensitive narrative text.
- **Function 10 (Abuse Protection):** Rate limiting, payload constraints, input sanitization against XSS/injection.
- **Automated Verification:** 16 Vitest unit tests covering all 10 functions passing cleanly (`tests/test_case_engine_core.test.ts`).

## 7. Stage 6 Security & Privacy Hardening
- **Threat Model & ASVS 5.0.0 Reference:** Analyzed and addressed 15 primary threat vectors (`docs/THREAT_MODEL.md`, `docs/SECURITY_MODEL.md`).
- **Anonymity Boundary:** Verified zero persistence of student identifiers (names, emails, phones, student IDs, IP addresses, browser fingerprints, device IDs).
- **Tracking Credential Hardening:** Verified >60 bits entropy ($32^{12}$ combinations) using unambiguous character set, non-sequential generation, SHA-256 salted digest representation, and rate-limiting lockout protection.
- **Session & Header Defenses:** Enforced `nosniff`, `SAMEORIGIN`, CSP, and `strict-origin-when-cross-origin` security headers. Configured session regeneration upon login and strict idle timeouts.
- **Attachment Hardening:** Added path traversal sanitization (`../` blocking), MIME type validation, extension allowlists, and private authorization check for downloads.
- **XSS & Injection Protection:** Rigorous multi-tier input sanitization, context-aware JSX/template rendering, and ORM query parameterization.
- **Error & Log Hygiene:** Configured custom sensitive log filters preventing storage or output of complaint narrative, passwords, tracking codes, or database credentials.
- **Automated Test Verification:** 27 automated tests passing in Vitest test suite (`tests/test_security_hardening.test.ts` and `tests/test_case_engine_core.test.ts`).

## 8. Stage 8 Testing, Quality Engineering & Performance Optimization
- **Quality Standard Reference:** Engineered in alignment with ISO/IEC 25010:2023 product quality characteristics (functional suitability, performance efficiency, usability, security, reliability).
- **Test Pyramid Coverage:** 61 automated tests passing across 7 test suites:
  - `tests/test_case_engine_core.test.ts` (16 unit tests: FR-01 through FR-10)
  - `tests/test_security_hardening.test.ts` (11 security tests: OWASP ASVS 5.0.0 threat vectors)
  - `tests/test_authorization_and_rbac.test.ts` (9 authorization tests: role boundaries & revoked accounts)
  - `tests/test_edge_cases_and_data_integrity.test.ts` (11 edge case tests: boundaries, file types, throttling, immutability)
  - `tests/test_integration_workflows.test.ts` (2 integration tests: complete whistleblower lifecycle & SLA escalation)
  - `tests/test_performance_benchmarks.test.ts` (4 performance tests: hashing latency, queue throughput, memory bounding)
  - `tests/test_ui_components_and_routes.test.ts` (8 UI smoke tests: states, badges, timelines, cards)
- **Performance Budget & Code-Splitting:**
  - Implemented route-level dynamic code-splitting via `React.lazy` and `Suspense`, dropping entry bundle by ~200KB.
  - HTML entry payload: 1.41 kB (0.66 kB gzip).
  - Global CSS: 47.56 kB (8.70 kB gzip).
  - Main JS entry chunk: 491.53 kB (145.31 kB gzip).
  - Secondary route chunks: 4.8 kB to 24.5 kB (1.5 kB to 5.2 kB gzip).
  - Initial network requests: 3 requests. Zero external CDN or Google Font dependencies.
  - Cryptographic hashing latency: 0.08ms per operation.
  - Case search throughput: 10ms across 1,000 cases.
- **Accessibility Verification:** Validated WCAG 2.2 AA visible focus rings, 44px touch targets, contrast ratios (>4.5:1 text, >3:1 non-text), `prefers-reduced-motion` compliance, and screen-reader accessibility labels.
- **Documentation Created:** `docs/TEST_PLAN.md`, `docs/TEST_RESULTS.md`, `docs/PERFORMANCE_REPORT.md`.

## 9. Stage 9 Containerization, Deployment & Small-Scale Production Preparation
- **Docker Production Image:** Multi-stage `python:3.11-slim` container executing as unprivileged user `casebridge` (UID 1001) with Gunicorn WSGI server (3 worker processes binding to `0.0.0.0:5000`).
- **Private Docker Network:** Configured `docker-compose.yml` with private bridge network (`casebridge_internal`), ensuring MySQL 8.0 is not exposed to the public internet.
- **Environment Handling:** Parameterized all database credentials, Flask secrets, pepper salts, and upload configurations via `.env.example` and `.env` with safe fallbacks and zero hardcoded secrets.
- **Health Check Wiring:** Configured `/health` endpoint performing active `SELECT 1` database query, returning 200 OK when healthy and 503 degraded when unreachable.
- **File Storage Preservation:** Maintained protected upload storage in `instance/protected_uploads` backed by persistent Docker named volume.
- **Deployment Documentation:** Created comprehensive `docs/DEPLOYMENT_GUIDE.md` and `docs/PRODUCTION_CHECKLIST.md` covering Render web service and MySQL 8.0 deployment, local Docker Compose, and disaster recovery.
- **Full Regression Verification:** Verified that application build succeeds with zero errors (`npm run build`) and all 61 automated tests pass with 100% success rate (`npm test`).





