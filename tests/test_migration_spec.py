"""Migration specification tests."""

import os


def test_migration_version_file_exists():
    """Verify initial migration script is present in migrations/versions/."""
    versions_dir = os.path.join(os.getcwd(), "migrations", "versions")
    assert os.path.exists(versions_dir)
    files = [f for f in os.listdir(versions_dir) if f.endswith(".py")]
    assert len(files) >= 1
    assert any("001_initial_schema" in f for f in files)


def test_migration_script_contains_required_tables():
    """Verify migration script defines all 11 core entities and downgrade logic."""
    migration_path = os.path.join(os.getcwd(), "migrations", "versions", "001_initial_schema.py")
    with open(migration_path, "r", encoding="utf-8") as f:
        content = f.read()

    expected_tables = [
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
    ]
    for table in expected_tables:
        assert f'"{table}"' in content or f"'{table}'" in content, f"Table '{table}' missing in migration script"

    # Verify downgrade logic drops all tables
    assert "def downgrade():" in content
    assert "op.drop_table" in content
