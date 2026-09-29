# CaseBridge - Architectural Decisions Record (ADR)

## ADR-001: Multi-Environment Delivery Strategy (Node/Vite Preview & Flask/MySQL Target)
- **Status:** Approved
- **Context:**
  The project requirements mandate Python 3.11, Flask, Jinja2, and MySQL 8.0 for production container deployments, while the AI Studio deployment and preview container enforces a Node/Vite build pipeline on port 3000 (`npm run build`, `npm run dev`).
- **Decision:**
  1. Implement a complete, high-fidelity interactive web application running on Vite + TypeScript + React within the AI Studio container to provide instant, accessible, WCAG 2.2 AA compliant testing of all student, committee, and admin user journeys.
  2. Implement a complete, standalone Python 3.11 / Flask / SQLAlchemy / MySQL 8.0 backend specification and migration suite under `backend/` complete with Dockerfile and `docker-compose.yml` for direct local or Render cloud deployment.
  3. All data models, tracking code hashing schemes, RBAC definitions, and audit rules remain strictly synchronized between both implementations.

## ADR-002: Secure Tracking Code Representation
- **Status:** Approved
- **Decision:**
  - Format: `CB-` prefix followed by three 4-character alphanumeric blocks (e.g. `CB-A7K2-9D4E-1M8P`).
  - Storage: The database stores `code_hash = SHA256(raw_code + salt)`.
  - The raw code is presented to the student only on the initial success screen and never permanently persisted in raw form.
  - Tracking verification hashes the candidate code and queries by `code_hash`.

## ADR-003: Privacy & Zero-Knowledge Identity Boundary
- **Status:** Approved
- **Decision:**
  - The submission schema completely omits `student_id`, `name`, `email`, `phone_number`, `ip_address`, `user_agent`, and `device_fingerprint`.
  - Application audit records for student actions record actor as `ANONYMOUS_STUDENT` with no IP logging.
  - Clear user-facing notices clarify that while CaseBridge guarantees zero application-level identity storage, network routing and ISP infrastructure outside CaseBridge may log network traffic.

## ADR-004: Evidence Attachment Privacy Protection
- **Status:** Approved
- **Decision:**
  - Attachments are limited to max 5MB.
  - Whitelist: PDF, JPEG, PNG, TXT, DOCX.
  - Original filenames are sanitized and stored under UUID-based obfuscated keys.
  - Direct public folder browsing is disabled; access is gated by valid tracking session or authorized committee role.

## ADR-005: Audit Trail Architecture
- **Status:** Approved
- **Decision:**
  - An append-only `case_audit_logs` collection/table records timestamp, case reference, action type (e.g., `STATUS_UPDATED`, `PRIORITY_CHANGED`, `NOTE_ADDED`, `ASSIGNED`, `MESSAGE_SENT`), actor role, and previous/new values.
  - Committee users cannot delete or alter historical audit logs.

## ADR-006: Stage 1 Foundation and Architecture Layout
- **Status:** Approved
- **Decision:**
  - The repository maintains the standard root layered modular Flask 3.0 / SQLAlchemy architecture (`/app`, `/config`, `/migrations`, `/tests`, `/static`, `/templates`, `/docs`, `Dockerfile`, `docker-compose.yml`, `requirements.txt`, `wsgi.py`).
  - Separation of environments (Development, Production, Testing) with MySQL 8.0 support.
  - Application factory pattern in `app/__init__.py` integrates CSRF protection, Flask-Limiter, logging sanitization, and error handling.
  - Reusable CSS tokens and accessible semantic UI templates support WCAG 2.2 AA and responsive design across all public, committee, and administrative views.

## ADR-007: Stage 2 MySQL 8.0 Relational Design and Zero-SQLite Mandate
- **Status:** Approved
- **Decision:**
  - SQLite is completely rejected across all environments (including testing and development). MySQL 8.0 is the sole supported relational database engine.
  - All 11 core entities (`roles`, `users`, `complaint_categories`, `cases`, `assignments`, `messages`, `case_events`, `attachments`, `escalations`, `notifications`, `system_settings`) are formally specified with foreign keys, constraints, and indexes in migration `001_initial_schema.py`.
  - Application allows starting in development mode gracefully while waiting for local MySQL setup.
  - Cryptographic server-side secrets (`SECRET_KEY`, `TRACKING_CODE_SALT`, `CASE_ENCRYPTION_KEY`) are generated and loaded strictly from server-side environment variables and excluded from git.
  - Sensitive case narrative and dialogue are encrypted at the application level using AES-256 (Fernet) while metadata remains unencrypted for efficient indexing.

## ADR-008: Stage 9 Containerization, Deployment Topology and Small-Scale Production Preparation
- **Status:** Approved
- **Decision:**
  - Standardize container runtime on official `python:3.11-slim` running an unprivileged `casebridge` user (UID 1001) with production Gunicorn WSGI server (3 worker processes binding to `0.0.0.0:5000`).
  - Isolate MySQL 8.0 on a private internal bridge network (`casebridge_internal`) in Docker Compose, explicitly removing public host port mappings to prevent internet exposure.
  - Implement health endpoint `/health` performing non-blocking `SELECT 1` queries to verify database connectivity.
  - Enforce `.dockerignore` preventing leakage of `.env`, `.git`, test caches, or build artifacts into production images.
  - Retain private filesystem storage at `instance/protected_uploads` backed by persistent volumes.

## ADR-009: Stage 10 Release-Candidate Audit and Production Baseline Stabilization
- **Status:** Approved
- **Decision:**
  - Establish Release Candidate 1 (RC-1) as the production baseline. All functional requirements (FR-01 through FR-10) are validated with 61/61 automated tests passing.
  - Freeze UI/UX, page loading performance, database schema, and public content.
  - Document formal access control boundaries in `docs/ACCESS_CONTROL.md` and complete requirement traceability in `docs/MVP_RELEASE_AUDIT.md` using Mermaid diagrams.
  - Defer non-critical enhancements (MFA, ClamAV scanning, distributed Redis rate limiting) to post-MVP roadmap.




