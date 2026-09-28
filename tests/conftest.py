"""Pytest configuration and fixtures for CaseBridge.

Target database: MySQL 8.0 (No SQLite).
"""

import pytest
from app import create_app
from config.settings import TestingConfig


@pytest.fixture(scope="session")
def app():
    """Create and configure a clean testing instance of CaseBridge."""
    test_app = create_app(TestingConfig)
    return test_app


@pytest.fixture
def client(app):
    """Test HTTP client for dispatching requests."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """CLI test runner."""
    return app.test_cli_runner()
