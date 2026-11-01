"""DB <-> engine glue: create matches, record balls, build the live state JSON."""
import time

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models import Delivery, Innings, Match, Player
from app.schemas.match import MatchCreate
from app.services.errors import ServiceError
from app.services.scoring_engine import (Ball, ScoringError, replay, validate_context, validate_fields)

BALL_FIELDS = ("striker_id", "non_striker_id", "bowler_id", "runs_bat", "extra_type", "extra_runs",
               "is_wicket", "wicket_type", "player_out_id", "fielder")


def other(side: str) -> str:
    return "B" if side == "A" else "A"


def get_match(db: Session, match_id: int) -> Match:
    m = db.get(Match, match_id)
    if not m:
        raise ServiceError(404, "Match not found")
    return m


def team(match: Match, side: str) -> dict:
    return ({"name": match.team_a_name, "short": match.team_a_short} if side == "A"
            else {"name": match.team_b_name, "short": match.team_b_short})


def roster(match: Match, side: str) -> dict[int, str]:
    return {p.id: p.name for p in match.players if p.side == side}


def to_ball(d: Delivery) -> Ball:
    return Ball(d.id, d.seq, d.striker_id, d.non_striker_id, d.bowler_id, d.runs_bat, d.extra_type,
                d.extra_runs, d.is_wicket, d.wicket_type, d.player_out_id, d.fielder)


def summarize(match: Match, inn: Innings, target: int | None) -> dict:
    batting, bowling = roster(match, inn.batting_side), roster(match, other(inn.batting_side))
    max_w = max(1, min(match.players_per_side, len(batting)) - 1)
    return replay([to_ball(d) for d in inn.deliveries], batting, bowling, match.overs, max_w, target, inn.closed)


def summaries(match: Match) -> list[tuple[Innings, dict]]:
    out, target = [], None
    for inn in match.innings:
        s = summarize(match, inn, target)
        out.append((inn, s))
        if inn.number == 1:
            target = s["runs"] + 1
    return out


# ---------- state ----------
def build_state(db: Session, match_id: int) -> dict:
    match = get_match(db, match_id)
    sums = summaries(match)
    innings = [{"id": i.id, "number": i.number, "batting_side": i.batting_side,
                "bowling_side": other(i.batting_side), "batting_team": team(match, i.batting_side),
                "bowling_team": team(match, other(i.batting_side)), "closed": i.closed, **s}
               for i, s in sums]
    first = sums[0][1]
    target = first["runs"] + 1 if first["complete"] else None
    if len(sums) == 1:
        phase = "innings_break" if first["complete"] else "innings1"
    else:
        phase = "completed" if sums[1][1]["complete"] else "innings2"
    cur = innings[-1]
    chase, result = None, None
    if len(sums) == 2 or phase == "innings_break":
        s2 = sums[1][1] if len(sums) == 2 else None
        runs2 = s2["runs"] if s2 else 0
        legal2 = s2["legal_balls"] if s2 else 0
        left = match.overs * 6 - legal2
        need = max(0, target - runs2)
        chase = {"target": target, "needed": need, "balls_left": left,
                 "rrr": round(need * 6 / left, 2) if left > 0 else None}
    if phase == "completed":
        s2, i2 = sums[1][1], sums[1][0]
        chasing, defending = team(match, i2.batting_side), team(match, other(i2.batting_side))
        if s2["runs"] >= target:
            result = f"{chasing['name']} won by {s2['max_wickets'] - s2['wickets']} wickets"
        elif s2["runs"] == first["runs"]:
            result = "Match tied"
        else:
            result = f"{defending['name']} won by {first['runs'] - s2['runs']} runs"
    return {
        "stamp": int(time.time() * 1000),
        "match": {"id": match.id, "title": match.title, "venue": match.venue, "overs": match.overs,
                  "players_per_side": match.players_per_side, "batting_first": match.batting_first,
                  "teams": {"A": team(match, "A"), "B": team(match, "B")}},
        "players": {s: [{"id": p.id, "name": p.name} for p in match.players if p.side == s] for s in "AB"},
        "phase": phase, "result": result, "target": target, "chase": chase,
        "current_innings": cur["number"], "innings": innings,
    }


def list_matches(db: Session) -> list[dict]:
    rows = []
    for m in db.scalars(select(Match).order_by(Match.id.desc())):
        lines = [f"{team(m, i.batting_side)['short']} {s['runs']}/{s['wickets']} ({s['overs']})"
                 for i, s in summaries(m)]
        rows.append({"id": m.id, "title": m.title, "venue": m.venue, "overs": m.overs,
                     "teams": {"A": team(m, "A"), "B": team(m, "B")}, "score_line": " | ".join(lines),
                     "created_at": m.created_at.isoformat()})
    return rows


