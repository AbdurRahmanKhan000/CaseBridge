# CaseBridge Threat Model (OWASP ASVS 5.0.0 Reference)

This threat model documents the analysis, potential attack vectors, mitigations, and residual risks for the 15 critical threat scenarios identified for CaseBridge.

---

## Threat Matrix & Mitigation Summary

| ID | Threat Scenario | Impact | Primary Mitigation / Control | Residual Risk & Posture |
|:---|:---|:---|:---|:---|
| **T01** | **Case Disclosure** | Confidential student complaint made visible to unauthorized third parties | Dual-portal isolation: Tracking views strictly scrub internal IDs, staff credentials, and confidential notes. Committee portal enforces strict RBAC. | Negligible within application boundaries. Physical screen privacy at user terminal remains out-of-band. |
| **T02** | **Tracking-Code Guessing** | Adversary attempts to guess tracking codes to read arbitrary student cases | 60+ bits entropy ($32^{12}$ combinations); non-sequential CSPRNG; SHA-256 salted hash storage; 10 req/min rate limit with exponential backoff. | Sub-billionth probability of collision or successful brute-force. |
| **T03** | **Unauthorized Staff Access** | Unauthenticated user accesses committee review panel | Login required with Argon2id / bcrypt password hashing; session fixation protection; strict route decorators. | Compromised staff credentials require multi-factor authentication in future milestone. |
| **T04** | **Privilege Escalation** | Regular committee member reassigns cases or modifies system settings | RBAC enforcement: Only `COMMITTEE_LEAD` or `SYSTEM_ADMIN` can reassign cases; unauthorized attempts rejected with 403 Forbidden. | Role definitions in database must be audited periodically. |
| **T05** | **SQL Injection** | Attacker injects malicious SQL statements to dump database | 100% Parameterized queries via ORM. Zero dynamic string concatenation in query construction. | No dynamic raw SQL allowed by coding standards. |
| **T06** | **Cross-Site Scripting (XSS)** | Attacker submits `<script>` payload in grievance narrative or subject | Rigorous input sanitization (`sanitizeInput`); Jinja2 autoescaping / React JSX virtual DOM contextual escaping; defensive CSP header (`script-src 'self'`). | Defense-in-depth across both backend and frontend layers. |
| **T07** | **Cross-Site Request Forgery (CSRF)** | Third-party site executes state-changing actions in staff session | SameSite=Lax cookie attribute; CSRF token validation on state-changing POST forms; header-based JSON checks. | Standard browser conformance prevents cross-origin submission. |
| **T08** | **Session Abuse** | Hijacking or re-using expired staff session tokens | Session regeneration on login; 30-minute idle expiration; HttpOnly and Secure flags; explicit session destruction on logout. | Physical compromise of unlocked staff workstation mitigated by idle timeout. |
| **T09** | **Malicious File Upload** | Attacker uploads webshell or executable disguised as complaint proof | Strict file extension allowlist (`.pdf`, `.png`, `.jpg`, `.jpeg`); MIME-type checking; server assigns random UUID filename; zero execution permissions. | Files stored outside web root; no static URL direct access. |
| **T10** | **Excessive Automated Submissions** | Adversary spams submission endpoint to cause denial of service | IP-based submission rate limiting; server-side payload size bounds (narrative max 10,000 chars); file upload size caps (10 MB). | Edge DDoS mitigation provided by Google Cloud Run / Load Balancer. |
| **T11** | **Sensitive Data in Logs** | Student complaints, credentials, or keys logged to disk or console | Custom `SensitiveFilter` and sanitized logger stripping complaint narrative, passwords, tracking codes, and keys. | Low-level server container crash dumps require secure log aggregation access. |
| **T12** | **Sensitive Data Leakage Through Errors** | 500 error page reveals stack trace, file paths, or DB schema | Production error handlers returning generic user-friendly messages for 403, 404, 429, and 500; debug mode disabled in production. | Development logs kept strictly local. |
| **T13** | **ID Enumeration** | Sequential integers in URLs allow scraping of case records | Student portal uses random 12-character alphanumeric tokens; public endpoints never accept or return raw database integer IDs. | Database primary keys remain internal only. |
| **T14** | **Insecure Direct Object References (IDOR)** | Authenticated user downloads attachments belonging to another case | Route verification: Attachment download checks whether attachment belongs to the verified case and requester is authorized. | Verified by automated unit tests. |
| **T15** | **Insecure Attachment Access** | Direct unauthenticated URL access to stored files | Files stored in private directory outside web server document root; accessed exclusively via authenticated/tracked streaming routes. | Impossible to guess or access without valid session/token. |

---

## Anonymity Boundary Verification
1. **Intentionally Excluded Attributes**:
   - `student_name`
   - `student_id`
   - `student_email`
   - `student_phone`
   - `client_ip_address`
   - `browser_fingerprint`
   - `device_identifier`
2. **Operational Reality Note**:
   Network layer telemetry (TCP/IP connection logs, proxy ingress logs) exists at the cloud infrastructure level outside the application code. CaseBridge does not correlate, persist, or inspect these headers within the application database.
