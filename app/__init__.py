"""CaseBridge Application Factory."""

import logging
import os
from flask import Flask, render_template
from flask_wtf.csrf import CSRFProtect

from config import get_config
from app.models import (
    db,
    migrate,
    Role,
    User,
    ComplaintCategory,
    Category,
    Case,
    CasePriority,
    CaseStatus,
    CaseAssignment,
    CaseMessage,
    SenderContext,
    CaseEvent,
    CaseAttachment,
    CaseEscalation,
    CaseNotification,
    SystemSetting,
    StaffLoginOtp,
)
from app.security import limiter, SensitiveDataFilter, hash_password, generate_tracking_code, hash_tracking_code
from app.routes import public_bp, committee_bp, admin_bp, health_bp

csrf = CSRFProtect()


def create_app(config_class=None):
    """
    Construct the core Flask application using the Application Factory Pattern.
    Configured for MySQL 8.0 backend with graceful offline tolerance for initial development.
    """
    app = Flask(__name__, instance_relative_config=True)

    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)

    # Ensure instance and protected upload directories exist
    try:
        os.makedirs(app.instance_path, exist_ok=True)
        os.makedirs(app.config.get("UPLOAD_FOLDER", os.path.join(app.instance_path, "protected_uploads")), exist_ok=True)
    except OSError:
        pass

    # 1. Initialize Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    csrf.init_app(app)
    limiter.init_app(app)

    # 2. Configure Secure Logging (no credentials, tokens, or PII in logs)
    log_filter = SensitiveDataFilter()
    for handler in app.logger.handlers:
        handler.addFilter(log_filter)
    logging.getLogger("werkzeug").addFilter(log_filter)

    # 3. Register Blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(committee_bp)
    app.register_blueprint(admin_bp)

    # 4. Light-weight Security Response Headers (OWASP ASVS Level 2 & Defense-in-Depth)
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "form-action 'self';"
        )
        return response

    # 5. Error Handlers
    @app.errorhandler(403)
    def forbidden_error(error):
        return render_template("errors/403.html"), 403

    @app.errorhandler(404)
    def not_found_error(error):
        return render_template("errors/404.html"), 404

    @app.errorhandler(429)
    def ratelimit_error(error):
        return render_template("errors/429.html"), 429

    @app.errorhandler(500)
    def internal_error(error):
        try:
            db.session.rollback()
        except Exception:
            pass
        return render_template("errors/500.html"), 500

    # 6. Context Processors for Templates
    @app.context_processor
    def inject_global_settings():
        return {
            "institution_name": app.config.get("INSTITUTION_NAME"),
            "support_email": app.config.get("SUPPORT_EMAIL"),
            "emergency_phone": app.config.get("EMERGENCY_PHONE"),
        }

    # 7. Database auto-initialization when MySQL database is reachable
    with app.app_context():
        try:
            db.create_all()
            _seed_initial_data(app)
        except Exception as e:
            app.logger.info(
                f"MySQL connection notice: Application is ready for MySQL 8.0 configuration. (Details: {e})"
            )

    return app


