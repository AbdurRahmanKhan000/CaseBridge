"""CaseBridge Committee & Administrator User Model."""

import datetime
from . import db


class User(db.Model):
    """
    Authorized Staff User entity.
    Strictly isolated from anonymous student complainants.
    Anonymous students NEVER have a user record or account.
    """
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False, index=True)
    username = db.Column(db.String(100), unique=True, nullable=False, index=True)
    email = db.Column(db.String(191), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(150), nullable=False)
    department = db.Column(db.String(150), default="Ethics & Compliance", nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    last_login_at = db.Column(db.DateTime, nullable=True)

    role_rel = db.relationship("Role", back_populates="users")
    assignments = db.relationship("CaseAssignment", foreign_keys="CaseAssignment.assigned_user_id", back_populates="assigned_user", lazy="dynamic")
    notifications = db.relationship("CaseNotification", back_populates="recipient", lazy="dynamic")

    def __init__(self, **kwargs):
        # Support passing username defaulted to email prefix if not supplied
        if "username" not in kwargs and "email" in kwargs:
            kwargs["username"] = kwargs["email"].split("@")[0]
        # Support passing role directly as Role object or enum
        if "role" in kwargs:
            role_val = kwargs.pop("role")
            if hasattr(role_val, "id") and role_val.id:
                kwargs["role_id"] = role_val.id
            elif hasattr(role_val, "value"):
                kwargs["_role_name_pending"] = role_val.value
            elif isinstance(role_val, str):
                kwargs["_role_name_pending"] = role_val
        super().__init__(**kwargs)

    @property
    def is_active(self) -> bool:
        """Alias for active status compatibility."""
        return self.active

    @is_active.setter
    def is_active(self, val: bool):
        self.active = val

    @property
    def role(self):
        """Returns the Role object."""
        return self.role_rel

    @role.setter
    def role(self, role_obj):
        self.role_rel = role_obj

    def __repr__(self) -> str:
        return f"<User id={self.id} username='{self.username}' email='{self.email}'>"
