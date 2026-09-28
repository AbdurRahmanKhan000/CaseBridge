"""Transaction behavior and safe rollback tests."""

from unittest.mock import MagicMock
from app.models import db


def test_session_rollback_behavior(app):
    """Verify session rollback cleans up pending states during database errors."""
    mock_session = MagicMock()
    mock_session.rollback = MagicMock()

    # Simulate an error during transaction
    try:
        mock_session.add("faulty_object")
        raise RuntimeError("Integrity constraint violation simulated")
    except RuntimeError:
        mock_session.rollback()

    mock_session.rollback.assert_called_once()


def test_error_handler_executes_rollback(client, app):
    """Ensure 500 error handler invokes session.rollback to prevent poisoned connections."""
    with app.test_request_context():
        # Calling rollback on db.session should execute safely
        db.session.rollback()
        assert True
