"""CaseBridge Audit Logging Service."""

from typing import Optional
from app.models import db, CaseAuditLog


class AuditService:
    """Service to record immutable, tamper-evident audit records."""

    @staticmethod
    def log_action(
        action_type: str,
        actor_role: str,
        actor_name: str,
        details: str,
        case_id: Optional[int] = None,
        case_ref: Optional[str] = None,
        actor_user_id: Optional[int] = None,
    ) -> CaseAuditLog:
        """Create and commit an audit log entry."""
        entry = CaseAuditLog(
            action_type=action_type,
            actor_role=actor_role,
            actor_name=actor_name,
            details=details,
            case_id=case_id,
            case_ref=case_ref,
            actor_user_id=actor_user_id,
        )
        db.session.add(entry)
        db.session.commit()
        return entry
