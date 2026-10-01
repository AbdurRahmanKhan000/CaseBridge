"""Add staff_login_otps table for passwordless email OTP authentication.

Revision ID: 002_staff_login_otp
Revises: 001_initial_schema
Create Date: 2026-09-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "002_staff_login_otp"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "staff_login_otps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=191), nullable=False),
        sa.Column("otp_hash", sa.String(length=64), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_used", sa.Boolean(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_staff_login_otps_user_id", "staff_login_otps", ["user_id"])
    op.create_index("ix_staff_login_otps_email", "staff_login_otps", ["email"])
    op.create_index("ix_staff_login_otps_expires_at", "staff_login_otps", ["expires_at"])
    op.create_index(
        "ix_staff_otp_lookup",
        "staff_login_otps",
        ["email", "is_used", "expires_at"],
    )


def downgrade():
    op.drop_index("ix_staff_otp_lookup", table_name="staff_login_otps")
    op.drop_index("ix_staff_login_otps_expires_at", table_name="staff_login_otps")
    op.drop_index("ix_staff_login_otps_email", table_name="staff_login_otps")
    op.drop_index("ix_staff_login_otps_user_id", table_name="staff_login_otps")
    op.drop_table("staff_login_otps")
