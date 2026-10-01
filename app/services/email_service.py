"""CaseBridge Email Dispatch Service."""

import logging
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# In-memory record for testing / verification when SMTP is not configured
_test_outbox: List[Dict[str, Any]] = []


class EmailService:
    """
    Official institutional communication dispatcher.
    Follows ARK Ecosystem / CaseBridge identity conventions.
    Never hardcodes credentials; reads strictly from environment variables.
    """

    @classmethod
    def get_outbox(cls) -> List[Dict[str, Any]]:
        """Access sent emails in test / development mode."""
        return _test_outbox

    @classmethod
    def clear_outbox(cls) -> None:
        """Clear the in-memory test outbox."""
        _test_outbox.clear()

    @classmethod
    def send_staff_otp_email(cls, recipient_email: str, staff_name: str, otp_code: str) -> bool:
        """
        Deliver passwordless login verification code to approved staff member.
        Sender identity: ARK Ecosystem — CaseBridge
        """
        smtp_host = os.getenv("SMTP_HOST", "")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

        from_name = os.getenv("SMTP_FROM_NAME", "ARK Ecosystem — CaseBridge")
        from_email = os.getenv("SMTP_FROM_EMAIL", os.getenv("SUPPORT_EMAIL", "noreply@casebridge.ark"))

        subject = "CaseBridge Staff Portal Verification Code"

        text_body = f"""Hello {staff_name},

A Staff Portal sign-in was requested for your CaseBridge account.

Your verification code is:

{otp_code}

This code expires in 5 minutes and should not be shared with anyone.

If you did not request this sign-in, you can safely ignore this email.

CaseBridge
ARK Ecosystem
"""

        html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
    <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 24px;">
      <span style="font-size: 18px; font-weight: bold; color: #2563eb;">CaseBridge</span>
      <span style="font-size: 13px; color: #64748b; margin-left: 8px;">· ARK Ecosystem</span>
    </div>
    
    <p style="font-size: 15px; margin-bottom: 16px;">Hello <strong>{staff_name}</strong>,</p>
    
    <p style="font-size: 14px; color: #475569; margin-bottom: 24px;">
      A Staff Portal sign-in was requested for your CaseBridge account.
    </p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
      <span style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #15803d; letter-spacing: 0.05em; margin-bottom: 6px;">Your Verification Code</span>
      <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 0.2em; color: #166534;">{otp_code}</span>
    </div>
    
    <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
      This code expires in <strong>5 minutes</strong> and should not be shared with anyone.
    </p>
    
    <p style="font-size: 13px; color: #94a3b8; margin-bottom: 24px;">
      If you did not request this sign-in, you can safely ignore this email.
    </p>
    
    <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 12px; color: #64748b;">
      <p style="margin: 0;"><strong>CaseBridge</strong></p>
      <p style="margin: 2px 0 0 0; color: #94a3b8;">ARK Ecosystem</p>
    </div>
  </div>
</body>
</html>
"""

        # In-memory record for testing
        outbox_entry = {
            "to": recipient_email,
            "staff_name": staff_name,
            "subject": subject,
            "body": text_body,
            "otp_code": otp_code,
        }
        _test_outbox.append(outbox_entry)

        # If SMTP is not configured, we record safely and return success
        if not smtp_host:
            logger.info("SMTP host not configured. Verification email recorded to safe outbox queue.")
            return True

        # Send via live SMTP server
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{from_email}>"
            msg["To"] = recipient_email

            part1 = MIMEText(text_body, "plain", "utf-8")
            part2 = MIMEText(html_body, "html", "utf-8")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                if smtp_use_tls:
                    server.starttls()
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.sendmail(from_email, [recipient_email], msg.as_string())

            logger.info("Verification code email successfully dispatched to staff member.")
            return True
        except Exception as e:
            # Never log secrets or credentials on exception
            logger.error("Failed to deliver verification email via SMTP: %s", type(e).__name__)
            return False
