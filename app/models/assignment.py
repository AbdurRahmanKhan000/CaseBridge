"""CaseBridge Case Assignment Model."""

import datetime
from . import db


class CaseAssignment(db.Model):
    """
    Case assignment history record.
    Tracks delegation of cases to specific committee investigators or teams.
    """
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    assigned_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    unassigned_at = db.Column(db.DateTime, nullable=True)
    notes = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    case = db.relationship("Case", back_populates="assignments")
    assigned_user = db.relationship("User", foreign_keys=[assigned_user_id], back_populates="assignments")
    assigned_by = db.relationship("User", foreign_keys=[assigned_by_id])

    def __repr__(self) -> str:
        return f"<CaseAssignment id={self.id} case_id={self.case_id} user_id={self.assigned_user_id} active={self.is_active}>"
