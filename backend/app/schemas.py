from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


def to_naive_utc(v: datetime) -> datetime:
    if v.tzinfo is not None:
        v = v.astimezone(timezone.utc).replace(tzinfo=None)
    return v


def as_utc(v: datetime) -> datetime:
    return v.replace(tzinfo=timezone.utc) if v.tzinfo is None else v


# ---------- Auth ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        return v.strip()


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Slots ----------
class SlotCreate(BaseModel):
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def check_times(self):
        self.start_time = to_naive_utc(self.start_time)
        self.end_time = to_naive_utc(self.end_time)
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class SlotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    start_time: datetime
    end_time: datetime
    is_available: bool

    @field_validator("start_time", "end_time")
    @classmethod
    def mark_utc(cls, v: datetime) -> datetime:
        return as_utc(v)


# ---------- Bookings ----------
class BookingCreate(BaseModel):
    slot_id: int = Field(gt=0)
    notes: str | None = Field(default=None, max_length=300)


class RescheduleIn(BaseModel):
    slot_id: int = Field(gt=0)


class StatusIn(BaseModel):
    status: Literal["cancelled", "completed"]


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    notes: str | None
    created_at: datetime
    slot: SlotOut
    user: UserOut

    @field_validator("created_at")
    @classmethod
    def mark_utc(cls, v: datetime) -> datetime:
        return as_utc(v)
