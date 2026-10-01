"""CaseBridge SQLAlchemy Models Package."""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()

from .role import Role
from .user import User
from .category import ComplaintCategory, Category
from .case import Case, CasePriority, CaseStatus
from .assignment import CaseAssignment
from .message import CaseMessage, SenderContext, SenderType
from .event import CaseEvent, CaseAuditLog
from .attachment import CaseAttachment
from .escalation import CaseEscalation, EscalationStatus
from .notification import CaseNotification
from .system_setting import SystemSetting
from .login_otp import StaffLoginOtp

__all__ = [
    "db",
    "migrate",
    "Role",
    "User",
    "ComplaintCategory",
    "Category",
    "Case",
    "CasePriority",
    "CaseStatus",
    "CaseAssignment",
    "CaseMessage",
    "SenderContext",
    "SenderType",
    "CaseEvent",
    "CaseAuditLog",
    "CaseAttachment",
    "CaseEscalation",
    "EscalationStatus",
    "CaseNotification",
    "SystemSetting",
    "StaffLoginOtp",
]
