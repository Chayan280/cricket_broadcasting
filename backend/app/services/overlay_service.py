"""Which chart is on air right now. Kept in memory (resets on server restart, by design)."""
ALLOWED = {"worm", "manhattan", "runrate", "phases", "batters", "bowlers", "partnerships", "runtypes"}
_DEFAULT = {"visible": False, "chart": None, "innings": 0, "position": "center"}
_state: dict[int, dict] = {}


def get_overlay(match_id: int) -> dict:
    return {**_DEFAULT, **_state.get(match_id, {})}


def set_overlay(match_id: int, data: dict) -> dict:
    if data.get("chart") is not None and data["chart"] not in ALLOWED:
        raise ValueError("Unknown chart")
    _state[match_id] = {**get_overlay(match_id), **data}
    return get_overlay(match_id)
