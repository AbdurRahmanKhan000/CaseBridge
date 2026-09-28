"""CaseBridge Administrator Routes.

Implements system administration:
- User lifecycle management (creation, role modification, activation/deactivation)
- Grievance categories and institutional SLA configuration
- System-wide policy settings (retention period, emergency contact)
- Immutable technical audit journal review
"""

from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    session,
    flash,
    abort,
    current_app,
)
from app.auth import login_required, role_required, admin_required
from app.models import (
    db,
    User,
    Role,
    ComplaintCategory,
    Category,
    Case,
    CaseEvent,
    CaseAuditLog,
    SystemSetting,
)
from app.security import hash_password
from app.services.audit_service import AuditService

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.route("/dashboard")
@login_required
@admin_required
def dashboard():
    """System Administrator Console Overview."""
    users = User.query.order_by(User.created_at.desc()).all()
    roles = Role.query.all()
    categories = ComplaintCategory.query.order_by(ComplaintCategory.name.asc()).all()
    settings = SystemSetting.query.all()
    recent_audits = CaseAuditLog.query.order_by(CaseAuditLog.timestamp.desc()).limit(30).all()

    total_cases = Case.query.count()
    active_users = sum(1 for u in users if u.active)

    return render_template(
        "admin/dashboard.html",
        users=users,
        roles=roles,
        categories=categories,
        settings=settings,
        recent_audits=recent_audits,
        total_cases=total_cases,
        active_users=active_users,
    )


@admin_bp.route("/users/create", methods=["POST"])
@login_required
@admin_required
def create_user():
    """Create a new authorized committee officer or administrator."""
    full_name = request.form.get("full_name", "").strip()
    email = request.form.get("email", "").strip().lower()
    department = request.form.get("department", "Ethics & Compliance").strip()
    role_id = request.form.get("role_id")
    temp_password = request.form.get("password", "").strip()

    if not full_name or not email or not role_id or not temp_password:
        flash("All fields are required to create a staff account.", "error")
        return redirect(url_for("admin.dashboard"))

    if User.query.filter_by(email=email).first():
        flash("A user account with this institutional email already exists.", "error")
        return redirect(url_for("admin.dashboard"))

    username = email.split("@")[0]
    base_username = username
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{base_username}{counter}"
        counter += 1

    pw_hash = hash_password(temp_password)
    user = User(
        username=username,
        email=email,
        password_hash=pw_hash,
        full_name=full_name,
        department=department,
        role_id=int(role_id),
        active=True,
    )
    db.session.add(user)
    db.session.commit()

    AuditService.log_action(
        action_type="USER_CREATED",
        actor_role="SYSTEM_ADMIN",
        actor_name=session.get("user_name", "Administrator"),
        actor_user_id=session.get("user_id"),
        details=f"Created staff account {full_name} ({email}) with role_id {role_id}.",
    )
    flash(f"Staff account for {full_name} created successfully.", "success")
    return redirect(url_for("admin.dashboard"))


@admin_bp.route("/users/<int:user_id>/toggle-status", methods=["POST"])
@login_required
@admin_required
def toggle_user_status(user_id):
    """Toggle staff account between Active and Inactive."""
    user = User.query.get_or_404(user_id)
    current_uid = session.get("user_id")

    if user.id == current_uid:
        flash("Security rule: You cannot deactivate your own administrative account.", "error")
        return redirect(url_for("admin.dashboard"))

    user.active = not user.active
    db.session.commit()

    status_str = "activated" if user.active else "deactivated"
    AuditService.log_action(
        action_type="USER_STATUS_CHANGED",
        actor_role="SYSTEM_ADMIN",
        actor_name=session.get("user_name", "Administrator"),
        actor_user_id=session.get("user_id"),
        details=f"Account for {user.full_name} was {status_str}.",
    )
    flash(f"Account for {user.full_name} was {status_str}.", "success")
    return redirect(url_for("admin.dashboard"))


@admin_bp.route("/users/<int:user_id>/role", methods=["POST"])
@login_required
@admin_required
def change_user_role(user_id):
    """Change the authorization role of a staff user."""
    user = User.query.get_or_404(user_id)
    new_role_id = request.form.get("role_id")
    current_uid = session.get("user_id")

    if not new_role_id:
        flash("Invalid role specified.", "error")
        return redirect(url_for("admin.dashboard"))

    role = Role.query.get(int(new_role_id))
    if not role:
        flash("Selected role does not exist.", "error")
        return redirect(url_for("admin.dashboard"))

    if user.id == current_uid and role.name != "SYSTEM_ADMIN":
        flash("Security rule: You cannot demote yourself from the Administrator role.", "error")
        return redirect(url_for("admin.dashboard"))

    old_role_name = user.role.value if hasattr(user.role, "value") else user.role.name
    user.role_id = role.id
    db.session.commit()

    AuditService.log_action(
        action_type="USER_ROLE_CHANGED",
        actor_role="SYSTEM_ADMIN",
        actor_name=session.get("user_name", "Administrator"),
        actor_user_id=session.get("user_id"),
        details=f"Role for {user.full_name} changed from '{old_role_name}' to '{role.name}'.",
    )
    flash(f"Role for {user.full_name} updated to {role.name}.", "success")
    return redirect(url_for("admin.dashboard"))


