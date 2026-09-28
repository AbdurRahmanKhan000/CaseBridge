# CaseBridge

> A lightweight, privacy-focused web application for anonymous university case/complaint reporting and institutional case management.

---

## 1. Project Overview

CaseBridge bridges the gap between student safety and institutional accountability. It provides university members with a clear, structured way to report sensitive concerns—ranging from harassment and bullying to discrimination, academic misconduct, and administrative disputes—without providing direct personal identity information.

Reporters receive a high-entropy, unpredictable tracking code (`CB-XXXX-XXXX-XXXX`), follow resolution milestones, communicate with authorized institutional reviewers, and review findings. CaseBridge stores only an irreversible SHA-256 hash of the tracking code and does not store names, student IDs, personal email addresses, or client IP addresses.

---

## 2. Technology Stack

- **Application & Presentation Layer**: Python 3.11, Flask application factory, Jinja2 templates, semantic HTML5, accessible CSS design tokens, lightweight vanilla JavaScript modules.
- **Security & Authorization**: Flask-WTF CSRF protection, Flask-Limiter brute-force defenses, role-based access control (RBAC), sanitized logging filter, Fernet AES-256 field encryption.
- **Data Layer**: SQLAlchemy 2.0 ORM, MySQL 8.0 (production & local), Alembic / Flask-Migrate.
- **Production Server**: Gunicorn WSGI HTTP server (3 worker processes).
- **Containerization**: Dockerfile (multi-stage non-root Python 3.11-slim) and Docker Compose v2.
- **Testing**: Automated test suite covering core engine functions, security threats, RBAC, and boundary cases.

---

## 3. Prerequisites

- **Docker Option**: Docker Engine 24.0+ and Docker Compose v2+
- **Local Non-Docker Option**:
  - Python 3.11+
  - MySQL 8.0 Server
  - MySQL client development headers (`default-libmysqlclient-dev` on Debian/Ubuntu, or `mysql-client` on macOS)
  - Git

---

## 4. Local Non-Docker Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/casebridge.git
cd casebridge

# 2. Create and activate a Python 3.11 virtual environment
python3.11 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Copy environment configuration
cp .env.example .env
```

---

## 5. MySQL Setup

Log into your local MySQL server as `root` and execute:

```sql
-- Create database with utf8mb4 encoding
CREATE DATABASE casebridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated application user
CREATE USER 'casebridge_user'@'localhost' IDENTIFIED BY 'casebridge_secure_password';

-- Grant required permissions
GRANT ALL PRIVILEGES ON casebridge_db.* TO 'casebridge_user'@'localhost';
FLUSH PRIVILEGES;
```

In `.env`, configure `DATABASE_URL`:
```ini
DATABASE_URL=mysql+pymysql://casebridge_user:casebridge_secure_password@127.0.0.1:3306/casebridge_db
```

---

## 6. Environment Variables Reference

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default / Example |
|:---|:---|:---|
| `FLASK_ENV` | Environment mode (`production`, `development`) | `production` |
| `PORT` | Listening port for web server | `5000` |
| `SECRET_KEY` | Flask session cookie & CSRF signing key | 64-char random hex string |
| `TRACKING_CODE_SALT` | Server-side pepper for SHA-256 tracking code hashing | High-entropy string |
| `CASE_ENCRYPTION_KEY` | 32-byte base64 Fernet key for field encryption | Base64-encoded 32-byte key |
| `DATABASE_URL` | MySQL 8.0 connection URI | `mysql+pymysql://user:pass@host:3306/db` |
| `UPLOAD_FOLDER` | Directory for private evidence attachments | `instance/protected_uploads` |
| `MAX_CONTENT_LENGTH_MB` | Maximum allowed attachment size in MB | `5` |
| `RATELIMIT_STORAGE_URI` | Rate limiting backend (`memory://` or `redis://`) | `memory://` |
| `INSTITUTION_NAME` | Organization name shown in headers & footers | `Metropolitan University Ethics & Case Office` |
| `SUPPORT_EMAIL` | Administrative contact email | `integrity-helpdesk@university.edu` |
| `PHONE_NUMBER` | Emergency / hotline contact number | `+92 42 99029216` |

---

## 7. Database Migrations

Run database migrations to initialize or upgrade the schema:

```bash
export FLASK_APP=wsgi.py
flask db upgrade
```

To roll back a migration:
```bash
flask db downgrade
```

---

## 8. Seed / Demo Data

