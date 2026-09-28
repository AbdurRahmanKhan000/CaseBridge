"""CaseBridge Complaint Category Entity."""

import datetime
from . import db


class ComplaintCategory(db.Model):
    """Institutional complaint classification category."""
    __tablename__ = "complaint_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    sla_days = db.Column(db.Integer, default=7, nullable=False)
    active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, nullable=False)

    cases = db.relationship("Case", back_populates="category", lazy="dynamic")

    @property
    def is_active(self) -> bool:
        """Alias for active."""
        return self.active

    @is_active.setter
    def is_active(self, val: bool):
        self.active = val

    def __repr__(self) -> str:
        return f"<ComplaintCategory id={self.id} name='{self.name}' sla_days={self.sla_days}>"


# Backward-compatible alias
Category = ComplaintCategory
