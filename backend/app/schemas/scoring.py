from typing import Literal, Optional

from pydantic import BaseModel, Field

ExtraType = Literal["none", "wide", "noball", "bye", "legbye"]


class BallIn(BaseModel):
    striker_id: int
    non_striker_id: int
    bowler_id: int
    runs_bat: int = Field(default=0, ge=0, le=7)
    extra_type: ExtraType = "none"
    extra_runs: int = Field(default=0, ge=0, le=12)
    is_wicket: bool = False
    wicket_type: Optional[str] = None
    player_out_id: Optional[int] = None
    fielder: Optional[str] = Field(default=None, max_length=80)


class BallUpdate(BaseModel):
    striker_id: Optional[int] = None
    non_striker_id: Optional[int] = None
    bowler_id: Optional[int] = None
    runs_bat: Optional[int] = Field(default=None, ge=0, le=7)
    extra_type: Optional[ExtraType] = None
    extra_runs: Optional[int] = Field(default=None, ge=0, le=12)
    is_wicket: Optional[bool] = None
    wicket_type: Optional[str] = None
    player_out_id: Optional[int] = None
    fielder: Optional[str] = None


class OverlayIn(BaseModel):
    visible: bool = True
    chart: Optional[str] = None
    innings: int = Field(default=0, ge=0, le=2)  # 0 = whichever innings is live
    position: Literal["left", "center", "right"] = "center"
