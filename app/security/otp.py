"""CaseBridge OTP Security Primitives."""

import hashlib
import hmac
import secrets


def generate_secure_otp(length: int = 5) -> str:
    """
    Generate an unpredictable, cryptographically random numeric verification code.
    Default length: exactly 5 digits (10000 - 99999).
    """
    if length != 5:
        # Generic fallback if custom length
        min_val = 10 ** (length - 1)
        max_val = (10 ** length) - 1
        return str(secrets.randbelow(max_val - min_val + 1) + min_val)
    return str(secrets.randbelow(90000) + 10000)


def hash_otp(email: str, otp: str, salt: str = "") -> str:
    """
    Generate SHA-256 salted hash of an OTP code bound to the recipient email.
    Prevents plaintext storage of authentication codes.
    """
    normalized_email = email.strip().lower()
    raw = f"{salt}:{normalized_email}:{otp}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def verify_otp_hash(stored_hash: str, email: str, entered_otp: str, salt: str = "") -> bool:
    """Constant-time verification of entered OTP against stored hash."""
    candidate_hash = hash_otp(email, entered_otp, salt=salt)
    return hmac.compare_digest(stored_hash, candidate_hash)
