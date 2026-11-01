import os

import pytest
from fastapi.testclient import TestClient

from app.main import app

H = {"X-Pin": "1234"}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
    if os.path.exists("test_cricket.db"):
        os.remove("test_cricket.db")


def make(client, overs=2):
    body = {"title": "T", "team_a_name": "Alpha", "team_a_short": "ALP", "team_b_name": "Beta",
            "team_b_short": "BET", "overs": overs, "players_per_side": 3, "batting_first": "A",
            "team_a_players": ["a1", "a2", "a3"], "team_b_players": ["b1", "b2", "b3"]}
    r = client.post("/api/matches", json=body, headers=H)
    assert r.status_code == 200, r.text
    return r.json()["id"]


def ball(client, mid, inn, s, n, b, **kw):
    return client.post(f"/api/matches/{mid}/innings/{inn}/balls", json={"striker_id": s, "non_striker_id": n,
                                                                         "bowler_id": b, **kw}, headers=H)


def test_auth_required(client):
    assert client.post("/api/matches", json={}).status_code == 401
    assert client.post("/api/auth/login", json={"pin": "bad", "role": "admin"}).status_code == 401
    assert client.post("/api/auth/login", json={"pin": "5678", "role": "commentator"}).status_code == 200
    assert client.post("/api/auth/login", json={"pin": "5678", "role": "admin"}).status_code == 401


def test_full_match_flow(client):
    mid = make(client)
    st = client.get(f"/api/matches/{mid}/state").json()
    a = [p["id"] for p in st["players"]["A"]]
    b = [p["id"] for p in st["players"]["B"]]
    r = ball(client, mid, 1, a[0], a[1], b[0], runs_bat=4)
    assert r.status_code == 200 and r.json()["innings"][0]["runs"] == 4
    assert ball(client, mid, 1, a[0], a[1], b[0], is_wicket=True, wicket_type="bowled").status_code == 200
    ballid = client.get(f"/api/matches/{mid}/state").json()["innings"][0]["balls"][-1]["id"]
    assert client.put(f"/api/balls/{ballid}", json={"is_wicket": False}, headers=H).json()["innings"][0]["wickets"] == 0
    assert client.delete(f"/api/matches/{mid}/balls/last", headers=H).json()["innings"][0]["runs"] == 4
    an = client.get(f"/api/matches/{mid}/analytics").json()
    assert an["worm"]["1"]["points"][-1]["y"] == 4 and an["phases"][0]["inn1"] == 4
    ov = client.post(f"/api/matches/{mid}/overlay", json={"chart": "worm", "visible": True},
                     headers={"X-Pin": "5678"})
    assert ov.status_code == 200 and client.get(f"/api/matches/{mid}/overlay").json()["chart"] == "worm"
    assert client.post(f"/api/matches/{mid}/overlay", json={"chart": "nope"}, headers=H).status_code == 422
    assert client.post(f"/api/matches/{mid}/innings/2/start", headers=H).status_code == 409


def test_innings_break_and_chase(client):
    mid = make(client, overs=1)
    st = client.get(f"/api/matches/{mid}/state").json()
    a = [p["id"] for p in st["players"]["A"]]
    b = [p["id"] for p in st["players"]["B"]]
    for _ in range(6):
        assert ball(client, mid, 1, a[0], a[1], b[0], runs_bat=1).status_code == 200
    # strike flips each run, then over-end flip: keep it simple using whoever the server suggests
    s = client.get(f"/api/matches/{mid}/state").json()
    assert s["phase"] == "innings_break" and s["target"] == 7
    assert client.post(f"/api/matches/{mid}/innings/2/start", headers=H).status_code == 200
    r = ball(client, mid, 2, b[0], b[1], a[0], runs_bat=6)
    assert r.status_code == 200
    r = ball(client, mid, 2, b[1], b[0], a[0], runs_bat=1)
    st = r.json()
    assert st["phase"] == "completed" and "Beta won" in st["result"]
    assert client.delete(f"/api/matches/{mid}", headers=H).status_code == 200


def test_websocket_broadcast(client):
    mid = make(client)
    st = client.get(f"/api/matches/{mid}/state").json()
    a = [p["id"] for p in st["players"]["A"]]
    b = [p["id"] for p in st["players"]["B"]]
    with client.websocket_connect(f"/ws/matches/{mid}") as ws:
        ball(client, mid, 1, a[0], a[1], b[0], runs_bat=2)
        msg = ws.receive_json()
        assert msg["type"] == "state" and msg["data"]["innings"][0]["runs"] == 2
