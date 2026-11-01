import pytest

from app.services.scoring_engine import Ball, ScoringError, replay, validate_context, validate_fields

BAT = {i: f"B{i}" for i in range(1, 12)}
BOWL = {i: f"W{i}" for i in range(101, 112)}


def mk(seq, s=1, n=2, bw=101, **kw):
    return Ball(seq, seq, s, n, bw, **kw)


def run(balls, overs=20, target=None):
    return replay(balls, BAT, BOWL, overs, 10, target)


def test_strike_rotation_and_over_end():
    balls = [mk(1, runs_bat=1)] + [mk(i, s=2, n=1, runs_bat=0) for i in range(2, 7)]
    s = run(balls)
    assert s["overs"] == "1.0" and s["runs"] == 1
    # after 6th ball striker swaps for the new over: started 2*, 1 -> after 1 run: 2 strike?... check ids
    assert s["next"]["bowler_id"] is None and s["needs_new_over"]
    assert s["next"]["striker_id"] == 1  # over-end swap


def test_wide_is_not_legal_and_not_faced():
    s = run([mk(1, extra_type="wide", extra_runs=1), mk(2, runs_bat=4)])
    assert s["legal_balls"] == 1 and s["runs"] == 5
    b1 = next(b for b in s["batters"] if b["id"] == 1)
    assert b1["balls"] == 1 and b1["fours"] == 1
    assert s["bowlers"][0]["runs"] == 5


def test_wide_plus_run_rotates_strike():
    s = run([mk(1, extra_type="wide", extra_runs=2)])
    assert s["next"]["striker_id"] == 2


def test_byes_not_charged_to_bowler():
    s = run([mk(1, extra_type="bye", extra_runs=2)])
    assert s["runs"] == 2 and s["bowlers"][0]["runs"] == 0 and s["extras"]["bye"] == 2


def test_wicket_removes_striker_and_counts_for_bowler():
    s = run([mk(1, is_wicket=True, wicket_type="bowled")])
    assert s["wickets"] == 1 and s["next"]["striker_id"] is None and s["next"]["non_striker_id"] == 2
    assert s["bowlers"][0]["wickets"] == 1 and s["fow"][0]["runs"] == 0
    assert s["batters"][0]["dismissal"] == "b W101"


def test_run_out_not_bowler_wicket():
    s = run([mk(1, runs_bat=1, is_wicket=True, wicket_type="run_out", player_out_id=2)])
    assert s["bowlers"][0]["wickets"] == 0 and s["wickets"] == 1


def test_wicket_on_last_ball_new_batter_comes_to_non_striker_end():
    balls = [mk(i, s=1, n=2) for i in range(1, 6)] + [mk(6, is_wicket=True, wicket_type="bowled")]
    s = run(balls)
    assert s["next"]["striker_id"] == 2 and s["next"]["non_striker_id"] is None


def test_maiden():
    s = run([mk(i) for i in range(1, 7)])
    assert s["bowlers"][0]["maidens"] == 1


def test_free_hit_after_noball():
    s = run([mk(1, extra_type="noball", extra_runs=1)])
    assert s["free_hit"]
    with pytest.raises(ScoringError):
        validate_context(s, mk(2, is_wicket=True, wicket_type="bowled"), BAT, BOWL)
    s2 = run([mk(1, extra_type="noball", extra_runs=1), mk(2)])
    assert not s2["free_hit"]


def test_all_out_and_chase_complete():
    balls = [mk(i, s=i, n=i + 1, is_wicket=True, wicket_type="bowled", bw=101 if i < 6 else 102) for i in range(1, 11)]
    assert run(balls)["complete"]
    assert run([mk(1, runs_bat=6)], target=5)["end_reason"] == "target_chased"


def test_same_bowler_cannot_bowl_consecutive_overs():
    s = run([mk(i) for i in range(1, 7)])
    with pytest.raises(ScoringError):
        validate_context(s, mk(7, s=1, n=2, bw=101), BAT, BOWL)


def test_field_validation():
    with pytest.raises(ScoringError):
        validate_fields(mk(1, extra_type="wide", extra_runs=1, is_wicket=True, wicket_type="bowled"))
    with pytest.raises(ScoringError):
        validate_fields(mk(1, s=1, n=1))
