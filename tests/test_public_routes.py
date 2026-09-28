"""Tests for public endpoints: navigation, submission, tracking."""


def test_public_pages_load(client):
    """Verify that all foundational public views return 200 OK."""
    endpoints = ["/", "/about", "/how-it-works", "/privacy", "/security", "/faq", "/submit", "/track"]
    for path in endpoints:
        res = client.get(path)
        assert res.status_code == 200, f"Path {path} returned status {res.status_code}"


def test_anonymous_submission_flow(client):
    """Test full cycle of submitting an anonymous case and tracking it."""
    # 1. Submit complaint
    payload = {
        "category_id": "1",
        "priority": "High",
        "subject": "Retaliatory Grading Dispute in Chemistry Lab",
        "narrative": "Detailed narrative describing laboratory grading unfairness following disagreement with graduate TA.",
        "location": "Chemistry Hall Room 304",
        "incident_date": "2026-09-15",
    }
    submit_res = client.post("/submit", data=payload, follow_redirects=True)
    assert submit_res.status_code == 200
    assert b"CB-" in submit_res.data
    assert b"Private Tracking Code" in submit_res.data

    # Extract code from response
    html = submit_res.data.decode("utf-8")
    import re
    match = re.search(r"CB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}", html)
    assert match is not None
    code = match.group(0)

    # 2. Track the case using code
    track_res = client.get(f"/track?code={code}")
    assert track_res.status_code == 200
    assert b"Retaliatory Grading Dispute" in track_res.data
    assert b"High Priority" in track_res.data
    assert b"Received" in track_res.data

    # 3. Post a student message
    msg_res = client.post(
        f"/track/{code}/message",
        data={"message_body": "Here is additional context about the lab assignment."},
        follow_redirects=True,
    )
    assert msg_res.status_code == 200
    assert b"additional context about the lab assignment" in msg_res.data
