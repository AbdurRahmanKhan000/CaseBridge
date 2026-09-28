"""CaseBridge Public Facing Routes.

Handles all public student journeys:
- Landing page with immediate purpose & actions
- About / ARK Ecosystem information
- How the process works
- Anonymous case submission with optional permitted attachments
- Case tracking with milestone timeline & two-way dialogue
- Privacy boundary policies
- Cryptographic security & trust breakdown
- Frequently Asked Questions
"""

import datetime
from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    current_app,
)
from app.models import Category, ComplaintCategory, CasePriority
from app.security import limiter
from app.services.case_service import CaseService

public_bp = Blueprint("public", __name__)


@public_bp.route("/")
def index():
    """Public Landing Page.
    
    Explains immediately:
    - What CaseBridge is
    - Who it is for
    - What the user can do
    Primary actions: [Submit a Case], [Track a Case].
    """
    categories = ComplaintCategory.query.filter_by(active=True).all()
    if not categories:
        # Fallback in development before database seeding
        categories = [
            ComplaintCategory(id=1, name="Harassment", description="Unwanted verbal, physical, or sexual conduct violating dignity.", sla_days=3),
            ComplaintCategory(id=2, name="Bullying", description="Persistent intimidation, humiliation, or psychological distress.", sla_days=5),
            ComplaintCategory(id=3, name="Corruption", description="Misuse of authority, bribery, financial fraud, or grade altering.", sla_days=5),
            ComplaintCategory(id=4, name="Discrimination", description="Unfavorable treatment based on race, gender, disability, or origin.", sla_days=5),
            ComplaintCategory(id=5, name="Unfair Treatment", description="Arbitrary grading, procedural bias, or handbook violations.", sla_days=7),
            ComplaintCategory(id=6, name="Academic Issue", description="Plagiarism disputes, exam misconduct, or advisor neglect.", sla_days=7),
            ComplaintCategory(id=7, name="Administrative Issue", description="Enrollment barriers, transcript delays, or fee disputes.", sla_days=10),
            ComplaintCategory(id=8, name="Other", description="Institutional grievances not captured in predefined categories.", sla_days=7),
        ]
    return render_template("public/index.html", categories=categories)


@public_bp.route("/about")
def about():
    """About & ARK Ecosystem Governance Page."""
    return render_template("public/about.html")


@public_bp.route("/how-it-works")
def how_it_works():
    """How CaseBridge Works - Process & Resolution Deadlines."""
    return render_template("public/how_it_works.html")


@public_bp.route("/privacy")
def privacy():
    """Privacy Boundary & Zero-Knowledge Identity Disclosure."""
    return render_template("public/privacy.html")


@public_bp.route("/security")
def security():
    """Security Architecture & Cryptographic Trust."""
    return render_template("public/security.html")


@public_bp.route("/faq")
def faq():
    """Frequently Asked Questions."""
    return render_template("public/faq.html")


@public_bp.route("/submit", methods=["GET", "POST"])
@limiter.limit("10 per hour")
def submit():
    """
    Anonymous Complaint Submission Form.
    Processes user narrative, category selection, assessed urgency, and optional
    evidence attachment without storing name, student ID, personal email, or client IP address.
    """
    categories = ComplaintCategory.query.filter_by(active=True).all()
    if not categories:
        categories = [
            ComplaintCategory(id=1, name="Harassment", description="Unwanted verbal, physical, or sexual conduct violating dignity.", sla_days=3),
            ComplaintCategory(id=2, name="Bullying", description="Persistent intimidation, humiliation, or psychological distress.", sla_days=5),
            ComplaintCategory(id=3, name="Corruption", description="Misuse of authority, bribery, financial fraud, or grade altering.", sla_days=5),
            ComplaintCategory(id=4, name="Discrimination", description="Unfavorable treatment based on race, gender, disability, or origin.", sla_days=5),
            ComplaintCategory(id=5, name="Unfair Treatment", description="Arbitrary grading, procedural bias, or handbook violations.", sla_days=7),
            ComplaintCategory(id=6, name="Academic Issue", description="Plagiarism disputes, exam misconduct, or advisor neglect.", sla_days=7),
            ComplaintCategory(id=7, name="Administrative Issue", description="Enrollment barriers, transcript delays, or fee disputes.", sla_days=10),
            ComplaintCategory(id=8, name="Other", description="Institutional grievances not captured in predefined categories.", sla_days=7),
        ]

    if request.method == "POST":
        category_id = request.form.get("category_id")
        priority_val = request.form.get("priority", "Medium")
        subject = request.form.get("subject", "").strip()
        narrative = request.form.get("narrative", "").strip()
        location = request.form.get("location", "").strip()
        incident_date_str = request.form.get("incident_date", "").strip()
        consent = request.form.get("consent_ack")

        # Form Validation
        if not subject:
            flash("Please provide a concise subject or incident title.", "error")
            return render_template("public/submit.html", categories=categories)

        if len(narrative) < 30:
            flash("Please provide at least 30 characters in the incident description to enable investigation.", "error")
            return render_template("public/submit.html", categories=categories)

        if not consent:
            flash("Please confirm the anonymous submission acknowledgment.", "error")
            return render_template("public/submit.html", categories=categories)

        incident_date = None
        if incident_date_str:
            try:
                incident_date = datetime.datetime.strptime(incident_date_str, "%Y-%m-%d").date()
            except ValueError:
                incident_date = None

        try:
            new_case, raw_code = CaseService.create_anonymous_case(
                category_id=int(category_id) if category_id else 1,
                priority_val=priority_val,
                subject=subject,
                narrative=narrative,
                location=location or None,
                incident_date=incident_date,
            )
        except Exception as e:
            current_app.logger.error(f"Error persisting case: {e}")
            flash("A temporary system issue prevented case creation. Please try again.", "error")
            return render_template("public/submit.html", categories=categories)

        # Handle optional permitted evidence attachment
        if "attachment" in request.files:
            file_storage = request.files["attachment"]
            if file_storage and file_storage.filename:
                attachment = CaseService.attach_file(new_case, file_storage, uploaded_by_context="STUDENT")
                if not attachment:
                    flash(
                        "Your case was submitted, but the optional file was not accepted. Allowed formats: PDF, PNG, JPG, JPEG, TXT, DOCX (Max 5MB).",
                        "warning",
                    )

        return render_template(
            "public/submit_success.html",
            raw_tracking_code=raw_code,
            case=new_case,
        )

    return render_template("public/submit.html", categories=categories)


