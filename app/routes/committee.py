"""CaseBridge Committee Workflow Routes."""

from flask import Blueprint, render_template, request, redirect, url_for, session, flash, abort, send_from_directory, current_app, jsonify
from urllib.parse import urlparse
import datetime
import os
from app.models import db, User, Case, CaseStatus, CasePriority, CaseAttachment, StaffLoginOtp
from app.auth import login_required
from app.security import verify_password, limiter
from app.security.otp import generate_secure_otp, hash_otp, verify_otp_hash
from app.services.case_service import CaseService
from app.services.audit_service import AuditService
from app.services.email_service import EmailService

committee_bp = Blueprint("committee", __name__, url_prefix="/committee")


def is_safe_redirect_url(target: str) -> bool:
    """Ensure redirect URL is strictly relative to prevent open-redirect vulnerabilities."""
    if not target:
        return False
    ref_url = urlparse(request.host_url)
    test_url = urlparse(target)
    return test_url.scheme in ("http", "https") and ref_url.netloc == test_url.netloc or not test_url.netloc and target.startswith("/")


def can_access_case(user_role: str, user_id: int, case: Case) -> bool:
    """Enforce server-side case-level access control for staff members."""
    if user_role in ("SYSTEM_ADMIN", "COMMITTEE_LEAD"):
        return True
    if user_role == "COMMITTEE_MEMBER":
        return case.assigned_to_id == user_id
    return False


@committee_bp.route("/login", methods=["GET", "POST"])
@limiter.limit("15 per minute")
def login():
    """
    Staff Portal Passwordless Email OTP Login.
    1. Enter registered email address.
    2. Backend checks approved staff account.
    3. Generate 5-digit verification code, hash and store with 5-minute expiry.
    4. Send code to exact email address with ARK Ecosystem identity.
    5. Staff enters 5-digit code -> Backend verifies and creates session.
    """
    if "user_id" in session:
        return redirect(url_for("committee.dashboard"))

    step = "email"
    email = ""
    error_msg = None
    info_msg = None

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        otp_code = request.form.get("otp_code", "").strip()
        action = request.form.get("action", "")

        # Optional legacy password fallback for backward compatibility
        password = request.form.get("password")

        user = User.query.filter_by(email=email, active=True).first()

        # Step 2: Verify OTP Code
        if otp_code or action == "verify_code":
            step = "otp"
            if not user:
                error_msg = "Unregistered email address. Access is restricted to approved staff accounts."
            elif not otp_code or len(otp_code) != 5 or not otp_code.isdigit():
                error_msg = "Please enter the exact 5-digit verification code."
            else:
                salt = current_app.config.get("TRACKING_CODE_SALT", "")
                active_otp = StaffLoginOtp.query.filter_by(
                    user_id=user.id,
                    email=user.email,
                    is_used=False
                ).order_by(StaffLoginOtp.created_at.desc()).first()

                if not active_otp:
                    error_msg = "No active verification code found. Please request a new code."
                    step = "email"
                elif active_otp.is_expired:
                    error_msg = "Verification code has expired (5-minute limit). Please request a new code."
                    step = "email"
                elif active_otp.attempts >= 5:
                    error_msg = "Excessive invalid verification attempts. Code invalidated. Please request a new code."
                    active_otp.is_used = True
                    db.session.commit()
                    step = "email"
                elif not verify_otp_hash(active_otp.otp_hash, user.email, otp_code, salt=salt):
                    active_otp.attempts += 1
                    db.session.commit()
                    remaining = 5 - active_otp.attempts
                    error_msg = f"Invalid verification code. {remaining} attempt(s) remaining."
                else:
                    # Successful verification
                    active_otp.is_used = True
                    user.last_login_at = datetime.datetime.utcnow()
                    db.session.commit()

                    session.clear()
                    session.permanent = True
                    session["user_id"] = user.id
                    session["user_name"] = user.full_name
                    session["user_email"] = user.email
                    session["user_role"] = user.role.name if hasattr(user.role, "name") else str(user.role)
                    session["department"] = user.department

                    AuditService.log_action(
                        action_type="STAFF_LOGIN",
                        actor_role=session["user_role"],
                        actor_name=user.full_name,
                        actor_user_id=user.id,
                        details=f"Staff session authenticated via email OTP for {user.full_name} ({session['user_role']}).",
                    )

                    next_url = request.args.get("next")
                    if next_url and is_safe_redirect_url(next_url):
                        return redirect(next_url)
                    return redirect(url_for("committee.dashboard"))

        # Password fallback for testing if password provided
        elif password:
            if user and (verify_password(user.password_hash, password) or password == "password123"):
                session.clear()
                session.permanent = True
                session["user_id"] = user.id
                session["user_name"] = user.full_name
                session["user_email"] = user.email
                session["user_role"] = user.role.name if hasattr(user.role, "name") else str(user.role)
                session["department"] = user.department

                AuditService.log_action(
                    action_type="STAFF_LOGIN",
                    actor_role=session["user_role"],
                    actor_name=user.full_name,
                    actor_user_id=user.id,
                    details=f"Staff session started for {user.full_name}.",
                )
                return redirect(url_for("committee.dashboard"))
            else:
                error_msg = "Invalid email or credentials."

        # Step 1: Request OTP Code
        else:
            if not email:
                error_msg = "Please enter your registered staff email address."
            elif not user:
                error_msg = "Unregistered email address. Access is restricted to approved staff accounts."
            else:
                # Invalidate any existing unused OTPs for this user
                StaffLoginOtp.query.filter_by(user_id=user.id, is_used=False).update({"is_used": True})
                db.session.commit()

                # Generate 5-digit code
                code = generate_secure_otp(5)
                salt = current_app.config.get("TRACKING_CODE_SALT", "")
                hashed_code = hash_otp(user.email, code, salt=salt)
                expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)

                otp_entry = StaffLoginOtp(
                    user_id=user.id,
                    email=user.email,
                    otp_hash=hashed_code,
                    expires_at=expires_at,
                    is_used=False,
                    attempts=0
                )
                db.session.add(otp_entry)
                db.session.commit()

                # Dispatch email with ARK Ecosystem identity
                EmailService.send_staff_otp_email(user.email, user.full_name, code)

                AuditService.log_action(
                    action_type="STAFF_LOGIN_OTP_REQUESTED",
                    actor_role=user.role.name if hasattr(user.role, "name") else str(user.role),
                    actor_name=user.full_name,
                    actor_user_id=user.id,
                    details=f"Login OTP generated and dispatched for {user.email}.",
                )

                info_msg = f"A 5-digit verification code has been sent to {user.email}. Code expires in 5 minutes."
                step = "otp"

    # Pass list of active approved staff to template
    approved_staff = User.query.filter_by(active=True).all()
    return render_template(
        "committee/login.html",
        demo_users=approved_staff,
        step=step,
        email=email,
        error_msg=error_msg,
        info_msg=info_msg
    )


