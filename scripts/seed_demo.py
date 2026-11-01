"""Plays a full random demo match through the real API (so you can see every page filled with data).

    python scripts/seed_demo.py                 # 5-over match against http://localhost:8000
    python scripts/seed_demo.py --overs 20 --api http://192.168.1.10:8000
"""
import argparse
import random

import httpx

p = argparse.ArgumentParser()
p.add_argument("--api", default="http://localhost:8000")
p.add_argument("--pin", default="1234")
p.add_argument("--overs", type=int, default=5)
args = p.parse_args()
H = {"X-Pin": args.pin}
c = httpx.Client(base_url=f"{args.api}/api", headers=H, timeout=20)

names_a = ["Rohan", "Arjun", "Vikram", "Sayan", "Imran", "Dev", "Kunal", "Amit", "Ravi", "Tanmoy", "Suman"]
names_b = ["Jack", "Liam", "Noah", "Ethan", "Mason", "Lucas", "Owen", "Leo", "Finn", "Cole", "Ryan"]
res = c.post("/matches", json={
    "title": "Demo T20", "venue": "Eden Gardens (demo)", "team_a_name": "Kolkata Kings", "team_a_short": "KOL",
    "team_b_name": "Durgapur Dynamos", "team_b_short": "DUR", "overs": args.overs, "players_per_side": 11,
    "batting_first": "A", "team_a_players": names_a, "team_b_players": names_b})
res.raise_for_status()
mid = res.json()["id"]
state = c.get(f"/matches/{mid}/state").json()
random.seed(7)


def pick_outcome(free_hit):
    r = random.random()
    if r < 0.03:
        return {"extra_type": "wide", "extra_runs": 1}
    if r < 0.05:
        return {"extra_type": "noball", "extra_runs": 1, "runs_bat": random.choice([0, 1, 4])}
    if r < 0.09 and not free_hit:
        return {"is_wicket": True, "wicket_type": random.choice(["bowled", "caught", "lbw"]), "fielder": "Fielder"}
    return {"runs_bat": random.choices([0, 1, 2, 3, 4, 6], [34, 30, 8, 1, 13, 7])[0]}


for _ in range(2):
    inn = state["innings"][-1]
    bowlers_ids = [pl["id"] for pl in state["players"][inn["bowling_side"]]][-5:]
    while not inn["complete"]:
        n, fresh = inn["next"], list(inn["yet_to_bat"])
        striker = n["striker_id"] or fresh.pop(0)
        non = n["non_striker_id"] or fresh.pop(0)
        bowler = n["bowler_id"] or next(b for b in bowlers_ids if b != inn["last_over_bowler_id"])
        if n["bowler_id"] is None and inn["balls"]:
            bowlers_ids = bowlers_ids[1:] + bowlers_ids[:1]
            bowler = next(b for b in bowlers_ids if b != inn["last_over_bowler_id"])
        body = {"striker_id": striker, "non_striker_id": non, "bowler_id": bowler, **pick_outcome(inn["free_hit"])}
        r = c.post(f"/matches/{mid}/innings/{inn['number']}/balls", json=body)
        if r.status_code != 200:
            raise SystemExit(f"{r.status_code}: {r.text}")
        state = r.json()
        inn = state["innings"][-1]
    print(f"Innings {inn['number']}: {inn['runs']}/{inn['wickets']} in {inn['overs']} ov")
    if state["phase"] == "innings_break":
        state = c.post(f"/matches/{mid}/innings/2/start").json()

print("Result:", state["result"])
print(f"Match id {mid}  ->  open  http://localhost:5173/scoreboard/{mid}   and   /charts/{mid}")