def _seed_initial_data(app):
    """Seed foundational roles, categories, safe demo accounts, demo cases, and system settings."""
    try:
        # 1. Seed Roles
        role_member = Role.query.filter_by(name="COMMITTEE_MEMBER").first()
        if not role_member:
            role_member = Role(
                name="COMMITTEE_MEMBER",
                description="Investigates assigned student grievances and posts official inquiries",
            )
            db.session.add(role_member)

        role_lead = Role.query.filter_by(name="COMMITTEE_LEAD").first()
        if not role_lead:
            role_lead = Role(
                name="COMMITTEE_LEAD",
                description="Oversees triage, case assignments, escalation management, and final findings",
            )
            db.session.add(role_lead)

        role_admin = Role.query.filter_by(name="SYSTEM_ADMIN").first()
        if not role_admin:
            role_admin = Role(
                name="SYSTEM_ADMIN",
                description="Configures grievance categories, manages staff roles, and monitors audit logs",
            )
            db.session.add(role_admin)

        db.session.commit()

        # 2. Seed Categories
        if ComplaintCategory.query.first() is None:
            categories = [
                ComplaintCategory(name="Harassment", description="Unwanted verbal, physical, or sexual conduct violating dignity.", sla_days=3),
                ComplaintCategory(name="Bullying", description="Persistent intimidation, humiliation, or psychological distress.", sla_days=5),
                ComplaintCategory(name="Corruption", description="Misuse of authority, bribery, financial fraud, or grade altering.", sla_days=5),
                ComplaintCategory(name="Discrimination", description="Unfavorable treatment based on race, gender, disability, or origin.", sla_days=5),
                ComplaintCategory(name="Unfair Treatment", description="Arbitrary grading, procedural bias, or handbook violations.", sla_days=7),
                ComplaintCategory(name="Academic Issue", description="Plagiarism disputes, exam misconduct, or advisor neglect.", sla_days=7),
                ComplaintCategory(name="Administrative Issue", description="Enrollment barriers, transcript delays, or fee disputes.", sla_days=10),
                ComplaintCategory(name="Other", description="Institutional grievances not captured in predefined categories.", sla_days=7),
            ]
            db.session.bulk_save_objects(categories)
            db.session.commit()

        # 3. Seed Approved Staff Accounts
        if User.query.first() is None:
            pw_hash = hash_password("password123")
            approved_staff = [
                User(
                    role_id=role_admin.id,
                    username="abdurrahman.khan",
                    email="abdurrehman200khan@gmail.com",
                    password_hash=pw_hash,
                    full_name="Abdur Rahman Khan",
                    department="Institutional Oversight IT",
                ),
                User(
                    role_id=role_lead.id,
                    username="eman.khan",
                    email="bf25pwcs1458@uetpeshawar.edu.pk",
                    password_hash=pw_hash,
                    full_name="Eman Khan",
                    department="Ethics & Compliance Office",
                ),
                User(
                    role_id=role_member.id,
                    username="misbah.ullah",
                    email="Its.misbah.kx@gmail.com",
                    password_hash=pw_hash,
                    full_name="Misbah Ullah",
                    department="Ethics Review Committee",
                ),
                User(
                    role_id=role_member.id,
                    username="salman.ahmad",
                    email="csworking1122@gmail.com",
                    password_hash=pw_hash,
                    full_name="Salman Ahmad",
                    department="Ethics Review Committee",
                ),
                User(
                    role_id=role_member.id,
                    username="maheen.ayaz",
                    email="kgraana@gmail.com",
                    password_hash=pw_hash,
                    full_name="Maheen Ayaz",
                    department="Ethics Review Committee",
                ),
                User(
                    role_id=role_member.id,
                    username="maryam.khan",
                    email="maryampervaiz559@gmail.com",
                    password_hash=pw_hash,
                    full_name="Maryam Khan",
                    department="Ethics Review Committee",
                ),
                User(
                    role_id=role_member.id,
                    username="urooj.khan",
                    email="uroojkhanum.safi@gmail.com",
                    password_hash=pw_hash,
                    full_name="Urooj Khan",
                    department="Ethics Review Committee",
                ),
            ]
            db.session.bulk_save_objects(approved_staff)
            db.session.commit()

        # 4. Seed Safe Demo Cases
        if Case.query.first() is None:
            academic_cat = ComplaintCategory.query.filter_by(name="Academic Issue").first()
            salt = app.config.get("TRACKING_CODE_SALT", "")
            raw_demo_code = "CB-9K2M-4F8X-7R3A"
            demo_hash = hash_tracking_code(raw_demo_code, salt=salt)

            demo_case = Case(
                tracking_hash=demo_hash,
                category_id=academic_cat.id if academic_cat else 1,
                priority=CasePriority.MEDIUM,
                status=CaseStatus.IN_REVIEW,
                subject="Retaliatory Grading Dispute in Chemistry Lab",
                narrative="Safe demonstration case: Disagreement over grading criteria following laboratory protocol revision. No personal identifiers persisted.",
                location="Science Complex Room 402",
                deadline_at=None,
            )
            db.session.add(demo_case)
            db.session.commit()

        # 5. Seed System Settings
        if SystemSetting.query.first() is None:
            settings = [
                SystemSetting(setting_key="institution_name", setting_value=app.config.get("INSTITUTION_NAME"), description="Display name of the reporting institution"),
                SystemSetting(setting_key="retention_policy_days", setting_value="365", description="Audit and record retention period in days"),
                SystemSetting(setting_key="sla_escalation_buffer_hours", setting_value="24", description="Buffer hours prior to deadline triggering escalation alert"),
                SystemSetting(setting_key="emergency_contact", setting_value=app.config.get("EMERGENCY_PHONE"), description="Immediate emergency telephone contact"),
            ]
            db.session.bulk_save_objects(settings)
            db.session.commit()

    except Exception as e:
        app.logger.warning(f"Seed initialization note: {e}")
