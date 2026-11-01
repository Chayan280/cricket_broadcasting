from typing import Literal

from pydantic import BaseModel, Field


class MatchCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    venue: str = Field(default="", max_length=120)
    team_a_name: str = Field(min_length=1, max_length=60)
    team_a_short: str = Field(min_length=1, max_length=6)
    team_b_name: str = Field(min_length=1, max_length=60)
    team_b_short: str = Field(min_length=1, max_length=6)
    overs: int = Field(default=20, ge=1, le=50)
    players_per_side: int = Field(default=11, ge=2, le=11)
    batting_first: Literal["A", "B"] = "A"
    team_a_players: list[str] = Field(min_length=2)
    team_b_players: list[str] = Field(min_length=2)


class LoginIn(BaseModel):
    pin: str
    role: Literal["admin", "commentator"]


class PlayerIn(BaseModel):
    side: Literal["A", "B"]
    name: str = Field(min_length=1, max_length=80)


class PlayerRename(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class InningsPatch(BaseModel):
    closed: bool
