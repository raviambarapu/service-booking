from datetime import datetime, timedelta, timezone

from conftest import auth


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


# ---------- auth ----------
def test_register_and_login(client):
    r = client.post("/api/auth/register", json={"name": "Ravi", "email": "r@test.com", "password": "Password@1"})
    assert r.status_code == 201 and r.json()["role"] == "user"
    r = client.post("/api/auth/login", json={"email": "r@test.com", "password": "Password@1"})
    assert r.status_code == 200 and "access_token" in r.json()


def test_register_duplicate_email(client):
    body = {"name": "Ravi", "email": "dup@test.com", "password": "Password@1"}
    assert client.post("/api/auth/register", json=body).status_code == 201
    assert client.post("/api/auth/register", json=body).status_code == 409


def test_register_validation(client):
    r = client.post("/api/auth/register", json={"name": "R", "email": "bad", "password": "123"})
    assert r.status_code == 422


def test_login_wrong_password(client, user_headers):
    r = client.post("/api/auth/login", json={"email": "ravi@test.com", "password": "wrong-pass"})
    assert r.status_code == 401


def test_protected_route_needs_token(client):
    assert client.get("/api/slots").status_code == 401
    assert client.get("/api/slots", headers=auth("garbage")).status_code == 401


# ---------- role checks ----------
def test_user_cannot_create_slot(client, user_headers):
    start = datetime.now(timezone.utc) + timedelta(days=1)
    r = client.post("/api/slots", json={"start_time": start.isoformat(),
                                        "end_time": (start + timedelta(hours=1)).isoformat()}, headers=user_headers)
    assert r.status_code == 403


def test_admin_slot_validation(client, admin_headers):
    start = datetime.now(timezone.utc) + timedelta(days=1)
    r = client.post("/api/slots", json={"start_time": start.isoformat(),
                                        "end_time": (start - timedelta(hours=1)).isoformat()}, headers=admin_headers)
    assert r.status_code == 422
    past = datetime.now(timezone.utc) - timedelta(days=1)
    r = client.post("/api/slots", json={"start_time": past.isoformat(),
                                        "end_time": (past + timedelta(hours=1)).isoformat()}, headers=admin_headers)
    assert r.status_code == 400


def test_user_cannot_see_all_bookings(client, user_headers, admin_headers):
    assert client.get("/api/bookings", headers=user_headers).status_code == 403
    assert client.get("/api/bookings", headers=admin_headers).status_code == 200


# ---------- booking flow ----------
def test_book_slot_and_history(client, user_headers, make_slot):
    slot = make_slot()
    r = client.post("/api/bookings", json={"slot_id": slot["id"], "notes": "Checkup"}, headers=user_headers)
    assert r.status_code == 201 and r.json()["status"] == "booked"
    my = client.get("/api/bookings/my", headers=user_headers).json()
    assert len(my) == 1 and my[0]["slot"]["is_available"] is False
    available = client.get("/api/slots?available_only=true", headers=user_headers).json()
    assert available == []


def test_double_booking_blocked(client, user_headers, make_slot):
    slot = make_slot()
    assert client.post("/api/bookings", json={"slot_id": slot["id"]}, headers=user_headers).status_code == 201
    client.post("/api/auth/register", json={"name": "Other", "email": "o@test.com", "password": "Password@1"})
    tok = client.post("/api/auth/login", json={"email": "o@test.com", "password": "Password@1"}).json()["access_token"]
    assert client.post("/api/bookings", json={"slot_id": slot["id"]}, headers=auth(tok)).status_code == 409


def test_reschedule(client, user_headers, make_slot):
    s1, s2 = make_slot(24), make_slot(48)
    b = client.post("/api/bookings", json={"slot_id": s1["id"]}, headers=user_headers).json()
    r = client.put(f"/api/bookings/{b['id']}/reschedule", json={"slot_id": s2["id"]}, headers=user_headers)
    assert r.status_code == 200 and r.json()["slot"]["id"] == s2["id"]
    slots = {s["id"]: s["is_available"] for s in client.get("/api/slots", headers=user_headers).json()}
    assert slots[s1["id"]] is True and slots[s2["id"]] is False


def test_cancel_frees_slot_and_blocks_other_users(client, user_headers, make_slot):
    slot = make_slot()
    b = client.post("/api/bookings", json={"slot_id": slot["id"]}, headers=user_headers).json()
    client.post("/api/auth/register", json={"name": "Other", "email": "o@test.com", "password": "Password@1"})
    tok = client.post("/api/auth/login", json={"email": "o@test.com", "password": "Password@1"}).json()["access_token"]
    assert client.delete(f"/api/bookings/{b['id']}", headers=auth(tok)).status_code == 403
    r = client.delete(f"/api/bookings/{b['id']}", headers=user_headers)
    assert r.status_code == 200 and r.json()["status"] == "cancelled"
    # slot can be booked again
    assert client.post("/api/bookings", json={"slot_id": slot["id"]}, headers=user_headers).status_code == 201


def test_admin_can_complete_booking_and_cannot_delete_booked_slot(client, user_headers, admin_headers, make_slot):
    slot = make_slot()
    b = client.post("/api/bookings", json={"slot_id": slot["id"]}, headers=user_headers).json()
    assert client.delete(f"/api/slots/{slot['id']}", headers=admin_headers).status_code == 409
    r = client.patch(f"/api/bookings/{b['id']}/status", json={"status": "completed"}, headers=admin_headers)
    assert r.status_code == 200 and r.json()["status"] == "completed"
