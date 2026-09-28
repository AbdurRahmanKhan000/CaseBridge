"""CaseBridge System Settings Model."""

import datetime
from . import db


class SystemSetting(db.Model):
    """
    Key-value institutional configuration (retention policy, SLA defaults, emergency desk).
    """
    __tablename__ = "system_settings"

    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False, index=True)
    setting_value = db.Column(db.Text, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<SystemSetting key='{self.setting_key}'>"
