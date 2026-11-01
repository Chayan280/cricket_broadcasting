"""Pure cricket rules engine: no DB, no web. Replays balls -> full innings summary."""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass

from app.utils.cricket import overs_str

EXTRA_TYPES = ("none", "wide", "noball", "bye", "legbye")
WICKET_TYPES = ("bowled", "caught", "lbw", "run_out", "stumped", "hit_wicket", "obstructing", "retired_out")
BOWLER_WICKETS = {"bowled", "caught", "lbw", "stumped", "hit_wicket"}
STRIKER_ONLY = BOWLER_WICKETS
FREE_HIT_OK = {"run_out", "obstructing"}
WIDE_OK = {"stumped", "run_out", "hit_wicket", "obstructing"}


class ScoringError(ValueError):
    pass


@dataclass
class Ball:
    id: int
    seq: int
    striker_id: int
    non_striker_id: int
    bowler_id: int
    runs_bat: int = 0
    extra_type: str = "none"
    extra_runs: int = 0
    is_wicket: bool = False
    wicket_type: str | None = None
    player_out_id: int | None = None
    fielder: str | None = None


# ---------- per-ball helpers ----------
def is_legal(b: Ball) -> bool:
    return b.extra_type not in ("wide", "noball")


def total_runs(b: Ball) -> int:
    return b.runs_bat + b.extra_runs


def bowler_runs(b: Ball) -> int:
    return b.runs_bat + (b.extra_runs if b.extra_type in ("wide", "noball") else 0)


def runs_run(b: Ball) -> int:
    """Runs physically run by the batters (decides strike rotation)."""
    penalty = 1 if b.extra_type in ("wide", "noball") else 0
    return b.runs_bat + b.extra_runs - penalty


def ball_label(b: Ball) -> tuple[str, str]:
    if b.extra_type == "wide":
        label, kind = ("Wd" if b.extra_runs == 1 else f"Wd+{b.extra_runs - 1}"), "wide"
    elif b.extra_type == "noball":
        label, kind = ("Nb" if b.runs_bat == 0 else f"Nb+{b.runs_bat}"), "noball"
    elif b.extra_type == "bye":
        label, kind = f"B{b.extra_runs}", "bye"
    elif b.extra_type == "legbye":
        label, kind = f"Lb{b.extra_runs}", "legbye"
    elif b.runs_bat == 0:
        label, kind = "•", "dot"
    else:
        label = str(b.runs_bat)
        kind = "four" if b.runs_bat == 4 else "six" if b.runs_bat == 6 else "run"
    if b.is_wicket:
        label = "W" if label == "•" else f"{label}W"
        kind = "wicket"
    return label, kind


def _dismissal(b: Ball, bowler: str) -> str:
    t, f = b.wicket_type, (b.fielder or "").strip()
    if t == "bowled":
        return f"b {bowler}"
    if t == "caught":
        return f"c & b {bowler}" if f == bowler else f"c {f or 'fielder'} b {bowler}"
    if t == "lbw":
        return f"lbw b {bowler}"
    if t == "stumped":
        return f"st {f or 'wk'} b {bowler}"
    if t == "run_out":
        return f"run out ({f})" if f else "run out"
    if t == "hit_wicket":
        return f"hit wicket b {bowler}"
    if t == "obstructing":
        return "obstructing the field"
    return "retired out"


# ---------- validation ----------
def validate_fields(b: Ball) -> None:
    if b.extra_type not in EXTRA_TYPES:
        raise ScoringError("Unknown extra type")
    if not 0 <= b.runs_bat <= 7:
        raise ScoringError("Bat runs must be 0-7")
    if not 0 <= b.extra_runs <= 12:
        raise ScoringError("Extra runs must be 0-12")
    if b.striker_id == b.non_striker_id:
        raise ScoringError("Striker and non-striker must be different players")
    if b.extra_type == "none" and b.extra_runs:
        raise ScoringError("Extra runs need an extra type")
    if b.extra_type in ("wide", "noball") and b.extra_runs < 1:
        raise ScoringError("Wide / no-ball carries at least 1 penalty run")
    if b.extra_type == "wide" and b.runs_bat:
        raise ScoringError("A wide cannot have bat runs")
    if b.extra_type in ("bye", "legbye") and (b.extra_runs < 1 or b.runs_bat):
        raise ScoringError("Byes / leg byes need runs and no bat runs")
    if b.is_wicket:
        if b.wicket_type not in WICKET_TYPES:
            raise ScoringError("Pick a valid wicket type")
        out = b.player_out_id or b.striker_id
        if out not in (b.striker_id, b.non_striker_id):
            raise ScoringError("Dismissed batter must be at the crease")
        if b.wicket_type in STRIKER_ONLY and out != b.striker_id:
            raise ScoringError(f"{b.wicket_type} can only dismiss the striker")
        if b.extra_type == "wide" and b.wicket_type not in WIDE_OK:
            raise ScoringError(f"Cannot be {b.wicket_type} off a wide")
        if b.extra_type == "noball" and b.wicket_type not in FREE_HIT_OK:
            raise ScoringError("Only run out / obstructing is possible off a no-ball")


