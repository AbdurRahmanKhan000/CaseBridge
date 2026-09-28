# CaseBridge Deployment Guide (Stage 9)

## 1. System Overview & Deployment Topology

CaseBridge is a privacy-focused case and complaint management platform designed for institutional reporting and case review.

In production and containerized environments, the application follows a layered architecture:

```text
[ Web Browser ]
      |
      | HTTPS (TLS Terminated at Edge Proxy / Load Balancer)
      v
+-------------------------------------------------------------+
| CaseBridge Container (Python 3.11 / Gunicorn WSGI)          |
| - Non-root user: casebridge (UID 1001)                      |
| - Health endpoint: /health                                  |
| - Gunicorn: 3 worker processes binding to 0.0.0.0:5000     |
| - Uploads: /home/casebridge/app/instance/protected_uploads  |
+-------------------------------------------------------------+
      |
      | Private Internal Docker Network (casebridge_internal)
      | (MySQL is NOT exposed to public internet)
      v
+-------------------------------------------------------------+
| MySQL 8.0 Relational Database                               |
| - Database: casebridge_db                                   |
| - Storage: Named volume (mysql_data)                        |
| - Pool pre-ping: True, pool recycle: 3600s                  |
+-------------------------------------------------------------+
```

---

## 2. Prerequisites

### Local Development / Non-Docker
- Python 3.11+
- MySQL 8.0 Server (running locally or accessible via network)
- `pkg-config` and MySQL client development libraries (`default-libmysqlclient-dev` on Debian/Ubuntu)
- Git

### Containerized Deployment
- Docker Engine 24.0+ and Docker Compose v2+

---

## 3. Environment Variables Reference

Create a `.env` file from `.env.example`:

| Variable | Description | Example / Default | Required in Production |
|:---|:---|:---|:---:|
| `FLASK_ENV` | Runtime environment (`production`, `development`, `testing`) | `production` | Yes |
| `PORT` | HTTP port for the container or WSGI server | `5000` | No (Default: 5000) |
| `SECRET_KEY` | Cryptographic secret for signing session cookies & CSRF | 64-char random hex | **YES** |
| `TRACKING_CODE_SALT` | Server-side pepper for irreversible tracking code hashing | High-entropy string | **YES** |
| `CASE_ENCRYPTION_KEY` | 32-byte base64 Fernet key for field-level encryption | Fernet base64 key | Optional/Recommended |
| `DATABASE_URL` | MySQL 8.0 connection URI (`mysql+pymysql://...`) | `mysql+pymysql://user:pass@host:3306/db` | **YES** |
| `UPLOAD_FOLDER` | Absolute or relative path to store private evidence files | `/home/casebridge/app/instance/protected_uploads` | Yes |
| `MAX_CONTENT_LENGTH_MB` | Maximum permitted file upload size in megabytes | `5` | No (Default: 5) |
| `RATELIMIT_STORAGE_URI` | Storage backend for rate-limiting | `memory://` (single worker) or `redis://` | No |
| `INSTITUTION_NAME` | Display name of the reporting organization | `Metropolitan University Ethics & Case Office` | No |
| `SUPPORT_EMAIL` | Contact email for system administrators | `integrity-helpdesk@university.edu` | No |
| `PHONE_NUMBER` | Emergency / hotline phone number | `+92 42 99029216` | No |

### Key Generation Commands:
```bash
# Generate SECRET_KEY
python3 -c "import secrets; print(secrets.token_hex(32))"

# Generate TRACKING_CODE_SALT
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate CASE_ENCRYPTION_KEY
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

## 4. Local Deployment Options

### Option A: Docker Compose (Recommended)

1. **Clone the repository and copy the environment template:**
   ```bash
   cp .env.example .env
   ```
2. **Edit `.env`** to set secure values for `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD`.
3. **Build and start the stack:**
   ```bash
   docker compose up -d --build
   ```
4. **Verify container health:**
   ```bash
   docker compose ps
   curl -i http://localhost:5000/health
   ```
5. **View logs:**
   ```bash
   docker compose logs -f web
   ```
6. **Stop the stack:**
   ```bash
   docker compose down
   ```

### Option B: Local Non-Docker (Python Virtual Environment)

1. **Ensure MySQL 8.0 is running and create database:**
   ```sql
   CREATE DATABASE casebridge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'casebridge_user'@'localhost' IDENTIFIED BY 'casebridge_secure_password';
   GRANT ALL PRIVILEGES ON casebridge_db.* TO 'casebridge_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
2. **Create Python virtual environment & install requirements:**
   ```bash
   python3.11 -m venv .venv
   source .venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env to set your local MySQL credentials in DATABASE_URL
   ```
4. **Execute database migrations:**
   ```bash
   export FLASK_APP=wsgi.py
   flask db upgrade
   ```
5. **Start application with Gunicorn:**
   ```bash
   gunicorn --bind 0.0.0.0:5000 --workers 3 wsgi:app
   ```

---

## 5. Render Small-Scale Deployment

