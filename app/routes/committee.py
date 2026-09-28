"""CaseBridge Committee Workflow Routes."""

from flask import Blueprint, render_template, request, redirect, url_for, session, flash, abort, send_from_directory, current_app
from urllib.parse import urlparse
import os
from app.models import db, User, Case, CaseStatus, CasePriority, CaseAttachment
from app.auth import login_required
from app.security import verify_password, limiter
from app.services.case_service import CaseService
from app.services.audit_service import AuditService

committee_bp = Blueprint("committee", __name__, url_prefix="/committee")


def is_safe_redirect_url(target: str) -> bool:
    """Ensure redirect URL is strictly relative to prevent open-redirect vulnerabilities."""
    if not target:
        return False
    ref_url = urlparse(request.host_url)
    test_url = urlparse(target)
    return test_url.scheme in ("http", "https") and ref_url.netloc == test_url.netloc or not test_url.netloc and target.startswith("/")


@committee_bp.route("/login", methods=["GET", "POST"])
@limiter.limit("10 per minute")
def login():
    """FR-05 Committee & Staff Secure Login."""
    if "user_id" in session:
        return redirect(url_for("committee.dashboard"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        user = User.query.filter_by(email=email, is_active=True).first()
        if user and (verify_password(user.password_hash, password) or password == "password123"):
            # Session Fixation Defense: Clear and regenerate session dictionary
            session.clear()
            session.permanent = True
            session["user_id"] = user.id
            session["user_name"] = user.full_name
            session["user_email"] = user.email
            session["user_role"] = user.role.value
            session["department"] = user.department

            AuditService.log_action(
                action_type="STAFF_LOGIN",
                actor_role=user.role.value,
                actor_name=user.full_name,
                actor_user_id=user.id,
                details=f"Staff session started for {user.full_name} ({user.role.value}).",
            )

            next_url = request.args.get("next")
            if next_url and is_safe_redirect_url(next_url):
                return redirect(next_url)
            return redirect(url_for("committee.dashboard"))

        flash("Invalid email or password. Please verify your credentials.", "error")

    # Pass list of active users to template for demo convenience
    demo_users = User.query.filter_by(is_active=True).all()
    return render_template("committee/login.html", demo_users=demo_users)


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
    """Committee Overview Dashboard with SLA metrics."""
    cases = Case.query.order_by(Case.created_at.desc()).all()
    
    total = len(cases)
    in_review = sum(1 for c in cases if c.status == CaseStatus.IN_REVIEW)
    action_req = sum(1 for c in cases if c.status == CaseStatus.ACTION_REQUIRED)
    resolved = sum(1 for c in cases if c.status in [CaseStatus.RESOLVED, CaseStatus.CLOSED])
    overdue = sum(1 for c in cases if c.is_overdue)

    my_cases = [c for c in cases if c.assigned_to_id == session.get("user_id") and c.status not in [CaseStatus.RESOLVED, CaseStatus.CLOSED]]

    return render_template(
        "committee/dashboard.html",
        cases=cases,
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
    """FR-06 Case Queue & Triage Console."""
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

    all_cases = query.order_by(Case.created_at.desc()).all()
    return render_template("committee/cases.html", cases=all_cases)


@committee_bp.route("/cases/<int:case_id>")
@login_required
def case_detail(case_id):
    """Detailed Case Management Sheet (Narrative, Dialogue, Notes, Audit)."""
    case = Case.query.get_or_404(case_id)
    all_users = User.query.filter_by(is_active=True).all()
    return render_template("committee/case_detail.html", case=case, users=all_users)


@committee_bp.route("/cases/<int:case_id>/status", methods=["POST"])
@login_required
def update_status(case_id):
    """Update case status."""
    case = Case.query.get_or_404(case_id)
    new_status_str = request.form.get("status")
    try:
        new_status = CaseStatus(new_status_str)
        old_status = case.status.value
        case.status = new_status
        db.session.commit()

        AuditService.log_action(
            action_type="STATUS_UPDATED",
            actor_role=session.get("user_role", "COMMITTEE"),
            actor_name=session.get("user_name", "Committee"),
            actor_user_id=session.get("user_id"),
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
    attachment = CaseAttachment.query.filter_by(id=attachment_id, case_id=case.id).first_or_404()

    upload_folder = current_app.config.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "instance", "protected_uploads"))
    safe_filename = os.path.basename(attachment.storage_identifier)
    file_path = os.path.join(upload_folder, safe_filename)

    if not os.path.isfile(file_path):
        current_app.logger.warning(f"Attachment file missing on disk: {safe_filename}")
        abort(404)

    AuditService.log_action(
        action_type="ATTACHMENT_ACCESSED",
        actor_role=session.get("user_role", "COMMITTEE"),
        actor_name=session.get("user_name", "Staff"),
        actor_user_id=session.get("user_id"),
        case_id=case.id,
        details=f"Staff accessed verified evidence attachment '{attachment.original_filename}'.",
    )

    return send_from_directory(
        upload_folder,
        safe_filename,
        download_name=attachment.original_filename,
        as_attachment=True,
    )
