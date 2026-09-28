# ==============================================================================
# CaseBridge - Production Container Image (Python 3.11)
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered standard I/O
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production

# Install system dependencies for cryptography, MySQL client libraries, and health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user
RUN useradd -m -u 1001 -s /bin/bash casebridge
WORKDIR /home/casebridge/app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY --chown=casebridge:casebridge . .

# Create secure instance and upload directories
RUN mkdir -p instance/protected_uploads && \
    chown -R casebridge:casebridge instance

USER casebridge

# Expose port (5000 standard WSGI)
EXPOSE 5000

# Healthcheck against Flask health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Production WSGI server command
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "3", "--access-logfile", "-", "--error-logfile", "-", "wsgi:app"]