@admin_bp.route("/categories/create", methods=["POST"])
@login_required
@admin_required
def create_category():
    """Create a new institutional complaint category."""
    name = request.form.get("name", "").strip()
    description = request.form.get("description", "").strip()
    sla_days = request.form.get("sla_days", "7")

    if not name or not description:
        flash("Category name and description are required.", "error")
        return redirect(url_for("admin.dashboard"))

    if ComplaintCategory.query.filter_by(name=name).first():
        flash("A category with this name already exists.", "error")
        return redirect(url_for("admin.dashboard"))

    try:
        sla_val = int(sla_days)
        if sla_val < 1 or sla_val > 90:
            sla_val = 7
    except ValueError:
        sla_val = 7

    cat = ComplaintCategory(name=name, description=description, sla_days=sla_val, active=True)
    db.session.add(cat)
    db.session.commit()

    AuditService.log_action(
        action_type="CATEGORY_CREATED",
        actor_role="SYSTEM_ADMIN",
        actor_name=session.get("user_name", "Administrator"),
        actor_user_id=session.get("user_id"),
        details=f"Created category '{name}' with {sla_val}-day resolution SLA.",
    )
    flash(f"Category '{name}' created successfully.", "success")
    return redirect(url_for("admin.dashboard"))


@admin_bp.route("/categories/<int:cat_id>/toggle", methods=["POST"])
@login_required
@admin_required
def toggle_category(cat_id):
    """Enable or disable an institutional complaint category."""
    cat = ComplaintCategory.query.get_or_404(cat_id)
    cat.active = not cat.active
    db.session.commit()

    state = "enabled" if cat.active else "disabled"
    AuditService.log_action(
        action_type="CATEGORY_STATUS_CHANGED",
        actor_role="SYSTEM_ADMIN",
        actor_name=session.get("user_name", "Administrator"),
        actor_user_id=session.get("user_id"),
        details=f"Category '{cat.name}' was {state}.",
    )
    flash(f"Category '{cat.name}' has been {state}.", "success")
    return redirect(url_for("admin.dashboard"))


@admin_bp.route("/categories/<int:cat_id>/update-sla", methods=["POST"])
@login_required
@admin_required
def update_category_sla(cat_id):
    """Update resolution SLA days for a category."""
    cat = ComplaintCategory.query.get_or_404(cat_id)
    new_sla = request.form.get("sla_days")
    try:
        val = int(new_sla)
        if val >= 1 and val <= 90:
            old_sla = cat.sla_days
            cat.sla_days = val
            db.session.commit()

            AuditService.log_action(
                action_type="CATEGORY_SLA_UPDATED",
                actor_role="SYSTEM_ADMIN",
                actor_name=session.get("user_name", "Administrator"),
                actor_user_id=session.get("user_id"),
                details=f"Category '{cat.name}' SLA changed from {old_sla}d to {val}d.",
            )
            flash(f"SLA for '{cat.name}' updated to {val} days.", "success")
        else:
            flash("SLA days must be between 1 and 90.", "error")
    except ValueError:
        flash("Invalid SLA days value.", "error")

    return redirect(url_for("admin.dashboard"))


@admin_bp.route("/settings/update", methods=["POST"])
@login_required
@admin_required
def update_settings():
    """Update institutional parameters (retention period, SLA buffer, emergency contact)."""
    for key, val in request.form.items():
        if key.startswith("setting_"):
            setting_key = key[len("setting_"):]
            setting_obj = SystemSetting.query.filter_by(setting_key=setting_key).first()
            if setting_obj:
                setting_obj.setting_value = val.strip()

    db.session.commit()
    AuditService.log_action(
        action_type="SETTINGS_UPDATED",
        actor_role="SYSTEM_ADMIN",
        actor_name=session.get("user_name", "Administrator"),
        actor_user_id=session.get("user_id"),
        details="Institutional system parameters updated.",
    )
    flash("System settings saved successfully.", "success")
    return redirect(url_for("admin.dashboard"))


@admin_bp.route("/audits")
@login_required
@admin_required
def audits():
    """Full searchable and filterable Technical Audit Journal."""
    action_filter = request.args.get("action", "").strip()
    query = CaseAuditLog.query

    if action_filter:
        query = query.filter(CaseAuditLog.event_type == action_filter)

    logs = query.order_by(CaseAuditLog.timestamp.desc()).limit(100).all()
    all_actions = [r[0] for r in db.session.query(CaseAuditLog.event_type).distinct().all()]

    return render_template(
        "admin/audits.html",
        logs=logs,
        all_actions=all_actions,
        current_action=action_filter,
    )
