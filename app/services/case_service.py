"""CaseBridge Case Business Logic Service."""

import datetime
from typing import Optional, Tuple, List
from flask import current_app
from app.models import (
    db,
    Case,
    Category,
    CaseMessage,
    CaseAttachment,
    CaseAssignment,
    CaseEscalation,
    EscalationStatus,
    User,
    CasePriority,
    CaseStatus,
    SenderType,
)
from app.security import generate_tracking_code, hash_tracking_code
from app.services.audit_service import AuditService


class CaseService:
    """Core Case Management Service enforcing zero-identity and tracking code security."""

    @staticmethod
    def create_anonymous_case(
        category_id: int,
        priority_val: str,
        subject: str,
        narrative: str,
        location: Optional[str] = None,
        incident_date: Optional[datetime.date] = None,
    ) -> Tuple[Case, str]:
        """
        Creates an anonymous case complaint.
        Returns:
            Tuple of (committed Case record, raw_tracking_code)
        Note:
            raw_tracking_code is returned ONLY once so it can be presented to the student.
            The database stores exclusively the SHA-256 peppered hash.
        """
        category = Category.query.get(category_id)
        if not category:
            category = Category.query.first()

        priority = CasePriority(priority_val)
        raw_code = generate_tracking_code()
        salt = current_app.config.get("TRACKING_CODE_SALT", "")
        code_hash = hash_tracking_code(raw_code, salt=salt)

        # Calculate deadline based on priority and category SLA
        now = datetime.datetime.utcnow()
        if priority == CasePriority.CRITICAL:
            days = 1
        elif priority == CasePriority.HIGH:
            days = 3
        elif priority == CasePriority.LOW:
            days = max(14, category.sla_days if category else 14)
        else:
            days = category.sla_days if category else 7

        deadline_at = now + datetime.timedelta(days=days)

        new_case = Case(
            tracking_hash=code_hash,
            category_id=category.id,
            priority=priority,
            status=CaseStatus.RECEIVED,
            subject=subject.strip(),
            narrative=narrative.strip(),
            location=location.strip() if location else None,
            incident_date=incident_date,
            deadline_at=deadline_at,
        )

        db.session.add(new_case)
        db.session.commit()

        # Record tamper-evident audit entry
        AuditService.log_action(
            action_type="CASE_SUBMITTED",
            actor_role="ANONYMOUS_STUDENT",
            actor_name="Anonymous Submitter",
            details=f"Anonymous complaint registered under '{category.name}' with priority '{priority.value}'. Zero direct student identifiers stored.",
            case_id=new_case.id,
            case_ref=raw_code,
        )

        return new_case, raw_code

    @staticmethod
    def find_by_tracking_code(raw_code: str) -> Optional[Case]:
        """Lookup case using raw tracking code converted to hashed representation."""
        salt = current_app.config.get("TRACKING_CODE_SALT", "")
        code_hash = hash_tracking_code(raw_code, salt=salt)
        return Case.query.filter_by(tracking_hash=code_hash).first()

    @staticmethod
    def add_student_message(case: Case, body: str) -> CaseMessage:
        """Add an anonymous follow-up message from student."""
        msg = CaseMessage(
            case_id=case.id,
            sender_type=SenderType.STUDENT,
            sender_display_name="Anonymous Student",
            message_body=body.strip(),
            is_internal_note=False,
        )
        db.session.add(msg)
        case.updated_at = datetime.datetime.utcnow()
        db.session.commit()

        AuditService.log_action(
            action_type="STUDENT_MESSAGE_SENT",
            actor_role="ANONYMOUS_STUDENT",
            actor_name="Anonymous Student",
            details="Anonymous message posted to case tracking thread.",
            case_id=case.id,
        )
        return msg

    @staticmethod
    def attach_file(case: Case, file_storage, uploaded_by_context: str = "STUDENT") -> Optional[CaseAttachment]:
        """Saves an allowed attachment in protected storage and records its metadata."""
        import os
        import uuid
        import hashlib
        from werkzeug.utils import secure_filename

        if not file_storage or not file_storage.filename:
            return None

        filename = secure_filename(file_storage.filename)
        if not filename:
            return None

        # Check extension
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        allowed = current_app.config.get("ALLOWED_EXTENSIONS", {"pdf", "png", "jpg", "jpeg", "txt", "docx"})
        if ext not in allowed:
            return None

        # Read file content safely for size and checksum
        file_bytes = file_storage.read()
        file_size = len(file_bytes)
        max_bytes = current_app.config.get("MAX_CONTENT_LENGTH", 5 * 1024 * 1024)
        if file_size > max_bytes or file_size == 0:
            return None

        sha256_hash = hashlib.sha256(file_bytes).hexdigest()
        storage_id = f"{uuid.uuid4().hex}.{ext}"

        upload_folder = current_app.config.get("UPLOAD_FOLDER", os.path.join(os.getcwd(), "instance", "protected_uploads"))
        os.makedirs(upload_folder, exist_ok=True)
        target_path = os.path.join(upload_folder, storage_id)

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        attachment = CaseAttachment(
            case_id=case.id,
            storage_identifier=storage_id,
            original_filename=filename,
            content_type=file_storage.content_type or f"application/{ext}",
            file_size=file_size,
            sha256_checksum=sha256_hash,
            uploaded_by_context=uploaded_by_context,
        )
        db.session.add(attachment)
        db.session.commit()

        AuditService.log_action(
            action_type="ATTACHMENT_UPLOADED",
            actor_role="ANONYMOUS_STUDENT" if uploaded_by_context == "STUDENT" else "STAFF",
            actor_name="Anonymous Student" if uploaded_by_context == "STUDENT" else "Staff",
            details=f"Attached file '{filename}' ({file_size} bytes) verified and stored securely.",
            case_id=case.id,
        )
        return attachment

    @staticmethod
    def add_committee_message(
        case: Case,
        user_id: int,
        display_name: str,
        body: str,
        is_internal_note: bool = False,
    ) -> CaseMessage:
        """Add an official committee response or internal confidential note."""
        msg = CaseMessage(
            case_id=case.id,
            sender_type=SenderType.COMMITTEE,
            sender_user_id=user_id,
            sender_display_name=display_name,
            message_body=body.strip(),
            is_internal_note=is_internal_note,
        )
        db.session.add(msg)
        case.updated_at = datetime.datetime.utcnow()
        db.session.commit()

        action_name = "INTERNAL_NOTE_ADDED" if is_internal_note else "COMMITTEE_MESSAGE_SENT"
        AuditService.log_action(
            action_type=action_name,
            actor_role="COMMITTEE",
            actor_name=display_name,
            actor_user_id=user_id,
            details="Internal confidential note added." if is_internal_note else "Official committee response posted.",
            case_id=case.id,
        )
        return msg

    @staticmethod
    def assign_case(
        case: Case,
        assigned_user_id: int,
        assigned_by_user_id: int,
        assigned_by_name: str = "Committee Lead",
        assigned_by_role: str = "COMMITTEE_LEAD",
        notes: Optional[str] = None,
    ) -> CaseAssignment:
        """Assign or reassign a case to an investigator."""
        user = User.query.get(assigned_user_id)
        if not user:
            raise ValueError("Target assigned staff user not found.")

        # Deactivate any previous active assignments
        now = datetime.datetime.utcnow()
        for old_assign in case.assignments:
            if old_assign.is_active:
                old_assign.is_active = False
                old_assign.unassigned_at = now

        assignment = CaseAssignment(
            case_id=case.id,
            assigned_user_id=assigned_user_id,
            assigned_by_id=assigned_by_user_id,
            assigned_at=now,
            notes=notes,
            is_active=True,
        )
        db.session.add(assignment)

        # Transition status to ASSIGNED if currently RECEIVED
        if case.status == CaseStatus.RECEIVED:
            case.status = CaseStatus.ASSIGNED

        case.updated_at = now
        db.session.commit()

        AuditService.log_action(
            action_type="CASE_ASSIGNED",
            actor_role=assigned_by_role,
            actor_name=assigned_by_name,
            actor_user_id=assigned_by_user_id,
            details=f"Case assigned to {user.full_name} ({user.department}). Note: {notes or 'None'}",
            case_id=case.id,
        )
        return assignment

    @staticmethod
    def escalate_case(
        case: Case,
        user_id: int,
        trigger_reason: str,
        escalation_target: str,
        user_name: str = "Committee Lead",
        user_role: str = "COMMITTEE_LEAD",
    ) -> CaseEscalation:
        """Formally escalate a case due to urgency or SLA breach."""
        now = datetime.datetime.utcnow()
        # Set 24 hour escalation deadline
        deadline = now + datetime.timedelta(hours=24)

        escalation = CaseEscalation(
            case_id=case.id,
            trigger_reason=trigger_reason.strip(),
            deadline=deadline,
            escalation_target=escalation_target.strip(),
            status=EscalationStatus.ACTIVE,
            created_at=now,
        )
        db.session.add(escalation)

        # Ensure priority is elevated to High or Critical
        if case.priority in [CasePriority.LOW, CasePriority.MEDIUM]:
            case.priority = CasePriority.HIGH

        case.updated_at = now
        db.session.commit()

        AuditService.log_action(
            action_type="CASE_ESCALATED",
            actor_role=user_role,
            actor_name=user_name,
            actor_user_id=user_id,
            details=f"Formal escalation triggered: {trigger_reason} -> Target: {escalation_target}",
            case_id=case.id,
        )
        return escalation

