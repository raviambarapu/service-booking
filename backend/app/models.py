from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    """Naive UTC datetime (all datetimes are stored as UTC)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="user")  # user | admin
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="user")


class Slot(Base):
    __tablename__ = "slots"
    __table_args__ = (UniqueConstraint("start_time", "end_time", name="uq_slot_time"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    bookings: Mapped[list["Booking"]] = relationship(back_populates="slot")

    @property
    def is_available(self) -> bool:
        return not any(b.status == "booked" for b in self.bookings)


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        # A slot can have only ONE active ("booked") booking -> prevents double booking
        Index(
            "uq_active_booking_per_slot",
            "slot_id",
            unique=True,
            postgresql_where=text("status = 'booked'"),
            sqlite_where=text("status = 'booked'"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    slot_id: Mapped[int] = mapped_column(ForeignKey("slots.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="booked")  # booked | cancelled | completed
    notes: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped["User"] = relationship(back_populates="bookings")
    slot: Mapped["Slot"] = relationship(back_populates="bookings")
