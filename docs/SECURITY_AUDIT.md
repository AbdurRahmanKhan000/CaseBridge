# CaseBridge - Security & Privacy Verification

## 1. Threat Model & Countermeasures (OWASP ASVS Baseline)

| Risk Area | Threat Description | CaseBridge Mitigation |
| :--- | :--- | :--- |
| **Tracking Enumeration** | Attacker iterates simple numbers (`1001`, `1002`) to view student complaints. | 1. High-entropy cryptographically generated token: `CB-` + 12 alphanumeric characters (entropy > 60 bits).<br>2. Hashed storage using SHA-256.<br>3. Rate limiting (e.g. 5 attempts / min) with progressive cooldown. |
| **Identifier Leakage** | Student identity stored in records or logs. | Zero persistence of student name, matriculation number, phone, email, IP address, user agent, or device fingerprint in anonymous case tables. |
| **Tampering & Repudiation** | Committee member claims they did not modify status or close case. | Append-only audit logs recording exact action type, actor role, timestamp, and field differences. |
| **Insecure Direct Object Reference (IDOR)** | Student attempts to read another case by modifying an ID. | Public tracking access is strictly keyed by raw code hash verification. Internal primary keys (`case.id`) are never exposed or accepted from anonymous endpoints. |
| **Malicious Attachments** | Executable scripts or viruses uploaded as evidence. | Strict MIME-type whitelisting, file extension verification, size caps (5MB), randomized storage UUIDs, disabling script execution in upload directory. |
| **Cross-Site Scripting (XSS)** | Malicious HTML/JS in incident narrative or messages. | Automatic context-aware escaping on all rendered content; strict input sanitization. |
| **Unauthorized Escalation** | Committee Member attempting Lead/Admin privileges. | Role-Based Access Control (RBAC) enforced at service and route guards. |

## 2. Privacy Boundary Declaration
- **What CaseBridge Guarantees:**
  - CaseBridge application code does not store or process student identifiers for anonymous submissions.
  - No tracking cookies, advertising pixels, or telemetry scripts are embedded.
  - Internal investigative notes remain confidential to authorized committee members.
- **What Depends on Infrastructure / User Environment:**
  - Network logs maintained by campus WiFi providers, commercial VPNs, or ISP routers outside CaseBridge.
  - Students are advised to submit from a private browser window or personal network if seeking total transport-level separation.
