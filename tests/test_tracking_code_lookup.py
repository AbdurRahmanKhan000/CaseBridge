"""Tracking code cryptographic security and lookup verification."""

import re
from app.security.crypto import (
    generate_tracking_code,
    hash_tracking_code,
)


def test_tracking_code_format_entropy():
    """Verify tracking code follows format CB-XXXX-XXXX-XXXX and exhibits high entropy."""
    pattern = re.compile(r"^CB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$")
    generated = set()
    for _ in range(100):
        code = generate_tracking_code()
        assert pattern.match(code), f"Tracking code '{code}' does not match expected format"
        # Verify exclusion of visually ambiguous characters
        for char in ["0", "O", "1", "I"]:
            assert char not in code
        generated.add(code)
    # Check 100 random tokens are all unique (no sequential incrementing IDs)
    assert len(generated) == 100


def test_tracking_code_lookup_hashing_consistency():
    """Verify SHA-256 peppered hash is deterministic for lookups."""
    raw_code = "CB-9K2M-4F8X-7R3A"
    salt = "secure_test_salt_value_12345"

    digest1 = hash_tracking_code(raw_code, salt=salt)
    digest2 = hash_tracking_code(raw_code, salt=salt)

    assert digest1 == digest2
    assert len(digest1) == 64  # Standard SHA-256 hex string length
    assert digest1 != raw_code

    # Changing salt alters hash output
    alt_digest = hash_tracking_code(raw_code, salt="different_salt")
    assert alt_digest != digest1


def test_case_tracking_hash_shielding():
    """Verify internal database ID is never derived from tracking code."""
    from app.models import Case
    # Case table has separate primary key and tracking hash
    assert Case.id.key != Case.tracking_hash.key
    assert Case.__table__.columns["id"].autoincrement is True
