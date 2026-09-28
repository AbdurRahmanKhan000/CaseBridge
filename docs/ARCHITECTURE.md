# CaseBridge - System Architecture Specification

## 1. Architectural Layers

CaseBridge is architected with a strict layered separation of concerns:

```text
[ Anonymous Student Browser ]        [ Authorized Committee Staff Browser ]
             |                                          |
             | HTTPS (No Client Telemetry)              | HTTPS (Session Cookie: HttpOnly/SameSite)
             v                                          v
+-------------------------------------------------------------------------------+
|                       Presentation Layer (Jinja2 / Semantic HTML)             |
| - CSRF Tokens on all POST requests                                            |
| - Accessible, responsive WCAG 2.2 AA layout                                   |
| - Reusable tokens (navy, blue, white, light gray, green, amber, red)         |
+-------------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------------+
|                       Application Layer (Python 3.11 / Flask)                 |
| - Application Factory Pattern (app/__init__.py)                               |
| - Flask-WTF CSRF Validation                                                   |
| - Flask-Limiter Brute-Force Defense (/submit, /track)                         |
| - RBAC Authorization Decorators (@login_required, @role_required)             |
| - Sanitized Logging Filter (stripping tokens, passwords, IPs)                 |
| - Application-Level AES-256 Field Encryption (Fernet)                         |
| - Cryptographic Tracking Token Primitives (secrets + SHA-256 pepper)          |
+-------------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------------+
|                       Data Access Layer (SQLAlchemy 2.0 / Alembic)            |
| - Connection Pooling (pool_pre_ping=True, pool_recycle=3600)                  |
| - Transaction boundaries & safe rollbacks on exception                        |
| - Migration tracking through Alembic / Flask-Migrate                          |
+-------------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------------+
|                       Database Layer (MySQL 8.0)                              |
| - 11 Core Entities with Foreign Key Integrity & Indexes                       |
| - No direct browser access to the database engine                             |
+-------------------------------------------------------------------------------+
```

---

## 2. Security Boundaries & Zero-Identity Guarantee

1. **Anonymous Intake Isolation**:
   - The submission schema completely omits `student_id`, `name`, `email`, `phone_number`, `ip_address`, and client fingerprints.
   - Client IP addresses are never logged or stored.
2. **Shielded Tracking Lookup**:
   - Students receive an unpredictable 16-character token (`CB-XXXX-XXXX-XXXX`).
   - The database stores only an irreversible SHA-256 digest computed with an application pepper salt (`TRACKING_CODE_SALT`).
   - The database primary key integer is never exposed in client URLs.
3. **Application-Level Encryption**:
   - Sensitive whistleblower narrative text and messages are encrypted at rest using AES-256 (Fernet) with keys managed outside the codebase via server-side environment variables (`CASE_ENCRYPTION_KEY`).
4. **Append-Only Auditing**:
   - The `case_events` table immutably logs every state transition, assignment, and escalation with safe metadata only, ensuring institutional accountability without exposing sensitive case details in audit logs.