def validate_context(summary: dict, b: Ball, batting_ids, bowling_ids) -> None:
    if summary["complete"]:
        raise ScoringError("This innings is already complete")
    for pid in (b.striker_id, b.non_striker_id):
        if pid not in batting_ids:
            raise ScoringError("Batter must belong to the batting team")
        if pid in summary["out_ids"]:
            raise ScoringError("That batter is already out")
    if b.bowler_id not in bowling_ids:
        raise ScoringError("Bowler must belong to the bowling team")
    if summary["needs_new_over"] and b.bowler_id == summary["last_over_bowler_id"]:
        raise ScoringError("Same bowler cannot bowl two overs in a row")
    if summary["free_hit"] and b.is_wicket and b.wicket_type not in FREE_HIT_OK:
        raise ScoringError("Free hit: only run out / obstructing is allowed")


# ---------- replay ----------
def _new_bat(pid: int, pool: dict) -> dict:
    return {"id": pid, "name": pool.get(pid, f"#{pid}"), "runs": 0, "balls": 0, "fours": 0,
            "sixes": 0, "out": False, "dismissal": ""}


def _new_bowl(pid: int, pool: dict) -> dict:
    return {"id": pid, "name": pool.get(pid, f"#{pid}"), "balls": 0, "runs": 0, "wickets": 0,
            "wides": 0, "noballs": 0, "dots": 0, "maidens": 0}


