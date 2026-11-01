"""Chart data. pandas / numpy crunch the ball log into small JSON payloads for the React charts."""
import math

import numpy as np
import pandas as pd

from app.services.match_service import summaries, team
from app.utils.cricket import phase_bounds


def sanitize(o):
    if isinstance(o, dict):
        return {str(k): sanitize(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [sanitize(v) for v in o]
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, (float, np.floating)):
        return None if math.isnan(o) or math.isinf(o) else round(float(o), 2)
    if isinstance(o, np.bool_):
        return bool(o)
    return o


def _frame(balls: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(balls)
    if not df.empty:
        df["legal"] = df["legal"].astype(int)
        df["is_wicket"] = df["is_wicket"].astype(int)
    return df


def _worm(df: pd.DataFrame, short: str) -> dict:
    if df.empty:
        return {"team": short, "points": [{"x": 0, "y": 0}], "wickets": []}
    g = df.groupby("over_no").agg(total=("total", "sum"), legal=("legal", "sum")).sort_index()
    xs, ys = (g["legal"].cumsum() / 6).round(2), g["total"].cumsum()
    w = df[df["is_wicket"] == 1]
    return {"team": short,
            "points": [{"x": 0, "y": 0}] + [{"x": x, "y": y} for x, y in zip(xs, ys)],
            "wickets": [{"x": round(a / 6, 2), "y": b} for a, b in zip(w["legal_after"], w["cum_runs"])]}


def _manhattan(frames: dict, overs: int) -> list[dict]:
    rows = {o: {"over": o + 1} for o in range(overs)}
    last = 0
    for k, df in frames.items():
        if df.empty:
            continue
        g = df.groupby("over_no").agg(runs=("total", "sum"), w=("is_wicket", "sum"))
        for o, r in g.iterrows():
            rows[o][f"inn{k}"], rows[o][f"w{k}"] = r["runs"], r["w"]
        last = max(last, int(g.index.max()) + 1)
    return [rows[o] for o in range(last)]


def _runrate(frames: dict, overs: int, target: int | None) -> list[dict]:
    rows: dict[int, dict] = {}
    for k, df in frames.items():
        if df.empty:
            continue
        g = df.groupby("over_no").agg(runs=("total", "sum"), legal=("legal", "sum")).sort_index()
        cr, cl = g["runs"].cumsum(), g["legal"].cumsum()
        crr = cr * 6 / cl
        left = overs * 6 - cl
        need = np.maximum((target or 0) - cr, 0)
        rrr = np.where(left > 0, need * 6 / np.maximum(left, 1), np.nan)
        for i, o in enumerate(g.index):
            row = rows.setdefault(int(o), {"over": int(o) + 1})
            row[f"crr{k}"] = crr.iloc[i]
            if k == 2 and target:
                row["rrr"] = rrr[i]
    return [rows[o] for o in sorted(rows)]


def _phases(frames: dict, overs: int) -> list[dict]:
    pp, death = phase_bounds(overs)
    labels = [("Powerplay", f"1-{pp}"), ("Middle", f"{pp + 1}-{death}"), ("Death", f"{death + 1}-{overs}")]
    out = [{"phase": n, "range": r} for n, r in labels]
    for k, df in frames.items():
        runs, wk = [0, 0, 0], [0, 0, 0]
        if not df.empty:
            idx = np.select([df["over_no"] < pp, df["over_no"] < death], [0, 1], 2)
            for i, v in df.groupby(idx)["total"].sum().items():
                runs[int(i)] = v
            for i, v in df.groupby(idx)["is_wicket"].sum().items():
                wk[int(i)] = v
        for i, row in enumerate(out):
            row[f"inn{k}"], row[f"w{k}"] = runs[i], wk[i]
    return out


RUN_ORDER = ["Dots", "Singles", "Twos", "Threes", "Fours", "Sixes", "Byes / Leg byes", "Wides / No balls", "Wickets"]


def _runtypes(df: pd.DataFrame) -> list[dict]:
    if df.empty:
        return []
    conds = [df["is_wicket"] == 1, df["extra_type"].isin(["wide", "noball"]), df["extra_type"].isin(["bye", "legbye"]),
             df["runs_bat"] == 0, df["runs_bat"] == 1, df["runs_bat"] == 2, df["runs_bat"] == 3,
             df["runs_bat"] == 4, df["runs_bat"] == 6]
    names = ["Wickets", "Wides / No balls", "Byes / Leg byes", "Dots", "Singles", "Twos", "Threes", "Fours", "Sixes"]
    counts = pd.Series(np.select(conds, names, "Other")).value_counts()
    return [{"name": n, "value": counts[n]} for n in RUN_ORDER + ["Other"] if n in counts.index]


def build_analytics(match) -> dict:
    sums = summaries(match)
    frames = {i.number: _frame(s["balls"]) for i, s in sums}
    target = sums[0][1]["runs"] + 1 if sums[0][1]["complete"] else None
    out = {"meta": {"overs": match.overs, "target": target,
                    "current_innings": sums[-1][0].number,
                    "teams": {i.number: team(match, i.batting_side) for i, _ in sums}},
           "worm": {}, "batters": {}, "bowlers": {}, "partnerships": {}, "runtypes": {}}
    for inn, s in sums:
        k = str(inn.number)
        out["worm"][k] = _worm(frames[inn.number], team(match, inn.batting_side)["short"])
        out["batters"][k] = [b for b in s["batters"] if b["balls"] or b["at_crease"]]
        out["bowlers"][k] = s["bowlers"]
        out["partnerships"][k] = s["partnerships"]
        out["runtypes"][k] = _runtypes(frames[inn.number])
    out["manhattan"] = _manhattan(frames, match.overs)
    out["runrate"] = _runrate(frames, match.overs, target)
    out["phases"] = _phases(frames, match.overs)
    return sanitize(out)
