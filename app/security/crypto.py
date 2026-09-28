"""CaseBridge Cryptographic and Hashing Primitives."""

import hashlib
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

# Unambiguous 32-character alphabet (omitting 0, O, 1, I, L to prevent human transcription errors)
SAFE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def generate_tracking_code() -> str:
    """
    Generate an unpredictable, non-sequential tracking code.
    Format: CB-XXXX-XXXX-XXXX (e.g., CB-8F3K-9M2X-7R4Q)
    Entropy: 32^12 combinations = 1.15 x 10^18 possibilities.
    """
    blocks = []
    for _ in range(3):
        block = "".join(secrets.choice(SAFE_ALPHABET) for _ in range(4))
        blocks.append(block)
    return f"CB-{'-'.join(blocks)}"


def hash_tracking_code(raw_code: str, salt: str = "") -> str:
    """
    Compute deterministic SHA-256 hash of a normalized tracking code.
    Normalized: strips whitespace, converts to uppercase.
    Combined with server-side pepper salt for defense-in-depth against rainbow tables.
    """
    normalized = raw_code.strip().upper().replace(" ", "")
    combined = f"{normalized}:{salt}"
    return hashlib.sha256(combined.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    """Hash password using Werkzeug's secure scrypt derivation."""
    return generate_password_hash(password, method="scrypt")


def verify_password(password_hash: str, password: str) -> bool:
    """Verify password against Werkzeug hash in constant time."""
    return check_password_hash(password_hash, password)
