# CaseBridge - Security & Abuse Controls (Stage 5)

## 1. Threat Model & Abuse Protection (Function 10)

Whistleblower systems are high-value targets for both automated abuse (credential stuffing, tracking code enumeration) and denial-of-service spam. CaseBridge enforces defense-in-depth security:

| Threat Vector | Potential Impact | Defensive Control Implemented |
| :--- | :--- | :--- |
| **Tracking Code Guessing / Enumeration** | Malicious actor guessing tracking codes to read confidential cases. | $32^{12}$ entropy keyspace; lookup rate limiting (5 queries/min with 120s lockout); constant-feedback non-revealing error states. |
| **Spam / Automated Submission Flooding** | Database resource exhaustion and committee fatigue. | Rate limiting (10 submissions/hr per IP); server-side minimum length validation (30 chars); required explicit consent flags. |
| **Malicious File Uploads** | Remote code execution, web shell uploads, SVG XSS. | Strict extension and MIME allowlist (PDF, PNG, JPG, JPEG); 5MB size ceiling; storage under randomized UUID names outside web root. |
| **Brute Force Staff Login** | Unauthorized administrative access. | Rate-limited authentication attempts; Scrypt password derivation; session invalidation on logout. |
| **Information Leakage via Audit Logs** | Sensitive whistleblower narratives accidentally logged in plaintext. | Strict rule: Narrative and dialogue contents are encrypted in case tables and **never** stored in audit events. |
| **Tampering with Past History** | Unethical staff altering historical milestones or deletion. | Append-only event store (`case_events`); no database `UPDATE` or `DELETE` endpoints for audit records. |

---

## 2. Tracking Credential Generation & Storage (Function 1 & 2)

### 2.1 Code Generation
- Generated via cryptographically secure random number generator (`crypto.getRandomValues` in browser, `secrets.choice` in Python).
- Selected from an unambiguous 32-character alphabet (omitting 0, O, 1, I to prevent human transcription errors):
  ```text
  2 3 4 5 6 7 8 9 A B C D E F G H J K L M N P Q R S T U V W X Y Z
  ```
- Format: `CB-XXXX-XXXX-XXXX`
- Keyspace entropy: $32^{12} \approx 1.15 \times 10^{18}$ permutations.

### 2.2 Peppered Hashing at Rest
- The plain tracking code is returned to the student **once** on the intake confirmation modal.
- The server computes:
  $$\text{lookup\_hash} = \text{SHA-256}(\text{tracking\_code} \mathbin{\Vert} \text{TRACKING\_CODE\_SALT})$$
- Only `lookup_hash` is persisted in the database. Even with a full database dump, tracking codes cannot be reversed to spy on active student threads.

---

## 3. Strict Student View Sanitization (Function 2 & 4)

When a student accesses their case via `/track` or the tracking API:
1. **Internal Integer ID Shielding**: The primary key `case.id` is not exposed in public views; all lookups use the tracking code.
2. **Internal Note Shielding**: Records marked `isInternalNote = true` are filtered out before JSON serialization or template rendering.
3. **Staff Credential Shielding**: Staff personal email addresses, phone numbers, and login timestamps are never included in message responses.
4. **Unrelated Case Shielding**: Lookups match strictly one exact hash; batch queries across cases are forbidden for non-authenticated clients.

---

## 4. Input Sanitization & Payload Protection
- Form inputs pass through `sanitizeInput` to strip dangerous HTML entities (`&`, `<`, `>`, `"`, `'`).
- Narrative input is capped at 10,000 characters to prevent memory-exhaustion payloads.
- JSON parsing and file uploads reject malformed content types gracefully.
