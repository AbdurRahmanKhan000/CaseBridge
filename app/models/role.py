"""CaseBridge Staff Role Model."""

import datetime
from . import db


class Role(db.Model):
    """Staff Role entity for Role-Based Access Control (RBAC)."""
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

    users = db.relationship("User", back_populates="role_rel", lazy="dynamic")

    @property
    def value(self) -> str:
        """Compatibility property for string representation of role name."""
        return self.name

    def __repr__(self) -> str:
        return f"<Role id={self.id} name='{self.name}'>"
