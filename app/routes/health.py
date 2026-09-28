"""CaseBridge Health and Readiness Endpoints."""

import datetime
from flask import Blueprint, jsonify
from app.models import db

health_bp = Blueprint("health", __name__)


@health_bp.route("/health", methods=["GET"])
def health_check():
    """
    Standard application healthcheck endpoint for load balancers,
    Docker healthcheck, and container orchestration probes.
    """
    db_status = "connected"
    try:
        # Perform lightweight non-blocking query to confirm database responsiveness
        db.session.execute(db.text("SELECT 1"))
    except Exception as e:
        db_status = f"unreachable: {str(e)[:50]}"

    status_code = 200 if db_status == "connected" else 503
    return jsonify({
        "status": "healthy" if status_code == 200 else "degraded",
        "service": "CaseBridge",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "database": db_status,
        "environment": "production" if not db.engine.url.database == ":memory:" else "testing"
    }), status_code
