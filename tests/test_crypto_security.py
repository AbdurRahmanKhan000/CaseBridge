"""Verification of cryptographic primitives and tracking code entropy."""

import re
from app.security.crypto import (
    generate_tracking_code,
    hash_tracking_code,
    hash_password,
    verify_password,
)


def test_tracking_code_format_and_entropy():
    """Verify tracking code follows CB-XXXX-XXXX-XXXX and does not repeat."""
    pattern = re.compile(r"^CB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$")
    codes = set()
    for _ in range(50):
        code = generate_tracking_code()
        assert pattern.match(code), f"Code {code} failed pattern regex"
        # Ensure visually confusing characters (0, O, 1, I) are omitted
        for forbidden in ["0", "O", "1", "I"]:
            assert forbidden not in code
        codes.add(code)
    # Check 50 random samples are unique
    assert len(codes) == 50


def test_tracking_code_hashing_consistency():
    """Verify SHA-256 peppered hashing is deterministic and irreversible."""
    code = "CB-9K2M-4F8X-7R3A"
    digest1 = hash_tracking_code(code)
    digest2 = hash_tracking_code(code)
    assert digest1 == digest2
    assert len(digest1) == 64  # SHA-256 hexadecimal output length
    assert digest1 != code


def test_password_hashing():
    """Verify Werkzeug secure scrypt hashing and verification."""
    pw = "SuperSecurePassword2026!"
    hashed = hash_password(pw)
    assert hashed != pw
    assert verify_password(hashed, pw) is True
    assert verify_password(hashed, "WrongPassword") is False
