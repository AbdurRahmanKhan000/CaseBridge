# CaseBridge Production Readiness Checklist (Stage 9)

## 1. Security & Credentials Checklist

- [ ] **Secret Key Hardening:** `SECRET_KEY` is set to a cryptographically strong, randomly generated 64-character hex string (not the development default).
- [ ] **Tracking Code Pepper Salt:** `TRACKING_CODE_SALT` is configured as a private, high-entropy server-side string.
- [ ] **Field Encryption Key:** `CASE_ENCRYPTION_KEY` is configured as a valid 32-byte base64-encoded Fernet key.
- [ ] **No Secrets in Source Control:** Verified that `.env`, actual credentials, database passwords, and encryption keys are not committed to Git (`.gitignore` rules verified).
- [ ] **Debug Mode Disabled:** `FLASK_ENV` is set to `production`, ensuring Flask interactive debuggers and stack traces are suppressed.
- [ ] **Session Cookie Flags:** Verified that `SESSION_COOKIE_SECURE=True`, `SESSION_COOKIE_HTTPONLY=True`, and `SESSION_COOKIE_SAMESITE=Strict` are active in production.
- [ ] **CSRF Protection:** Flask-WTF CSRF validation is enabled across all state-mutating endpoints (`POST`, `PUT`, `DELETE`).
- [ ] **Logging Hygiene:** Verified that `SensitiveDataFilter` is attached to loggers, preventing tracking tokens, passwords, and PII from appearing in standard logs.

---

## 2. Infrastructure & Containerization Checklist

- [ ] **Base Image:** Dockerfile uses official `python:3.11-slim` with minimal operating system dependencies.
- [ ] **Non-Root Execution:** Container runs strictly as unprivileged user `casebridge` (UID 1001).
- [ ] **Production WSGI Server:** Gunicorn WSGI server is used (`gunicorn --bind 0.0.0.0:5000 --workers 3 wsgi:app`). The Flask development server (`flask run`) is never used in production.
- [ ] **Isolated Network:** In Docker Compose, MySQL 8.0 is not exposed to the public host and communicates exclusively over `casebridge_internal` bridge network.
- [ ] **Docker Ignore:** `.dockerignore` excludes `.git`, `.env*`, `node_modules`, `tests`, and temporary files from the built container image.
- [ ] **Health Checks:** Container healthcheck queries `http://localhost:5000/health` and verifies that both the web process and MySQL database query (`SELECT 1`) succeed.

---

## 3. Database & Storage Checklist

- [ ] **Database Engine:** MySQL 8.0 is running with utf8mb4 encoding (`utf8mb4_unicode_ci`).
- [ ] **Connection Pooling:** SQLAlchemy engine options specify `pool_pre_ping=True` and `pool_recycle=3600`.
- [ ] **Migration Status:** Database schema is synchronized with migration `001_initial_schema`.
- [ ] **Private Upload Storage:** Evidence files are stored in `instance/protected_uploads` outside public web roots. Directory traversal defenses (`../`) and extension allowlisting are enforced.
- [ ] **Persistent Volume:** A dedicated Docker volume or cloud persistent disk is mounted at the upload directory to prevent data loss on container restart.
- [ ] **File Size Boundary:** Maximum upload size is enforced at `5MB` (`MAX_CONTENT_LENGTH_MB=5`).

---

## 4. Operational & Monitoring Checklist

- [ ] **Health Endpoint Monitoring:** External load balancer or monitoring probe points to `/health` (expected HTTP 200).
- [ ] **Graceful Shutdown:** Gunicorn handles `SIGTERM` and `SIGINT` signals cleanly, allowing in-flight requests to complete.
- [ ] **Automated Backups:** Daily logical backup job configured for MySQL database (`mysqldump`).
- [ ] **Institutional Contacts:** `INSTITUTION_NAME`, `SUPPORT_EMAIL`, and `PHONE_NUMBER` are configured for the reporting organization.
