# CaseBridge Security Model

## 1. Executive Summary & Principles
CaseBridge is an institutional grievance reporting and ombudsman portal designed with a zero-knowledge anonymity boundary. It guarantees that anonymous student complaints cannot be correlated with student identities, university directory accounts, network origins, or client device fingerprints, while preserving verifiable tracking, non-repudiation, and audit integrity for ethics review committees.

This security model is formulated using secure development principles and uses **OWASP ASVS 5.0.0 (Application Security Verification Standard)** as a verification reference (noting that formal compliance is an ongoing operational posture, not a self-certified label).

---

## 2. Core Architectural Boundaries

### 2.1 Anonymity Boundary (Untrusted Zone to Safe Ingestion)
1. **Zero Direct Identification Persistence**:
   - The system intentionally never stores student names, student ID numbers, emails, telephone numbers, IP addresses, browser user-agent fingerprints, or device identifiers.
   - The submission form accepts strictly operational grievance data: Category, Priority, Narrative Statement, Incident Date, Location, and Optional Attachments.
2. **Infrastructure Boundary Disclosure**:
   - Application logic explicitly purges and ignores network telemetry. 
   - However, standard operational transparency dictates that edge reverse proxies, Cloud Run ingress load balancers, or intermediate routing infrastructure outside the application boundary maintain low-level network connection logs. The application architecture minimizes this exposure by using randomized client session tokens for in-flight tracking lookups and avoiding tracking credential leakage in URL search parameters or referrers.

### 2.2 Tracking Credential & Cryptographic Primitives
1. **Entropy & Unpredictability**:
   - Tracking codes conform to the pattern `CB-XXXX-XXXX-XXXX` using a 32-character unambiguous alphabet (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), excluding confusing characters (`0`, `O`, `1`, `I`).
   - Entropy: $32^{12} = 1.15 \times 10^{18}$ combinations ($> 60$ bits of cryptographic entropy), rendering sequential guessing or brute-force enumeration computationally infeasible.
2. **Storage Representation**:
   - Raw tracking codes are displayed to the anonymous student **exactly once** upon submission.
   - The server stores a deterministic salted SHA-256 hash (`code_hash`), salted with an environmental pepper.
   - Database compromise does not reveal raw tracking codes to an adversary without brute-force preimage computation.

### 2.3 Staff Access & Role-Based Access Control (RBAC)
CaseBridge enforces three distinct roles:
1. **ANONYMOUS_STUDENT**: Can only submit cases, look up their own case via valid tracking credential, send student messages, and download authorized attachments belonging to their case.
2. **COMMITTEE_MEMBER**: Can view assigned/active cases, update case status across permitted lifecycle transitions, adjust priority, send official committee responses to students, add private internal notes, and download attachments.
3. **COMMITTEE_LEAD**: All Committee Member privileges, plus assignment/reassignment/unassignment of cases, and oversight of committee workflows.
4. **SYSTEM_ADMIN**: Management of categories, configuration, and audit oversight.

---

## 3. Defense-in-Depth Controls

### 3.1 Session Security
- **Cookie Flags**: All staff session cookies are issued with `HttpOnly`, `Secure` (in production/HTTPS environments), and `SameSite=Lax` (or `Strict` for sensitive operations).
- **Session Fixation Prevention**: Session identifiers are destroyed and regenerated upon successful staff authentication.
- **Session Expiration**: Inactivity timeout of 30 minutes and absolute maximum session duration of 8 hours.

### 3.2 Output Encoding & Injection Prevention
- **HTML / Script Sanitization**: All user-supplied narrative, subject, and message strings are aggressively sanitized prior to storage and contextually encoded before DOM/template insertion.
- **SQL / Query Parameterization**: All database access is governed by typed ORM / parameterized queries. Zero raw dynamic SQL string interpolation exists in the codebase.

### 3.3 HTTP Security Headers
The application enforces defensive response headers on all routes:
- `Content-Security-Policy`: Restricts script, style, and media sources (`default-src 'self'`).
- `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
- `X-Frame-Options: SAMEORIGIN`: Prevents clickjacking.
- `Referrer-Policy: strict-origin-when-cross-origin`: Prevents credential leakage via HTTP Referer.
- `Permissions-Policy`: Restricts camera, microphone, and geolocation APIs.

### 3.4 Rate Limiting & Abuse Prevention
- **Tracking Lookups**: Max 10 attempts per minute per IP address. Exceeding triggers a 429 lock-out window.
- **Submission Endpoint**: Throttled to prevent flooding.
- **Staff Authentication**: Max 5 failed attempts per 15 minutes before temporary lockout to defeat credential stuffing.

### 3.5 Attachment Security
- Allowlisted file extensions: `.pdf`, `.png`, `.jpg`, `.jpeg`.
- MIME type verification: `application/pdf`, `image/png`, `image/jpeg`.
- Maximum file size: 10 MB per file.
- Path traversal mitigation: Input filenames are stripped of directories (`../`, `..\\`) and replaced with cryptographically random storage UUIDs.
- Private storage: Uploaded files reside outside web root with no static URL. Access requires authenticated session or validated tracking session.

---

## 4. Key Management & Encryption Limitations (MVP Documentation)
- **Application-Level Encryption**: Sensitive case narratives in persistent storage are encrypted using AES-GCM-256 / ChaCha20-Poly1305 with keys derived from `CASEBRIDGE_ENCRYPTION_KEY`.
- **Honest MVP Limitation**: In the current MVP deployment, key rotation is manual and relies on container environment variables. In an enterprise production deployment, keys should be backed by a Hardware Security Module (HSM) or cloud KMS (Google Cloud KMS / AWS KMS) with automated envelope encryption.
