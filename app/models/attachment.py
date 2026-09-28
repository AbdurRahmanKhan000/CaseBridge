"""CaseBridge Secure Evidence Attachment Model."""

import datetime
from . import db


class CaseAttachment(db.Model):
    """
    Protected evidence attachment metadata.
    Actual files are stored in an un-routable protected instance folder,
    NEVER in a public static directory.
    """
    __tablename__ = "attachments"

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_identifier = db.Column(db.String(255), unique=True, nullable=False, index=True)
    original_filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(100), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    sha256_checksum = db.Column(db.String(64), nullable=False)
    uploaded_by_context = db.Column(db.String(50), default="STUDENT", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

    case = db.relationship("Case", back_populates="attachments")

    def __init__(self, **kwargs):
        if "file_name" in kwargs and "original_filename" not in kwargs:
            kwargs["original_filename"] = kwargs.pop("file_name")
        if "storage_key" in kwargs and "storage_identifier" not in kwargs:
            kwargs["storage_identifier"] = kwargs.pop("storage_key")
        if "file_size_bytes" in kwargs and "file_size" not in kwargs:
            kwargs["file_size"] = kwargs.pop("file_size_bytes")
        if "mime_type" in kwargs and "content_type" not in kwargs:
            kwargs["content_type"] = kwargs.pop("mime_type")
        if "sha256_checksum" not in kwargs:
            kwargs["sha256_checksum"] = "pending_hash"
        super().__init__(**kwargs)

    # Backward-compatible properties
    @property
    def file_name(self) -> str:
        return self.original_filename

    @property
    def file_size_bytes(self) -> int:
        return self.file_size

    @property
    def mime_type(self) -> str:
        return self.content_type

    @property
    def storage_key(self) -> str:
        return self.storage_identifier

    def __repr__(self) -> str:
        return f"<CaseAttachment id={self.id} case_id={self.case_id} file='{self.original_filename}'>"
