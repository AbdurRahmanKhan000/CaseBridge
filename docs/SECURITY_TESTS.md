# CaseBridge Security Tests & Verification Report

## 1. Overview
Stage 6 implemented and verified defensive security controls corresponding to the 15 threat scenarios identified in `docs/THREAT_MODEL.md`.

---

## 2. Automated Test Suite Mapping

All automated security tests are implemented in `tests/test_security_hardening.test.ts` and `tests/test_crypto_security.py` (and related test suites).

| Threat Ref | Test Description | Test File & Spec | Status |
|:---|:---|:---|:---|
| **T01 / T14** | Case Disclosure & IDOR: Verify internal IDs, confidential notes, and staff details are purged from student view | `test_security_hardening.test.ts` > *Threat 1 & 14: Case Disclosure & IDOR Resistance* | **PASSED** |
| **T02** | Tracking Code Guessing: 100 codes generated verified for >60-bit entropy, zero sequential patterns, and exclusion of ambiguous characters (`0`, `O`, `1`, `I`) | `test_security_hardening.test.ts` > *Threat 2: Tracking Code Guessing & Entropy* | **PASSED** |
| **T02** | Brute-force Lockout: Rate-limiting throttles tracking code lookups after repeated failed attempts with 429 response | `test_security_hardening.test.ts` > *enforces lockout throttling after repeated failed tracking lookups* | **PASSED** |
| **T03 / T04** | Privilege Escalation: Verify standard committee members cannot perform Committee Lead assignments | `test_security_hardening.test.ts` > *Threat 3 & 4: Staff Access & Privilege Escalation* | **PASSED** |
| **T06** | XSS Prevention: Malicious script tags, HTML event handlers, and javascript: URLs are stripped from narratives and subjects | `test_security_hardening.test.ts` > *Threat 6: Cross-Site Scripting (XSS) Prevention* | **PASSED** |
| **T09 / T15** | Malicious File Upload: Path traversal strings (`../../etc/passwd`) are blocked | `test_security_hardening.test.ts` > *rejects path traversal attempts in uploaded filenames* | **PASSED** |
| **T09 / T15** | Executable Upload: Scripts (`.exe`, `.sh`, `.php`, `.js`) rejected even if mime-type is forged | `test_security_hardening.test.ts` > *rejects executable and script files regardless of claimed content* | **PASSED** |
| **T09 / T15** | MIME mismatch & file size limits: Mismatches and files > 10MB rejected | `test_security_hardening.test.ts` > *rejects MIME type mismatches and oversized uploads* | **PASSED** |
| **T10** | Input Boundary: Submissions exceeding 10,000 characters rejected | `test_security_hardening.test.ts` > *Threat 10: Input Boundary Validation* | **PASSED** |
| **T11 / T12** | Sensitive Data Leakage in Audit Trail: Case narratives and complaint texts are never duplicated into audit trail events | `test_security_hardening.test.ts` > *Threat 11 & 12: Sensitive Data Leakage in Audit Trail* | **PASSED** |

---

## 3. Manual Verification Checklist

1. **Browser Network Inspection**:
   - Tracking lookup requests transmit only the 12-character token.
   - Successful responses contain exclusively student-permitted fields (Subject, Category, Status, Created Date, Public Messages, Public Attachments).
   - No cookie containing personal student identifiers is set on student browsing sessions.
2. **HTTP Response Headers**:
   - `Content-Security-Policy: default-src 'self' ...`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`
3. **Session Cookie Attributes**:
   - `session`: `HttpOnly; SameSite=Lax` (and `Secure` on HTTPS)
   - Verified that session cookie regenerates on authentication.
4. **Error Page Leakage**:
   - 404, 403, 429, and 500 error pages display institutional branded error copy without stack traces, database error messages, or internal file paths.
