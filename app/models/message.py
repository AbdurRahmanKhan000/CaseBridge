"""CaseBridge Two-Way Anonymous Dialogue & Internal Notes Model."""

import datetime
import enum
from . import db
from app.security.encryption import encrypt_field, decrypt_field


class SenderContext(enum.Enum):
    STUDENT = "STUDENT"
    COMMITTEE = "COMMITTEE"
    SYSTEM = "SYSTEM"


# Backward-compatible alias
SenderType = SenderContext


class CaseMessage(db.Model):
    """
    Two-way dialogue between anonymous student complainant and committee.
    Anonymous student messages NEVER require a student account.
    """
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_context = db.Column(db.Enum(SenderContext), nullable=False)
    # NULL for anonymous student messages
    sender_user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    display_name = db.Column(db.String(120), nullable=True)

    # Message content column with application-level encryption
    _message_content = db.Column("message_content", db.Text, nullable=False)

    is_internal_note = db.Column(db.Boolean, default=False, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)

    case = db.relationship("Case", back_populates="messages")
    sender_user = db.relationship("User", foreign_keys=[sender_user_id])

    __table_args__ = (
        db.Index("ix_messages_case_created", "case_id", "created_at"),
    )

    def __init__(self, **kwargs):
        # Support both sender_context and sender_type
        if "sender_type" in kwargs and "sender_context" not in kwargs:
            val = kwargs.pop("sender_type")
            kwargs["sender_context"] = val if isinstance(val, SenderContext) else SenderContext(val)
        # Support both message_body and message_content
        if "message_body" in kwargs and "_message_content" not in kwargs and "message_content" not in kwargs:
            raw_text = kwargs.pop("message_body")
            kwargs["_message_content"] = encrypt_field(raw_text)
        elif "message_content" in kwargs:
            raw_text = kwargs.pop("message_content")
            kwargs["_message_content"] = encrypt_field(raw_text)
        # Support both sender_display_name and display_name
        if "sender_display_name" in kwargs and "display_name" not in kwargs:
            kwargs["display_name"] = kwargs.pop("sender_display_name")
        super().__init__(**kwargs)

    @property
    def message_content(self) -> str:
        return decrypt_field(self._message_content)

    @message_content.setter
    def message_content(self, value: str):
        self._message_content = encrypt_field(value)

    # Backward-compatible property for template rendering
    @property
    def body(self) -> str:
        return self.message_content

    @body.setter
    def body(self, value: str):
        self.message_content = value

    @property
    def message_body(self) -> str:
        return self.message_content

    @property
    def sender_type(self) -> SenderContext:
        return self.sender_context

    @property
    def sender_display_name(self) -> str:
        return self.display_name or ("Anonymous Complainant" if self.sender_context == SenderContext.STUDENT else "Committee Member")

    def __repr__(self) -> str:
        return f"<CaseMessage id={self.id} case_id={self.case_id} sender={self.sender_context.value}>"
