import os

os.environ["DATABASE_URL"] = "sqlite:///./test_booking.db"
os.environ["ADMIN_EMAIL"] = "admin@test.com"
os.environ["ADMIN_PASSWORD"] = "Admin@12345"

from datetime import datetime, timedelta, timezone  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import seed_admin  # noqa: E402


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    seed_admin()
    with TestClient(app) as c:
        yield c


def auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_headers(client):
    r = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "Admin@12345"})
    return auth(r.json()["access_token"])


@pytest.fixture()
def user_headers(client):
    client.post("/api/auth/register", json={"name": "Ravi", "email": "ravi@test.com", "password": "Password@1"})
    r = client.post("/api/auth/login", json={"email": "ravi@test.com", "password": "Password@1"})
    return auth(r.json()["access_token"])


@pytest.fixture()
def make_slot(client, admin_headers):
    def _make(hours_ahead=24):
        start = datetime.now(timezone.utc) + timedelta(hours=hours_ahead)
        end = start + timedelta(minutes=30)
        r = client.post("/api/slots", json={"start_time": start.isoformat(), "end_time": end.isoformat()},
                        headers=admin_headers)
        assert r.status_code == 201, r.text
        return r.json()
    return _make