When CaseBridge starts and connects to an empty database, it automatically initializes foundational reference data:
- **Roles**: `COMMITTEE_MEMBER`, `COMMITTEE_LEAD`, `SYSTEM_ADMIN`
- **Grievance Categories**: Harassment, Bullying, Corruption, Discrimination, Unfair Treatment, Academic Issue, Administrative Issue, Other
- **Default Staff Demo Accounts**:
  - `elena.vance` (Committee Member)
  - `marcus.thorne` (Committee Lead)
  - `sarah.jenkins` (System Admin)
  - Default initial password: `password123` (Must be changed immediately upon production deployment)
- **System Settings**: Retention policies, SLA thresholds, and emergency contact details.

---

## 9. Docker Setup

Build the production Docker image directly:

```bash
# Build the Docker image
docker build -t casebridge:latest .

# Run the container (connecting to existing MySQL network)
docker run -d \
  --name casebridge-app \
  -p 5000:5000 \
  --env-file .env \
  -v protected_uploads:/home/casebridge/app/instance/protected_uploads \
  casebridge:latest
```

---

## 10. Docker Compose Setup (Recommended)

Docker Compose provisions both the CaseBridge web application and an isolated MySQL 8.0 database in an internal bridge network:

```bash
# 1. Create and customize environment file
cp .env.example .env

# 2. Build and start containers
docker compose up -d --build

# 3. Verify services are healthy
docker compose ps

# 4. View application logs
docker compose logs -f web

# 5. Access CaseBridge in your browser
# http://localhost:5000
```

*Note: MySQL is not exposed publicly to the host machine. It communicates with the CaseBridge web application over the private internal Docker network.*

---

## 11. Running Tests

Execute the automated test suite:

```bash
# Frontend & engine verification tests (Vitest)
npm test

# Python backend unit tests (if pytest is installed in your Python environment)
pytest tests/ -v
```

---

## 12. Production Configuration

In a production environment, verify the following:
1. `FLASK_ENV=production`: Disables Flask interactive debuggers and verbose stack traces.
2. `SESSION_COOKIE_SECURE=True`: Enforces HTTPS-only transmission of session cookies.
3. `SESSION_COOKIE_SAMESITE=Strict`: Mitigates cross-site request forgery attacks.
4. `Gunicorn`: Web process runs with 3 worker processes (`gunicorn --bind 0.0.0.0:5000 --workers 3 wsgi:app`).
5. **Non-Root User**: The container executes as user `casebridge` (UID 1001).
6. **Reverse Proxy TLS**: Deploy behind an edge reverse proxy (Nginx, Caddy, Cloudflare, or Render) terminating TLS/HTTPS.

---

## 13. Render Deployment

1. Connect your repository to [Render](https://render.com).
2. Create a **New Web Service**:
   - **Runtime**: `Docker`
   - **Region**: Choose the region closest to your MySQL database.
   - **Instance Type**: Starter (512MB RAM minimum).
3. Under **Environment Variables**, provide all variables from `.env.example`.
4. Point `DATABASE_URL` to your external managed MySQL 8.0 instance (e.g. Aiven, PlanetScale, DigitalOcean).
5. Set **Health Check Path** to `/health`.
6. Attach a **Persistent Disk** mounted at `/home/casebridge/app/instance/protected_uploads` (1GB size minimum).
7. Deploy the service.

---

## 14. Common Deployment Errors

- **`Can't connect to MySQL server`**: Check that the MySQL container or host is running, and that credentials and hostname in `DATABASE_URL` match. In Docker Compose, the database hostname is `db`.
- **`503 Service Unavailable on /health`**: The application is running but the database probe (`SELECT 1`) failed. Inspect database logs.
- **`Permission denied on protected_uploads`**: Ensure the volume mounted to `/home/casebridge/app/instance/protected_uploads` has write permissions for UID 1001.
- **`CSRF token missing`**: When running behind a reverse proxy, ensure `X-Forwarded-Proto: https` is forwarded to the application container so secure cookies work properly.

---

## 15. Security Warnings

- **Never commit `.env` or raw secrets** to source control.
- **Change default demo passwords** immediately when deploying to a live network.
- **Network Metadata Disclaimer**: While CaseBridge guarantees zero application-level identity storage, intermediary network infrastructure (proxies, VPNs, ISPs) may maintain lower-level connection logs.

---

## 16. Backup Considerations

- **Database Backups**: Perform regular logical backups using `mysqldump`:
  ```bash
  mysqldump -u casebridge_user -p --single-transaction --quick casebridge_db > backup_$(date +%F).sql
  ```
- **Evidence Storage**: Back up the `instance/protected_uploads` volume to an encrypted backup target.
- **Disaster Recovery**: Verify that the database dump can be restored into a clean MySQL 8.0 instance and that `CASE_ENCRYPTION_KEY` is preserved; without the encryption key, encrypted case narrative cannot be decrypted.