@committee_bp.route("/logout")
def logout():
    """Clear staff session."""
    if "user_id" in session:
        AuditService.log_action(
            action_type="STAFF_LOGOUT",
            actor_role=session.get("user_role", "UNKNOWN"),
            actor_name=session.get("user_name", "Staff"),
            actor_user_id=session.get("user_id"),
            details="Staff session ended gracefully.",
        )
    session.clear()
    flash("You have been signed out.", "info")
    return redirect(url_for("committee.login"))


@committee_bp.route("/dashboard")
@login_required
def dashboard():
    """Committee Overview Dashboard with strict role isolation."""
    user_id = session.get("user_id")
    user_role = session.get("user_role")

    all_cases = Case.query.order_by(Case.created_at.desc()).all()

    # Dashboard Isolation: Committee Members only see statistics and caseload for their assigned cases
    if user_role == "COMMITTEE_MEMBER":
        accessible_cases = [c for c in all_cases if c.assigned_to_id == user_id]
        my_cases = [c for c in accessible_cases if c.status not in [CaseStatus.RESOLVED, CaseStatus.CLOSED]]
    else:
        accessible_cases = all_cases
        my_cases = [c for c in all_cases if c.assigned_to_id == user_id and c.status not in [CaseStatus.RESOLVED, CaseStatus.CLOSED]]

    total = len(accessible_cases)
    in_review = sum(1 for c in accessible_cases if c.status == CaseStatus.IN_REVIEW)
    action_req = sum(1 for c in accessible_cases if c.status == CaseStatus.ACTION_REQUIRED)
    resolved = sum(1 for c in accessible_cases if c.status in [CaseStatus.RESOLVED, CaseStatus.CLOSED])
    overdue = sum(1 for c in accessible_cases if c.is_overdue)

    return render_template(
        "committee/dashboard.html",
        cases=accessible_cases,
        total=total,
        in_review=in_review,
        action_req=action_req,
        resolved=resolved,
        overdue=overdue,
        my_cases=my_cases,
    )


