"""Initial CaseBridge schema for MySQL 8.0 / SQLAlchemy.

Creates all 11 core entities:
1. roles
2. users
3. complaint_categories
4. cases
5. assignments
6. messages
7. case_events
8. attachments
9. escalations
10. notifications
11. system_settings

Revision ID: 001_initial_schema
Revises: None
Create Date: 2026-09-24 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # 1. roles table
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_roles_name", "roles", ["name"])

    # 2. users table (strictly staff, no anonymous students)
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=191), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("department", sa.String(length=150), nullable=False, server_default="Ethics & Compliance"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_role_id", "users", ["role_id"])
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])

    # 3. complaint_categories table
    op.create_table(
        "complaint_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sla_days", sa.Integer(), nullable=False, server_default="7"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_complaint_categories_name", "complaint_categories", ["name"])

    # 4. cases table
    op.create_table(
        "cases",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tracking_hash", sa.String(length=64), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("priority", sa.Enum("LOW", "MEDIUM", "HIGH", "CRITICAL", name="casepriority"), nullable=False, server_default="MEDIUM"),
        sa.Column("status", sa.Enum("RECEIVED", "ASSIGNED", "IN_REVIEW", "ACTION_REQUIRED", "RESOLVED", "CLOSED", name="casestatus"), nullable=False, server_default="RECEIVED"),
        sa.Column("subject", sa.String(length=191), nullable=False),
        sa.Column("narrative", sa.Text(), nullable=False),
        sa.Column("location", sa.String(length=191), nullable=True),
        sa.Column("incident_date", sa.Date(), nullable=True),
        sa.Column("deadline_at", sa.DateTime(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["complaint_categories.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tracking_hash"),
    )
    op.create_index("ix_cases_tracking_hash", "cases", ["tracking_hash"])
    op.create_index("ix_cases_category_id", "cases", ["category_id"])
    op.create_index("ix_cases_priority", "cases", ["priority"])
    op.create_index("ix_cases_status", "cases", ["status"])
    op.create_index("ix_cases_created_at", "cases", ["created_at"])
    op.create_index("ix_cases_updated_at", "cases", ["updated_at"])
    op.create_index("ix_cases_deadline_at", "cases", ["deadline_at"])

    # 5. assignments table
    op.create_table(
        "assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=False),
        sa.Column("assigned_user_id", sa.Integer(), nullable=False),
        sa.Column("assigned_by_id", sa.Integer(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), nullable=False),
        sa.Column("unassigned_at", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["assigned_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_assignments_case_id", "assignments", ["case_id"])
    op.create_index("ix_assignments_assigned_user_id", "assignments", ["assigned_user_id"])

    # 6. messages table
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=False),
        sa.Column("sender_context", sa.Enum("STUDENT", "COMMITTEE", "SYSTEM", name="sendercontext"), nullable=False),
        sa.Column("sender_user_id", sa.Integer(), nullable=True),
        sa.Column("display_name", sa.String(length=120), nullable=True),
        sa.Column("message_content", sa.Text(), nullable=False),
        sa.Column("is_internal_note", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_messages_case_id", "messages", ["case_id"])
    op.create_index("ix_messages_created_at", "messages", ["created_at"])
    op.create_index("ix_messages_case_created", "messages", ["case_id", "created_at"])

    # 7. case_events table (Audit & event log)
    op.create_table(
        "case_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("actor", sa.String(length=150), nullable=False),
        sa.Column("actor_role", sa.String(length=64), nullable=False),
        sa.Column("actor_user_id", sa.Integer(), nullable=True),
        sa.Column("details", sa.String(length=500), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_case_events_case_id", "case_events", ["case_id"])
    op.create_index("ix_case_events_event_type", "case_events", ["event_type"])
    op.create_index("ix_case_events_timestamp", "case_events", ["timestamp"])

    # 8. attachments table
    op.create_table(
        "attachments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=False),
        sa.Column("storage_identifier", sa.String(length=255), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=100), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("sha256_checksum", sa.String(length=64), nullable=False),
        sa.Column("uploaded_by_context", sa.String(length=50), nullable=False, server_default="STUDENT"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_identifier"),
    )
    op.create_index("ix_attachments_case_id", "attachments", ["case_id"])
    op.create_index("ix_attachments_storage_identifier", "attachments", ["storage_identifier"])

    # 9. escalations table
    op.create_table(
        "escalations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=False),
        sa.Column("trigger_reason", sa.String(length=255), nullable=False),
        sa.Column("deadline", sa.DateTime(), nullable=False),
        sa.Column("escalation_target", sa.String(length=150), nullable=False),
        sa.Column("status", sa.Enum("ACTIVE", "ACKNOWLEDGED", "RESOLVED", name="escalationstatus"), nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_escalations_case_id", "escalations", ["case_id"])
    op.create_index("ix_escalations_deadline", "escalations", ["deadline"])
    op.create_index("ix_escalations_status", "escalations", ["status"])

    # 10. notifications table
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("case_id", sa.Integer(), nullable=True),
        sa.Column("recipient_user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["recipient_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_case_id", "notifications", ["case_id"])
    op.create_index("ix_notifications_recipient_user_id", "notifications", ["recipient_user_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])

    # 11. system_settings table
    op.create_table(
        "system_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("setting_key", sa.String(length=100), nullable=False),
        sa.Column("setting_value", sa.Text(), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("setting_key"),
    )
    op.create_index("ix_system_settings_key", "system_settings", ["setting_key"])


def downgrade():
    op.drop_table("system_settings")
    op.drop_table("notifications")
    op.drop_table("escalations")
    op.drop_table("attachments")
    op.drop_table("case_events")
    op.drop_table("messages")
    op.drop_table("assignments")
    op.drop_table("cases")
    op.drop_table("complaint_categories")
    op.drop_table("users")
    op.drop_table("roles")
