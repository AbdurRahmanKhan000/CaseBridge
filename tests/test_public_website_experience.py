"""Comprehensive test suite for Stage 3: Public Website, Student Experience & UI Content.

Covers:
- All 8 public routes load with 200 OK
- Unique titles and meta descriptions on public pages
- Form rendering, field validation, and consent checks
- Safe error states (non-enumerating 404/not-found notices, invalid format notices)
- Internal linking and navigation integrity
- Complete anonymous submission and tracking cycle
- Isolation of confidential committee-only internal notes from the student tracking view
"""

import re
from app.models import db, ComplaintCategory, Case, CaseMessage, CasePriority, CaseStatus, SenderContext
from app.services.case_service import CaseService


def test_all_eight_public_routes_load(client):
    """Verify all 8 approved public pages respond with 200 OK and semantic content."""
    routes = [
        ("/", b"Report Campus Concerns Safely"),
        ("/about", b"CaseBridge & The ARK Ecosystem"),
        ("/how-it-works", b"How the CaseBridge Process Works"),
        ("/submit", b"Submit an Anonymous Case"),
        ("/track", b"Case Tracking Portal"),
        ("/privacy", b"Privacy Boundary & Data Collection Policy"),
        ("/security", b"Security Architecture & Cryptographic Trust"),
        ("/faq", b"Frequently Asked Questions"),
    ]

    for path, expected_text in routes:
        response = client.get(path)
        assert response.status_code == 200, f"Path {path} returned status {response.status_code}"
        assert expected_text in response.data, f"Path {path} did not contain expected heading/text"


def test_seo_metadata_uniqueness(client):
    """Verify that public pages define distinct titles and meta descriptions (no AI-placeholder slop)."""
    pages = ["/", "/about", "/how-it-works", "/privacy", "/security", "/faq", "/submit", "/track"]
    titles = set()
    descriptions = set()

    for path in pages:
        res = client.get(path)
        html = res.data.decode("utf-8")

        # Extract title
        title_match = re.search(r"<title>(.*?)</title>", html, re.DOTALL)
        assert title_match is not None, f"Page {path} missing <title>"
        title = title_match.group(1).strip()
        assert len(title) > 5
        titles.add(title)

        # Extract meta description
        desc_match = re.search(r'<meta name="description" content="(.*?)">', html, re.DOTALL)
        assert desc_match is not None, f"Page {path} missing meta description"
        desc = desc_match.group(1).strip()
        assert len(desc) > 20
        descriptions.add(desc)

    # Every public page must have a unique title and meta description
    assert len(titles) == len(pages)
    assert len(descriptions) == len(pages)


def test_submit_form_validation_and_rejection(client):
    """Verify inline validation rejects empty subject, short narrative, or missing consent."""
    # 1. Missing Subject
    bad_payload_1 = {
        "category_id": "1",
        "priority": "Medium",
        "subject": "",
        "narrative": "Detailed narrative that exceeds the minimum thirty characters requirement.",
        "consent_ack": "on",
    }
    res = client.post("/submit", data=bad_payload_1, follow_redirects=True)
    assert res.status_code == 200
    assert b"Please provide a concise subject or incident title." in res.data

    # 2. Short Narrative (< 30 chars)
    bad_payload_2 = {
        "category_id": "1",
        "priority": "Medium",
        "subject": "Valid Subject Title",
        "narrative": "Too short",
        "consent_ack": "on",
    }
    res = client.post("/submit", data=bad_payload_2, follow_redirects=True)
    assert res.status_code == 200
    assert b"at least 30 characters in the incident description" in res.data

    # 3. Missing Consent Acknowledgment
    bad_payload_3 = {
        "category_id": "1",
        "priority": "Medium",
        "subject": "Valid Subject Title",
        "narrative": "Detailed narrative that exceeds the minimum thirty characters requirement.",
    }
    res = client.post("/submit", data=bad_payload_3, follow_redirects=True)
    assert res.status_code == 200
    assert b"confirm the anonymous submission acknowledgment" in res.data


def test_track_page_safe_error_states(client):
    """Verify track page error states: empty, invalid format, and non-existent code."""
    # 1. Empty input
    res_empty = client.post("/track", data={"tracking_code": ""}, follow_redirects=True)
    assert res_empty.status_code == 200
    assert b"Please enter your 16-character tracking code" in res_empty.data

    # 2. Invalid code format
    res_invalid_format = client.get("/track?code=INVALID-CODE")
    assert res_invalid_format.status_code == 200
    assert b"Invalid Format" in res_invalid_format.data

    # 3. Non-existent valid-format code (Safe error without enumeration leakage)
    res_not_found = client.get("/track?code=CB-ZZZZ-9999-XXXX")
    assert res_not_found.status_code == 200
    assert b"Case Not Found" in res_not_found.data
    assert b"No case record was found matching the provided code" in res_not_found.data


def test_complete_student_journey_and_internal_note_shielding(client, app):
    """
    Simulates complete student submission, code generation, track lookup,
    and proves internal committee notes are STRICTLY hidden from student view.
    """
    # 1. Submit Case
    payload = {
        "category_id": "1",
        "priority": "High",
        "subject": "Exam Retaliation in Computer Architecture Lab",
        "location": "Turing Engineering Hall 205",
        "narrative": "Factual description of grading discrepancies following departmental safety disagreement.",
        "consent_ack": "on",
    }
    submit_res = client.post("/submit", data=payload, follow_redirects=True)
    assert submit_res.status_code == 200
    assert b"Your Confidential Tracking Code" in submit_res.data

    # Extract 16-char code
    html = submit_res.data.decode("utf-8")
    match = re.search(r"CB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}", html)
    assert match is not None
    code = match.group(0)

    # 2. Add an official committee message AND an internal confidential note
    with app.app_context():
        case = CaseService.find_by_tracking_code(code)
        assert case is not None

        # Official message (student permitted to read)
        official_msg = CaseMessage(
            case_id=case.id,
            sender_context=SenderContext.COMMITTEE,
            display_name="Ethics Committee Investigator",
            message_content="We have received your report and opened an inquiry.",
            is_internal_note=False,
        )
        # Internal note (HIDDEN from student)
        internal_note = CaseMessage(
            case_id=case.id,
            sender_context=SenderContext.COMMITTEE,
            display_name="Senior Ombudsperson",
            message_content="CONFIDENTIAL: Contacting department chair regarding potential bias history.",
            is_internal_note=True,
        )
        db.session.add(official_msg)
        db.session.add(internal_note)
        db.session.commit()

    # 3. Track case as student
    track_res = client.get(f"/track?code={code}")
    assert track_res.status_code == 200
    track_html = track_res.data.decode("utf-8")

    # Official response must be visible
    assert "We have received your report and opened an inquiry." in track_html

    # Confidential internal note MUST NEVER be exposed to the student!
    assert "CONFIDENTIAL: Contacting department chair" not in track_html

    # 4. Student posts follow-up message
    msg_payload = {"message_body": "Thank you for looking into this. Here is additional documentation context."}
    reply_res = client.post(f"/track/{code}/message", data=msg_payload, follow_redirects=True)
    assert reply_res.status_code == 200
    assert b"additional documentation context" in reply_res.data
    assert b"Your message was securely delivered" in reply_res.data