Render (or equivalent small-scale PaaS platforms like Railway or Fly.io) can host the CaseBridge web service with an external MySQL 8.0 database.

### 5.1 Deployment Architecture on Render
- **Web Service:** CaseBridge Docker container running on Render Web Service.
- **Database:** Managed MySQL 8.0 (Render Managed PostgreSQL is not supported because CaseBridge strictly uses MySQL 8.0; provision MySQL 8.0 on Aiven, PlanetScale, DigitalOcean, or an external provider).
- **Persistent Disk:** Attach a 1GB–5GB persistent disk mounted at `/home/casebridge/app/instance/protected_uploads` for evidence files.

### 5.2 Step-by-Step Render Setup

1. **Push repository to GitHub.**
2. **Create New Web Service in Render:**
   - Connect your GitHub repository.
   - **Environment:** `Docker` (Render automatically uses the root `Dockerfile`).
   - **Branch:** `main`
   - **Region:** Choose region closest to your MySQL database.
   - **Instance Type:** Starter (512MB RAM, 0.5 CPU minimum).
3. **Configure Environment Variables in Render Dashboard:**
   - `FLASK_ENV`: `production`
   - `PORT`: `5000`
   - `SECRET_KEY`: `<generated-64-char-hex>`
   - `TRACKING_CODE_SALT`: `<generated-random-salt>`
   - `CASE_ENCRYPTION_KEY`: `<generated-fernet-key>`
   - `DATABASE_URL`: `mysql+pymysql://<user>:<password>@<mysql-host>:<port>/<database>?ssl_ca=/etc/ssl/certs/ca-certificates.crt`
   - `UPLOAD_FOLDER`: `/home/casebridge/app/instance/protected_uploads`
   - `MAX_CONTENT_LENGTH_MB`: `5`
   - `RATELIMIT_STORAGE_URI`: `memory://`
   - `INSTITUTION_NAME`: `Metropolitan University Ethics & Case Office`
   - `SUPPORT_EMAIL`: `integrity-helpdesk@university.edu`
   - `PHONE_NUMBER`: `+92 42 99029216`
4. **Configure Health Check Path:**
   - **Health Check Path:** `/health`
5. **Attach Persistent Disk (Render Disks):**
   - **Name:** `casebridge-uploads`
   - **Mount Path:** `/home/casebridge/app/instance/protected_uploads`
   - **Size:** `1 GB`
6. **Deploy:** Click **Create Web Service**.

---

## 6. Database Migration & Initialization Workflow

CaseBridge handles database initialization safely:

1. **Automatic Initialization on Reachable Database:**
   When the Flask application boots with a connected MySQL database, `app/__init__.py` invokes:
   - `db.create_all()` (idempotently ensures all 11 tables exist)
   - `_seed_initial_data()` (seeds roles, categories, system settings, and demo review accounts if empty)
2. **Manual Alembic Migration Command:**
   ```bash
   # From container or local shell:
   flask db upgrade
   ```
3. **Migration Rollback (if necessary):**
   ```bash
   flask db downgrade
   ```

---

## 7. Common Deployment Errors & Troubleshooting

| Error | Root Cause | Solution |
|:---|:---|:---|
| `OperationalError: Can't connect to MySQL server` | MySQL container not ready or invalid host | Ensure MySQL service is healthy. In Docker Compose, verify `depends_on: db: condition: service_healthy`. Check `DATABASE_URL` hostname (`db` in compose, `127.0.0.1` locally). |
| `503 Service Unavailable` on `/health` | Database query `SELECT 1` failed | Check database credentials and network connectivity between application container and MySQL. |
| `413 Request Entity Too Large` | Upload file exceeds 5MB limit | Client uploaded a file larger than `MAX_CONTENT_LENGTH_MB` (5MB). Advise reporter to compress PDF/images. |
| `PermissionError: [Errno 13] Permission denied: '/home/casebridge/app/instance/protected_uploads'` | Container running as non-root user without volume write permissions | Ensure Docker volume or mount has ownership `casebridge:casebridge` (UID 1001). The Dockerfile automatically sets permissions during build. |
| `CSRF token missing or incorrect` | Cookie dropped due to HTTP vs HTTPS mismatch | In production, `SESSION_COOKIE_SECURE=True` requires HTTPS. Ensure edge proxy passes `X-Forwarded-Proto: https`. |

---

## 8. Backup & Data Retention Considerations

- **MySQL Backups:**
  Schedule daily logical backups using `mysqldump`:
  ```bash
  mysqldump -u casebridge_user -p --single-transaction --quick --databases casebridge_db > casebridge_backup_$(date +%F).sql
  ```
- **Evidence Storage Backups:**
  The `instance/protected_uploads` volume contains sensitive grievance attachments. Mirror this volume to an encrypted backup target with restricted access permissions.
- **Data Retention Policy:**
  CaseBridge system settings include `retention_policy_days` (default: 365 days). Closed cases and expired evidence should be purged according to institutional ethics guidelines.
