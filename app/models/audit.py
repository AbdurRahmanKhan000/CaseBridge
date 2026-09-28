"""CaseBridge Append-Only Audit Trail Entity."""

import datetime
from . import db


class CaseAuditLog(db.Model):
    __tablename__ = "case_audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("cases.id", ondelete="CASCADE"), nullable=True, index=True)
    case_ref = db.Column(db.String(32), nullable=True, index=True)
    action_type = db.Column(db.String(60), nullable=False)
    actor_role = db.Column(db.String(40), nullable=False)
    actor_name = db.Column(db.String(120), nullable=False)
    actor_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    case = db.relationship("Case", back_populates="audit_logs")
    actor = db.relationship("User")

    def __repr__(self) -> str:
        return f"<CaseAuditLog action='{self.action_type}' actor='{self.actor_name}' at='{self.created_at}'>"
