"""CaseBridge Internal Staff Notification Model."""

import datetime
from . import db


class CaseNotification(db.Model):
    """
    In-app notification for committee officers (case assignment, new anonymous message, SLA breach).
    Avoids external third-party email/SMS dependencies for initial MVP privacy.
    """
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("cases.id", ondelete="SET NULL"), nullable=True, index=True)
    recipient_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

    case = db.relationship("Case", back_populates="notifications")
    recipient = db.relationship("User", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<CaseNotification id={self.id} recipient_id={self.recipient_user_id} title='{self.title}'>"