def replay(balls: list[Ball], batting: dict, bowling: dict, max_overs: int, max_wickets: int,
           target: int | None = None, closed: bool = False) -> dict:
    balls = sorted(balls, key=lambda b: b.seq)
    legal = runs = wkts = 0
    extras = {"wide": 0, "noball": 0, "bye": 0, "legbye": 0}
    bat: dict[int, dict] = {}
    bowl: dict[int, dict] = {}
    fow, partnerships, rows = [], [], []
    ov_runs, ov_legal = defaultdict(int), defaultdict(int)
    out_ids: list[int] = []
    striker = non_striker = last_bowler = None
    free_hit = False
    part = None

    for b in balls:
        over_no, pos = legal // 6, legal % 6 + 1
        bs = bat.setdefault(b.striker_id, _new_bat(b.striker_id, batting))
        bat.setdefault(b.non_striker_id, _new_bat(b.non_striker_id, batting))
        bw = bowl.setdefault(b.bowler_id, _new_bowl(b.bowler_id, bowling))
        ok, br = is_legal(b), bowler_runs(b)
        label, kind = ball_label(b)
        fh_before = free_hit

        bs["runs"] += b.runs_bat
        if b.extra_type != "wide":
            bs["balls"] += 1
        bs["fours"] += b.runs_bat == 4
        bs["sixes"] += b.runs_bat == 6
        bw["runs"] += br
        if b.extra_type == "wide":
            bw["wides"] += b.extra_runs
        if b.extra_type == "noball":
            bw["noballs"] += 1
        if b.extra_type in extras:
            extras[b.extra_type] += b.extra_runs
        if ok:
            legal += 1
            bw["balls"] += 1
            ov_legal[(b.bowler_id, over_no)] += 1
            bw["dots"] += br == 0
        ov_runs[(b.bowler_id, over_no)] += br
        runs += total_runs(b)

        if part is None:
            part = {"wicket": wkts + 1, "a": b.striker_id, "b": b.non_striker_id, "runs": 0, "balls": 0,
                    "a_runs": 0, "b_runs": 0}
        part["runs"] += total_runs(b)
        part["balls"] += b.extra_type != "wide"
        part["a_runs" if b.striker_id == part["a"] else "b_runs"] += b.runs_bat

        out_id = None
        if b.is_wicket:
            out_id = b.player_out_id or b.striker_id
            wkts += 1
            out_ids.append(out_id)
            ob = bat.setdefault(out_id, _new_bat(out_id, batting))
            ob["out"], ob["dismissal"] = True, _dismissal(b, bw["name"])
            bw["wickets"] += b.wicket_type in BOWLER_WICKETS
            fow.append({"wicket": wkts, "runs": runs, "player_id": out_id, "player": ob["name"],
                        "over": overs_str(legal)})
            partnerships.append(part)
            part = None

        cs, cn = b.striker_id, b.non_striker_id
        if runs_run(b) % 2 == 1:
            cs, cn = cn, cs
        if ok and legal % 6 == 0:
            cs, cn = cn, cs
        if out_id is not None:
            cs = None if cs == out_id else cs
            cn = None if cn == out_id else cn
        striker, non_striker, last_bowler = cs, cn, b.bowler_id

        rows.append({
            "id": b.id, "seq": b.seq, "over_no": over_no, "ball_in_over": pos, "over_label": f"{over_no}.{pos}",
            "legal": ok, "runs_bat": b.runs_bat, "extra_type": b.extra_type, "extra_runs": b.extra_runs,
            "total": total_runs(b), "bowler_runs": br, "is_wicket": b.is_wicket, "wicket_type": b.wicket_type,
            "player_out_id": out_id, "fielder": b.fielder, "striker_id": b.striker_id,
            "non_striker_id": b.non_striker_id, "bowler_id": b.bowler_id, "striker": bs["name"],
            "bowler": bw["name"], "label": label, "kind": kind, "free_hit": fh_before,
            "cum_runs": runs, "cum_wkts": wkts, "legal_after": legal,
        })
        free_hit = b.extra_type == "noball" or (free_hit and b.extra_type == "wide")

    if part and part["balls"] > 0:
        part["active"] = True
        partnerships.append(part)
    for p in partnerships:
        p["pair"] = f"{batting.get(p['a'], '?')} & {batting.get(p['b'], '?')}"

    for (bid, ov), n in ov_legal.items():
        if n == 6 and ov_runs[(bid, ov)] == 0:
            bowl[bid]["maidens"] += 1

    all_out = wkts >= max_wickets
    overs_done = legal >= max_overs * 6
    chased = target is not None and runs >= target
    complete = all_out or overs_done or chased or closed
    end_reason = ("all_out" if all_out else "target_chased" if chased else "overs_complete" if overs_done
                  else "declared" if closed else None)
    needs_new_over = legal > 0 and legal % 6 == 0 and not complete

    for pid, s in bat.items():
        s["sr"] = round(s["runs"] * 100 / s["balls"], 1) if s["balls"] else 0.0
        s["at_crease"] = (not s["out"]) and pid in (striker, non_striker)
        s["on_strike"] = pid == striker and not s["out"]
    for s in bowl.values():
        s["overs"] = overs_str(s["balls"])
        s["economy"] = round(s["runs"] * 6 / s["balls"], 2) if s["balls"] else 0.0

    crr = round(runs * 6 / legal, 2) if legal else 0.0
    projected = round(runs + crr * (max_overs * 6 - legal) / 6) if legal >= 12 else None  # needs 2 overs of data
    last_ov = rows[-1]["over_no"] if rows else None
    cur = [r for r in rows if r["over_no"] == last_ov]

    return {
        "runs": runs, "wickets": wkts, "legal_balls": legal, "overs": overs_str(legal),
        "complete": complete, "end_reason": end_reason, "max_wickets": max_wickets,
        "extras": {**extras, "total": sum(extras.values())},
        "batters": list(bat.values()), "bowlers": list(bowl.values()),
        "fow": fow, "partnerships": partnerships, "balls": rows,
        "this_over": [{"label": r["label"], "kind": r["kind"]} for r in cur],
        "this_over_runs": sum(r["total"] for r in cur),
        "crr": crr, "projected": projected, "free_hit": free_hit and not complete,
        "needs_new_over": needs_new_over, "last_over_bowler_id": last_bowler, "out_ids": out_ids,
        "yet_to_bat": [pid for pid in batting if pid not in bat],
        "next": {
            "striker_id": None if complete else striker,
            "non_striker_id": None if complete else non_striker,
            "bowler_id": None if complete or needs_new_over else last_bowler,
        },
    }
