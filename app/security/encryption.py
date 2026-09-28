"""Application-level field encryption for sensitive case narratives and messages.

Protects sensitive complaint details at rest using AES-256 (Fernet) while keeping
non-sensitive metadata (status, priority, category) unencrypted for efficient indexing.
"""

import os
import base64
import logging

logger = logging.getLogger(__name__)

_cipher = None


def _get_cipher():
    """Lazily initialize the Fernet cipher from environment configuration."""
    global _cipher
    if _cipher is not None:
        return _cipher

    key = os.getenv("CASE_ENCRYPTION_KEY", "").strip()
    if not key:
        return None

    try:
        from cryptography.fernet import Fernet
        _cipher = Fernet(key.encode("utf-8") if isinstance(key, str) else key)
        return _cipher
    except Exception as e:
        logger.warning(f"Could not initialize encryption cipher: {e}")
        return None


def encrypt_field(plaintext: str) -> str:
    """Encrypt a sensitive plaintext string. Returns prefixed ciphertext or original string if cipher is inactive."""
    if not plaintext:
        return plaintext

    cipher = _get_cipher()
    if cipher is None:
        return plaintext

    try:
        encrypted_bytes = cipher.encrypt(plaintext.encode("utf-8"))
        return "enc:" + encrypted_bytes.decode("utf-8")
    except Exception as e:
        logger.error(f"Field encryption failed: {e}")
        return plaintext


def decrypt_field(ciphertext: str) -> str:
    """Decrypt an encrypted field string. If unencrypted or no prefix, returns original string."""
    if not ciphertext or not isinstance(ciphertext, str):
        return ciphertext

    if not ciphertext.startswith("enc:"):
        return ciphertext

    cipher = _get_cipher()
    if cipher is None:
        return ciphertext

    try:
        raw_token = ciphertext[4:].encode("utf-8")
        decrypted_bytes = cipher.decrypt(raw_token)
        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        logger.error(f"Field decryption failed: {e}")
        return ciphertext
