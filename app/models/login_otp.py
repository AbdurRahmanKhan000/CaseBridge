"""CaseBridge Staff Login OTP Model."""

import datetime
from . import db


class StaffLoginOtp(db.Model):
    """
    Temporary, high-entropy 5-digit verification codes for staff portal passwordless login.
    Codes are stored as salted SHA-256 hashes, expire in 5 minutes, and are single-use.
    """
    __tablename__ = "staff_login_otps"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    email = db.Column(db.String(191), nullable=False, index=True)
    otp_hash = db.Column(db.String(64), nullable=False)
    attempts = db.Column(db.Integer, default=0, nullable=False)
    is_used = db.Column(db.Boolean, default=False, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = db.relationship("User", foreign_keys=[user_id])

    __table_args__ = (
        db.Index("ix_staff_otp_lookup", "email", "is_used", "expires_at"),
    )

    @property
    def is_expired(self) -> bool:
        return datetime.datetime.utcnow() > self.expires_at

    def __repr__(self) -> str:
        return f"<StaffLoginOtp id={self.id} user_id={self.user_id} used={self.is_used}>"
