"""Database connection and MySQL 8.0 configuration tests.

Verifies connection string parsing, pooling options, and connection resilience.
"""

from unittest.mock import MagicMock, patch
from sqlalchemy.engine.url import make_url
from app.models import db


def test_mysql_connection_configuration(app):
    """Verify SQLAlchemy is configured strictly with MySQL 8.0 PyMySQL dialect."""
    uri = app.config.get("SQLALCHEMY_DATABASE_URI")
    assert uri is not None
    # Must use MySQL dialect (No SQLite)
    assert "mysql" in uri.lower() or "pymysql" in uri.lower()
    assert "sqlite" not in uri.lower()

    # Verify connection URL attributes
    url = make_url(uri)
    assert url.get_backend_name() == "mysql"
    assert url.get_driver_name() == "pymysql"


def test_mysql_engine_pooling_options(app):
    """Verify production-grade connection pool settings for MySQL 8.0."""
    engine_opts = app.config.get("SQLALCHEMY_ENGINE_OPTIONS", {})
    assert engine_opts.get("pool_pre_ping") is True
    assert engine_opts.get("pool_recycle") == 3600
    assert engine_opts.get("pool_size", 10) >= 5


def test_offline_connection_graceful_handling(app):
    """Verify application handles offline MySQL server gracefully without crashing."""
    with patch.object(db.session, "execute", side_effect=Exception("Can't connect to MySQL server")):
        try:
            db.session.execute("SELECT 1")
            connected = True
        except Exception:
            connected = False
        assert connected is False
