"""Role-Based Access Control (RBAC) relationship tests."""

from app.models import Role, User


def test_role_and_user_entity_attributes():
    """Verify Role and User instantiation and property helpers."""
    member_role = Role(
        id=1,
        name="COMMITTEE_MEMBER",
        description="Investigates assigned student grievances",
    )
    assert member_role.name == "COMMITTEE_MEMBER"
    assert member_role.value == "COMMITTEE_MEMBER"

    user = User(
        id=10,
        role_id=member_role.id,
        username="elena.vance",
        email="elena.vance@university.edu",
        password_hash="scrypt:fake_hash",
        full_name="Dr. Elena Vance",
        department="Student Affairs",
        active=True,
    )
    user.role_rel = member_role

    assert user.role.name == "COMMITTEE_MEMBER"
    assert user.is_active is True
    assert user.username == "elena.vance"
    assert user.email == "elena.vance@university.edu"


def test_lead_and_admin_role_creation():
    """Verify Committee Lead and System Admin roles."""
    lead_role = Role(id=2, name="COMMITTEE_LEAD", description="Oversees triage and assignments")
    admin_role = Role(id=3, name="SYSTEM_ADMIN", description="Manages categories and settings")

    lead_user = User(
        id=11,
        role_id=lead_role.id,
        username="marcus.thorne",
        email="marcus.thorne@university.edu",
        password_hash="scrypt:fake_hash",
        full_name="Marcus Thorne, J.D.",
    )
    lead_user.role_rel = lead_role
    assert lead_user.role.name == "COMMITTEE_LEAD"

    admin_user = User(
        id=12,
        role_id=admin_role.id,
        username="sarah.jenkins",
        email="sarah.jenkins@university.edu",
        password_hash="scrypt:fake_hash",
        full_name="Sarah Jenkins",
    )
    admin_user.role_rel = admin_role
    assert admin_user.role.name == "SYSTEM_ADMIN"
