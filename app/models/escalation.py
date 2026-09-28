"""CaseBridge Escalation Entity."""

import datetime
import enum
from . import db


class EscalationStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class CaseEscalation(db.Model):
    """
    Formal escalation tracking when SLAs are breached or high-urgency triggers occur.
    """
    __tablename__ = "escalations"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_reason = db.Column(db.String(255), nullable=False)
    deadline = db.Column(db.DateTime, nullable=False, index=True)
    escalation_target = db.Column(db.String(150), nullable=False)
    status = db.Column(db.Enum(EscalationStatus), default=EscalationStatus.ACTIVE, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)
    resolved_at = db.Column(db.DateTime, nullable=True)

    case = db.relationship("Case", back_populates="escalations")

    def __repr__(self) -> str:
        return f"<CaseEscalation id={self.id} case_id={self.case_id} status='{self.status.value}'>"
