"""CaseBridge Anonymous Case Core Entity."""

import datetime
import enum
from . import db
from app.security.encryption import encrypt_field, decrypt_field


class CasePriority(enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class CaseStatus(enum.Enum):
    RECEIVED = "Received"
    ASSIGNED = "Assigned"
    IN_REVIEW = "In Review"
    ACTION_REQUIRED = "Action Required"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class Case(db.Model):
    """
    Core Anonymous Case entity.
    The internal integer primary key is strictly shielded from anonymous students.
    Students only ever possess the unpredictable, high-entropy tracking code.
    Lookup is performed against the SHA-256 peppered digest in `tracking_hash`.
    """
    __tablename__ = "cases"

    # Internal Primary Key (never exposed to students)
    id = db.Column(db.Integer, primary_key=True)

    # Cryptographic lookup representation: SHA-256(tracking_code + salt)
    tracking_hash = db.Column(db.String(64), unique=True, nullable=False, index=True)

    # Classification & Content
    category_id = db.Column(db.Integer, db.ForeignKey("complaint_categories.id"), nullable=False, index=True)
    priority = db.Column(db.Enum(CasePriority), default=CasePriority.MEDIUM, nullable=False, index=True)
    status = db.Column(db.Enum(CaseStatus), default=CaseStatus.RECEIVED, nullable=False, index=True)
    subject = db.Column(db.String(191), nullable=False)
    
    # Raw narrative column (stored with application-level encryption if key configured)
    _narrative = db.Column("narrative", db.Text, nullable=False)

    # Optional incident context
    location = db.Column(db.String(191), nullable=True)
    incident_date = db.Column(db.Date, nullable=True)

    # Workflow timestamps & deadlines
    deadline_at = db.Column(db.DateTime, nullable=True, index=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False, index=True)

    # Relationships
    category = db.relationship("ComplaintCategory", back_populates="cases")
    assignments = db.relationship("CaseAssignment", back_populates="case", cascade="all, delete-orphan", order_by="CaseAssignment.assigned_at.desc()")
    messages = db.relationship("CaseMessage", back_populates="case", cascade="all, delete-orphan", order_by="CaseMessage.created_at.asc()")
    attachments = db.relationship("CaseAttachment", back_populates="case", cascade="all, delete-orphan")
    events = db.relationship("CaseEvent", back_populates="case", cascade="all, delete-orphan", order_by="CaseEvent.timestamp.asc()")
    escalations = db.relationship("CaseEscalation", back_populates="case", cascade="all, delete-orphan")
    notifications = db.relationship("CaseNotification", back_populates="case")

    @property
    def narrative(self) -> str:
        """Transparently decrypt narrative when read."""
        return decrypt_field(self._narrative)

    @narrative.setter
    def narrative(self, value: str):
        """Transparently encrypt narrative before persisting."""
        self._narrative = encrypt_field(value)

    @property
    def description(self) -> str:
        """Alias for narrative."""
        return self.narrative

    @description.setter
    def description(self, value: str):
        self.narrative = value

    @property
    def is_overdue(self) -> bool:
        """Overdue is an active condition flag based on current timestamp vs deadline."""
        if self.status in [CaseStatus.RESOLVED, CaseStatus.CLOSED]:
            return False
        if not self.deadline_at:
            return False
        return datetime.datetime.utcnow() > self.deadline_at

    @property
    def current_assignment(self):
        """Returns the active assignment if present."""
        for assign in self.assignments:
            if assign.is_active:
                return assign
        return None

    @property
    def assigned_to(self):
        """Helper returning the currently assigned user."""
        active = self.current_assignment
        return active.assigned_user if active else None

    @property
    def assigned_to_id(self):
        """Helper returning the currently assigned user ID."""
        active = self.current_assignment
        return active.assigned_user_id if active else None

    @property
    def assignee(self):
        """Alias for assigned_to."""
        return self.assigned_to

    # Backward-compatible property for audit logs
    @property
    def audit_logs(self):
        return self.events

    def __repr__(self) -> str:
        return f"<Case id={self.id} status='{self.status.value}' priority='{self.priority.value}'>"