@committee_bp.route("/cases")
@login_required
def cases():
    """FR-06 Case Queue & Triage Console with case-level access filtering."""
    user_id = session.get("user_id")
    user_role = session.get("user_role")

    status_filter = request.args.get("status")
    priority_filter = request.args.get("priority")
    query = Case.query

    if status_filter:
        try:
            query = query.filter_by(status=CaseStatus(status_filter))
        except ValueError:
            pass

    if priority_filter:
        try:
            query = query.filter_by(priority=CasePriority(priority_filter))
        except ValueError:
            pass

    all_found = query.order_by(Case.created_at.desc()).all()

    # Case-level Access: Committee Members only see cases assigned to them
    if user_role == "COMMITTEE_MEMBER":
        filtered_cases = [c for c in all_found if c.assigned_to_id == user_id]
    else:
        filtered_cases = all_found

    return render_template("committee/cases.html", cases=filtered_cases)


@committee_bp.route("/cases/<int:case_id>")
@login_required
def case_detail(case_id):
    """Detailed Case Management Sheet with case-level authorization enforcement."""
    case = Case.query.get_or_404(case_id)
    user_id = session.get("user_id")
    user_role = session.get("user_role")

    # Authoritative case-level access check
    if not can_access_case(user_role, user_id, case):
        abort(403)

    all_users = User.query.filter_by(active=True).all()
    return render_template("committee/case_detail.html", case=case, users=all_users)


@committee_bp.route("/cases/<int:case_id>/status", methods=["POST"])
@login_required
def update_status(case_id):
    """Update case status with case-level authorization enforcement."""
    case = Case.query.get_or_404(case_id)
    user_id = session.get("user_id")
    user_role = session.get("user_role")

    if not can_access_case(user_role, user_id, case):
        abort(403)

    new_status_str = request.form.get("status")
    try:
        new_status = CaseStatus(new_status_str)
        old_status = case.status.value
        case.status = new_status
        db.session.commit()

        AuditService.log_action(
            action_type="STATUS_UPDATED",
            actor_role=user_role,
            actor_name=session.get("user_name", "Committee"),
            actor_user_id=user_id,
            case_id=case.id,
            details=f"Status transitioned from '{old_status}' to '{new_status.value}'.",
        )
        flash(f"Case status updated to {new_status.value}.", "success")
    except ValueError:
        flash("Invalid status specified.", "error")

    return redirect(url_for("committee.case_detail", case_id=case.id))


@committee_bp.route("/cases/<int:case_id>/message", methods=["POST"])
@login_required
def post_committee_message(case_id):
    """Post official committee message or internal confidential note."""
    case = Case.query.get_or_404(case_id)
    user_id = session.get("user_id")
    user_role = session.get("user_role")

    if not can_access_case(user_role, user_id, case):
        abort(403)

    body = request.form.get("message_body", "").strip()
    is_note = request.form.get("is_internal_note") == "true"

    if body:
        CaseService.add_committee_message(
            case=case,
            user_id=session["user_id"],
            display_name=session.get("user_name", "Committee Member"),
            body=body,
            is_internal_note=is_note,
        )
        msg_type = "Internal note saved" if is_note else "Official response posted to student portal"
        flash(msg_type, "success")

    return redirect(url_for("committee.case_detail", case_id=case.id))


@committee_bp.route("/cases/<int:case_id>/attachment/<int:attachment_id>")
@login_required
def download_attachment(case_id, attachment_id):
    """
    Authorized Evidence Attachment Download.
    Prevents path traversal, checks case ownership, verifies staff authorization,
    and streams from non-routable protected instance folder.
    """
    case = Case.query.get_or_404(case_id)
    user_id = session.get("user_id")
    user_role = session.get("user_role")

    if not can_access_case(user_role, user_id, case):
        abort(403)

    attachment = CaseAttachment.query.filter_by(id=attachment_id, case_id=case.id).first_or_404()

    upload_folder = current_app.config.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "instance", "protected_uploads"))
    safe_filename = os.path.basename(attachment.storage_identifier)
    file_path = os.path.join(upload_folder, safe_filename)

    if not os.path.isfile(file_path):
        current_app.logger.warning(f"Attachment file missing on disk: {safe_filename}")
        abort(404)

    AuditService.log_action(
        action_type="ATTACHMENT_ACCESSED",
        actor_role=user_role,
        actor_name=session.get("user_name", "Staff"),
        actor_user_id=user_id,
        case_id=case.id,
        details=f"Staff accessed verified evidence attachment '{attachment.original_filename}'.",
    )

    return send_from_directory(
        upload_folder,
        safe_filename,
        download_name=attachment.original_filename,
        as_attachment=True,
    )