# ---------- commands ----------
def create_match(db: Session, data: MatchCreate) -> Match:
    m = Match(title=data.title.strip(), venue=data.venue.strip(), team_a_name=data.team_a_name.strip(),
              team_a_short=data.team_a_short.strip().upper(), team_b_name=data.team_b_name.strip(),
              team_b_short=data.team_b_short.strip().upper(), overs=data.overs,
              players_per_side=data.players_per_side, batting_first=data.batting_first)
    for side, names in (("A", data.team_a_players), ("B", data.team_b_players)):
        names = [n.strip() for n in names if n.strip()]
        if len(names) < 2:
            raise ServiceError(422, f"Team {side} needs at least 2 players")
        m.players += [Player(side=side, name=n, position=i) for i, n in enumerate(names)]
    m.innings.append(Innings(number=1, batting_side=data.batting_first))
    db.add(m)
    db.commit()
    return m


def delete_match(db: Session, match_id: int) -> None:
    match = get_match(db, match_id)
    ids = [i.id for i in match.innings]
    db.execute(delete(Delivery).where(Delivery.innings_id.in_(ids)))
    db.expire_all()
    db.delete(db.get(Match, match_id))
    db.commit()


def _innings(match: Match, number: int) -> Innings:
    inn = next((i for i in match.innings if i.number == number), None)
    if not inn:
        raise ServiceError(404, "Innings not found")
    return inn


def add_ball(db: Session, match_id: int, number: int, data) -> None:
    match = get_match(db, match_id)
    inn = _innings(match, number)
    if inn is not match.innings[-1]:
        raise ServiceError(409, "Only the latest innings accepts new balls")
    s = dict((i.id, x) for i, x in summaries(match))[inn.id]
    ball = Ball(0, 0, **{k: getattr(data, k) for k in BALL_FIELDS})
    if not ball.is_wicket:
        ball.wicket_type = ball.player_out_id = None
    try:
        validate_fields(ball)
        validate_context(s, ball, roster(match, inn.batting_side), roster(match, other(inn.batting_side)))
    except ScoringError as e:
        raise ServiceError(422, str(e))
    seq = max((d.seq for d in inn.deliveries), default=0) + 1
    db.add(Delivery(innings_id=inn.id, seq=seq, **{k: getattr(ball, k) for k in BALL_FIELDS}))
    db.commit()


def _delivery(db: Session, ball_id: int) -> tuple[Delivery, Match]:
    d = db.get(Delivery, ball_id)
    if not d:
        raise ServiceError(404, "Ball not found")
    inn = db.get(Innings, d.innings_id)
    return d, get_match(db, inn.match_id)


def update_ball(db: Session, ball_id: int, patch: dict) -> int:
    d, match = _delivery(db, ball_id)
    new = {**{k: getattr(d, k) for k in BALL_FIELDS}, **patch}
    if not new["is_wicket"]:
        new["wicket_type"] = new["player_out_id"] = None
    try:
        validate_fields(Ball(d.id, d.seq, **new))
    except ScoringError as e:
        raise ServiceError(422, str(e))
    for k, v in new.items():
        setattr(d, k, v)
    db.commit()
    return match.id


def delete_ball(db: Session, ball_id: int) -> int:
    d, match = _delivery(db, ball_id)
    db.delete(d)
    db.commit()
    return match.id


def undo_last(db: Session, match_id: int) -> None:
    match = get_match(db, match_id)
    inn = match.innings[-1]
    if not inn.deliveries:
        raise ServiceError(409, "No ball to undo in this innings")
    db.delete(inn.deliveries[-1])
    db.commit()


def start_second_innings(db: Session, match_id: int) -> None:
    match = get_match(db, match_id)
    if len(match.innings) != 1:
        raise ServiceError(409, "Second innings already started")
    if not summaries(match)[0][1]["complete"]:
        raise ServiceError(409, "First innings is not complete yet")
    db.add(Innings(match_id=match.id, number=2, batting_side=other(match.innings[0].batting_side)))
    db.commit()


def patch_innings(db: Session, match_id: int, number: int, closed: bool) -> None:
    inn = _innings(get_match(db, match_id), number)
    inn.closed = closed
    db.commit()


def add_player(db: Session, match_id: int, side: str, name: str) -> None:
    match = get_match(db, match_id)
    pos = max((p.position for p in match.players if p.side == side), default=-1) + 1
    db.add(Player(match_id=match.id, side=side, name=name.strip(), position=pos))
    db.commit()


def rename_player(db: Session, player_id: int, name: str) -> int:
    p = db.get(Player, player_id)
    if not p:
        raise ServiceError(404, "Player not found")
    p.name = name.strip()
    db.commit()
    return p.match_id
