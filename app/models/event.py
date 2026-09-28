"""CaseBridge Case Events & Audit Trail Entity."""

import datetime
from . import db


class CaseEvent(db.Model):
    """
    Immutable case event and audit record.
    Captures status transitions, priority changes, assignments, and escalations.
    STRICT PRIVACY RULE: Never put sensitive complaint text into audit records.
    """
    __tablename__ = "case_events"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = db.Column(db.String(64), nullable=False, index=True)
    actor = db.Column(db.String(150), nullable=False)
    actor_role = db.Column(db.String(64), nullable=False)
    actor_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    # Safe metadata/details only — never sensitive whistleblower narrative
    details = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    case = db.relationship("Case", back_populates="events")
    actor_user = db.relationship("User", foreign_keys=[actor_user_id])

    def __init__(self, **kwargs):
        if "action_type" in kwargs and "event_type" not in kwargs:
            kwargs["event_type"] = kwargs.pop("action_type")
        if "actor_name" in kwargs and "actor" not in kwargs:
            kwargs["actor"] = kwargs.pop("actor_name")
        if "created_at" in kwargs and "timestamp" not in kwargs:
            kwargs["timestamp"] = kwargs.pop("created_at")
        super().__init__(**kwargs)

    # Backward-compatible properties
    @property
    def action_type(self) -> str:
        return self.event_type

    @property
    def actor_name(self) -> str:
        return self.actor

    @property
    def created_at(self) -> datetime.datetime:
        return self.timestamp

    def __repr__(self) -> str:
        return f"<CaseEvent id={self.id} case_id={self.case_id} type='{self.event_type}'>"


# Backward-compatible alias
CaseAuditLog = CaseEvent
