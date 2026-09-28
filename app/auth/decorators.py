"""CaseBridge Session and Role-Based Access Control Decorators."""

from functools import wraps
from flask import session, redirect, url_for, flash, abort, request


def login_required(f):
    """Ensure user has an active authenticated staff session."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            flash("Please sign in with your institutional credentials to access this area.", "warning")
            return redirect(url_for("committee.login", next=request.path))
        return f(*args, **kwargs)
    return decorated_function


def role_required(*allowed_roles):
    """
    Ensure authenticated staff member possesses one of the allowed roles.
    Example: @role_required('COMMITTEE_LEAD', 'SYSTEM_ADMIN')
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if "user_id" not in session:
                return redirect(url_for("committee.login", next=request.path))
            user_role = session.get("user_role")
            if user_role not in allowed_roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def lead_required(f):
    """Ensure user is a Committee Lead or System Administrator."""
    return role_required("COMMITTEE_LEAD", "SYSTEM_ADMIN")(f)


def admin_required(f):
    """Ensure user is a System Administrator."""
    return role_required("SYSTEM_ADMIN")(f)

