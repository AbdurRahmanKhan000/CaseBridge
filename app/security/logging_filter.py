"""CaseBridge Sensitive Data Redaction Log Filter."""

import logging
import re

SENSITIVE_PATTERNS = [
    (re.compile(r'password=([^&\s]+)', re.IGNORECASE), 'password=[REDACTED]'),
    (re.compile(r'token=([^&\s]+)', re.IGNORECASE), 'token=[REDACTED]'),
    (re.compile(r'CB-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}', re.IGNORECASE), 'CB-[TRACKING_CODE_REDACTED]'),
    (re.compile(r'session=([^;\s]+)', re.IGNORECASE), 'session=[REDACTED]'),
    (re.compile(r'authorization:\s*bearer\s+([^\s]+)', re.IGNORECASE), 'authorization: bearer [REDACTED]'),
]


class SensitiveDataFilter(logging.Filter):
    """
    Log filter that scrubs credentials, raw tracking codes, and session tokens
    from application log output.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            msg = record.msg
            for pattern, replacement in SENSITIVE_PATTERNS:
                msg = pattern.sub(replacement, msg)
            record.msg = msg
        return True
