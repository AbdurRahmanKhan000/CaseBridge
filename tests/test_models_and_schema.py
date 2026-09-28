"""Database schema and model entity verification tests for MySQL 8.0.

Tests table definitions, primary keys, foreign keys, relationships, and constraints
for all 11 core entities.
"""

from app.models import (
    db,
    Role,
    User,
    ComplaintCategory,
    Case,
    CaseAssignment,
    CaseMessage,
    CaseEvent,
    CaseAttachment,
    CaseEscalation,
    CaseNotification,
    SystemSetting,
    CasePriority,
    CaseStatus,
    SenderContext,
)


def test_core_entities_tables_registered(app):
    """Ensure all 11 required core entities are registered in SQLAlchemy metadata."""
    metadata = db.metadata
    table_names = set(metadata.tables.keys())

    expected_tables = {
        "roles",
        "users",
        "complaint_categories",
        "cases",
        "assignments",
        "messages",
        "case_events",
        "attachments",
        "escalations",
        "notifications",
        "system_settings",
    }
    assert expected_tables.issubset(table_names), f"Missing tables: {expected_tables - table_names}"


def test_role_model_schema():
    """Verify Role entity schema constraints."""
    table = Role.__table__
    assert "id" in table.columns
    assert "name" in table.columns
    assert "description" in table.columns
    assert table.columns["name"].unique is True


def test_user_model_schema():
    """Verify User entity constraints and isolation from anonymous students."""
    table = User.__table__
    assert "id" in table.columns
    assert "role_id" in table.columns
    assert "username" in table.columns
    assert "email" in table.columns
    assert "password_hash" in table.columns
    assert "active" in table.columns

    # Foreign key to roles
    fks = list(table.foreign_keys)
    fk_targets = [fk.target_fullname for fk in fks]
    assert "roles.id" in fk_targets


def test_case_model_schema():
    """Verify Case entity shielding internal PK from tracking representation."""
    table = Case.__table__
    assert "id" in table.columns
    assert "tracking_hash" in table.columns
    assert "category_id" in table.columns
    assert "priority" in table.columns
    assert "status" in table.columns
    assert "narrative" in table.columns
    assert "deadline_at" in table.columns
    assert "created_at" in table.columns

    # Tracking hash must be unique
    assert table.columns["tracking_hash"].unique is True


def test_assignments_model_schema():
    """Verify Assignment entity foreign keys and constraints."""
    table = CaseAssignment.__table__
    assert "case_id" in table.columns
    assert "assigned_user_id" in table.columns
    assert "assigned_by_id" in table.columns
    assert "is_active" in table.columns

    fks = [fk.target_fullname for fk in table.foreign_keys]
    assert "cases.id" in fks
    assert "users.id" in fks


def test_messages_model_schema():
    """Verify Messages schema supports anonymous student messages with null sender_user_id."""
    table = CaseMessage.__table__
    assert "case_id" in table.columns
    assert "sender_context" in table.columns
    assert "sender_user_id" in table.columns
    assert "message_content" in table.columns

    # sender_user_id must be nullable for anonymous submitters
    assert table.columns["sender_user_id"].nullable is True


def test_case_events_audit_schema():
    """Verify CaseEvent immutable audit trail entity."""
    table = CaseEvent.__table__
    assert "case_id" in table.columns
    assert "event_type" in table.columns
    assert "actor" in table.columns
    assert "actor_role" in table.columns
    assert "details" in table.columns
    assert "timestamp" in table.columns


def test_attachment_model_schema():
    """Verify Attachment storage identifier uniqueness and safe metadata."""
    table = CaseAttachment.__table__
    assert "storage_identifier" in table.columns
    assert "original_filename" in table.columns
    assert "sha256_checksum" in table.columns
    assert table.columns["storage_identifier"].unique is True


def test_escalation_model_schema():
    """Verify Escalation SLA tracking entity."""
    table = CaseEscalation.__table__
    assert "case_id" in table.columns
    assert "trigger_reason" in table.columns
    assert "deadline" in table.columns
    assert "status" in table.columns


def test_notification_model_schema():
    """Verify internal notification entity for committee members."""
    table = CaseNotification.__table__
    assert "recipient_user_id" in table.columns
    assert "title" in table.columns
    assert "is_read" in table.columns


def test_system_setting_model_schema():
    """Verify SystemSetting key-value entity."""
    table = SystemSetting.__table__
    assert "setting_key" in table.columns
    assert "setting_value" in table.columns
    assert table.columns["setting_key"].unique is True


def test_model_instantiation_and_properties():
    """Verify in-memory model instantiation and property helpers."""
    cat = ComplaintCategory(name="Academic Retaliation", description="Disputes over grading fairness", sla_days=5)
    assert cat.name == "Academic Retaliation"
    assert cat.sla_days == 5
    assert cat.is_active is True

    case = Case(
        tracking_hash="d59b2075a305a415cfbbfae274b77dcf0b1f13b19c8d8b671a5323a67d0f983a",
        category_id=1,
        priority=CasePriority.HIGH,
        status=CaseStatus.RECEIVED,
        subject="Dispute over laboratory evaluation",
        narrative="Test narrative details safely stored with application encryption",
    )
    assert case.priority == CasePriority.HIGH
    assert case.status == CaseStatus.RECEIVED
    assert case.subject == "Dispute over laboratory evaluation"
    assert "Test narrative" in case.narrative
    assert case.description == case.narrative