@public_bp.route("/track", methods=["GET", "POST"])
@limiter.limit("20 per minute")
def track():
    """
    Case Tracking Portal.
    Rate-limited lookup by raw code hash to view timeline and two-way dialogue.
    Prevents enumeration by giving safe non-revealing feedback.
    """
    code = request.args.get("code", "").strip().upper()
    case = None
    not_found = False
    invalid_format = False

    if request.method == "POST":
        code = request.form.get("tracking_code", "").strip().upper()
        if not code:
            flash("Please enter your 16-character tracking code.", "error")
            return render_template("public/track.html", tracking_code="", case=None, not_found=False)
        return redirect(url_for("public.track", code=code))

    if code:
        # Validate format roughly (e.g. CB-XXXX-XXXX-XXXX)
        import re
        if not re.match(r"^CB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$", code):
            invalid_format = True
        else:
            try:
                case = CaseService.find_by_tracking_code(code)
                if not case:
                    not_found = True
            except Exception as e:
                current_app.logger.error(f"Tracking lookup error: {e}")
                not_found = True

    return render_template(
        "public/track.html",
        tracking_code=code,
        case=case,
        not_found=not_found,
        invalid_format=invalid_format,
    )


@public_bp.route("/track/<tracking_code>/message", methods=["POST"])
@limiter.limit("15 per hour")
def post_student_message(tracking_code):
    """Post anonymous follow-up message to committee."""
    clean_code = tracking_code.strip().upper()
    case = CaseService.find_by_tracking_code(clean_code)
    if not case:
        flash("Invalid or expired tracking session.", "error")
        return redirect(url_for("public.track"))

    body = request.form.get("message_body", "").strip()
    if not body:
        flash("Message body cannot be empty.", "error")
        return redirect(url_for("public.track", code=clean_code))

    try:
        CaseService.add_student_message(case, body)
        flash("Your message was securely delivered to the review committee.", "success")
    except Exception as e:
        current_app.logger.error(f"Failed to post student message: {e}")
        flash("Could not deliver message due to a temporary error. Please try again.", "error")

    return redirect(url_for("public.track", code=clean_code))


@public_bp.route("/track/<tracking_code>/attachment/<int:attachment_id>")
@limiter.limit("30 per hour")
def download_student_attachment(tracking_code, attachment_id):
    """
    Authorized Student Attachment Download.
    Requires proof of ownership via valid tracking code.
    Prevents path traversal, directory browsing, and unauthorized file access.
    """
    import os
    from flask import send_from_directory, abort
    from app.models import CaseAttachment

    clean_code = tracking_code.strip().upper()
    case = CaseService.find_by_tracking_code(clean_code)
    if not case:
        abort(404)

    attachment = CaseAttachment.query.filter_by(id=attachment_id, case_id=case.id).first_or_404()

    upload_folder = current_app.config.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "instance", "protected_uploads"))
    safe_filename = os.path.basename(attachment.storage_identifier)
    file_path = os.path.join(upload_folder, safe_filename)

    if not os.path.isfile(file_path):
        current_app.logger.warning(f"Student attachment missing on disk: {safe_filename}")
        abort(404)

    return send_from_directory(
        upload_folder,
        safe_filename,
        download_name=attachment.original_filename,
        as_attachment=True,
    )
