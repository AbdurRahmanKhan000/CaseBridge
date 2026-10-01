"""CaseBridge Environment and Application Settings."""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load local environment variables from .env file if available
load_dotenv()


class Config:
    """Base Configuration with hardened secure defaults."""
    
    # Core Flask - loaded strictly from server-side environment secrets
    SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_override_required_in_production")
    
    # Database - standard MySQL 8.0 connection string
    # Standard format: mysql+pymysql://<user>:<password>@<host>:<port>/<dbname>
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://casebridge_user:casebridge_secure_password@127.0.0.1:3306/casebridge_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 3600,
        "pool_size": 10,
        "max_overflow": 20,
    }

    # Tracking Code Cryptographic Pepper Salt (server-side secret)
    TRACKING_CODE_SALT = os.getenv("TRACKING_CODE_SALT", "cb_default_pepper_salt_value")

    # Application-Level Field Encryption Key (AES-256 / Fernet key)
    CASE_ENCRYPTION_KEY = os.getenv("CASE_ENCRYPTION_KEY", "")

    # Session & Cookie Security
    SESSION_COOKIE_NAME = "casebridge_session"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False  # Enabled in Production
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)

    # CSRF Protection
    WTF_CSRF_ENABLED = True
    WTF_CSRF_TIME_LIMIT = 3600

    # Rate Limiting
    RATELIMIT_DEFAULT = "100 per minute"
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_STRATEGY = "moving-window"

    # Evidence Upload Constraints (FR-08)
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH_MB", 5)) * 1024 * 1024
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", os.path.join(os.getcwd(), "instance", "protected_uploads"))
    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "txt", "docx"}

    # Institutional Metadata
    INSTITUTION_NAME = os.getenv("INSTITUTION_NAME", "Metropolitan University Ethics & Case Office")
    SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL", "integrity-helpdesk@university.edu")
    PHONE_NUMBER = os.getenv("PHONE_NUMBER", os.getenv("EMERGENCY_PHONE", "+92 42 99029216"))
    EMERGENCY_PHONE = PHONE_NUMBER

    # SMTP Email Configuration (Passwordless Staff OTP Login & Escalations)
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "ARK Ecosystem — CaseBridge")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", os.getenv("SUPPORT_EMAIL", "noreply@casebridge.ark"))


class DevelopmentConfig(Config):
    """Development Environment Settings."""
    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False


class TestingConfig(Config):
    """Testing Environment Settings with MySQL 8.0 target."""
    TESTING = True
    DEBUG = False
    WTF_CSRF_ENABLED = False
    RATELIMIT_ENABLED = False
    # MySQL 8.0 test instance target (NO SQLite)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "TEST_DATABASE_URL",
        "mysql+pymysql://casebridge_user:casebridge_secure_password@127.0.0.1:3306/casebridge_test_db"
    )


class ProductionConfig(Config):
    """Hardened Production Environment Settings."""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "Strict"


def get_config():
    """Factory helper returning appropriate config class based on FLASK_ENV."""
    env = os.getenv("FLASK_ENV", "development").lower()
    if env == "production":
        return ProductionConfig
    elif env == "testing":
        return TestingConfig
    return DevelopmentConfig
