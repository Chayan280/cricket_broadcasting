from math import ceil


def overs_str(legal_balls: int) -> str:
    return f"{legal_balls // 6}.{legal_balls % 6}"


def phase_bounds(overs: int) -> tuple[int, int]:
    """(powerplay_end, death_start) as 0-based over indexes."""
    if overs > 20:
        return 10, max(10, overs - 10)
    pp = max(1, ceil(overs * 0.3))
    return pp, max(pp, overs - ceil(overs * 0.25))
