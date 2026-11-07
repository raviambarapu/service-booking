from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..deps import get_current_user, get_db, require_admin
from ..models import Booking, Slot, User, utcnow
from ..schemas import BookingCreate, BookingOut, RescheduleIn, StatusIn

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _load_bookings():
    return select(Booking).options(
        selectinload(Booking.slot).selectinload(Slot.bookings),
        selectinload(Booking.user),
    )


def _get_slot_for_booking(db: Session, slot_id: int) -> Slot:
    slot = db.get(Slot, slot_id)
    if not slot:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Slot not found")
    if slot.start_time <= utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Slot is in the past")
    if not slot.is_available:
        raise HTTPException(status.HTTP_409_CONFLICT, "Slot is already booked")
    return slot


def _get_own_booking(db: Session, booking_id: int, user: User) -> Booking:
    booking = db.scalar(_load_bookings().where(Booking.id == booking_id))
    if not booking:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    if booking.user_id != user.id and user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")
    return booking


def _commit(db: Session):
    try:
        db.commit()
    except IntegrityError:  # two people grabbed the same slot at the same time
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Slot is already booked")


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(data: BookingCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    slot = _get_slot_for_booking(db, data.slot_id)
    booking = Booking(user_id=user.id, slot_id=slot.id, notes=data.notes, status="booked")
    db.add(booking)
    _commit(db)
    return db.scalar(_load_bookings().where(Booking.id == booking.id))


@router.get("/my", response_model=list[BookingOut])
def my_bookings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = _load_bookings().where(Booking.user_id == user.id).order_by(Booking.created_at.desc())
    return db.scalars(query).all()


@router.get("", response_model=list[BookingOut])
def all_bookings(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.scalars(_load_bookings().order_by(Booking.created_at.desc())).all()


@router.put("/{booking_id}/reschedule", response_model=BookingOut)
def reschedule(booking_id: int, data: RescheduleIn, db: Session = Depends(get_db),
               user: User = Depends(get_current_user)):
    booking = _get_own_booking(db, booking_id, user)
    if booking.status != "booked":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only active bookings can be rescheduled")
    if booking.slot_id == data.slot_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Choose a different slot")
    new_slot = _get_slot_for_booking(db, data.slot_id)
    booking.slot_id = new_slot.id
    _commit(db)
    db.expire_all()
    return db.scalar(_load_bookings().where(Booking.id == booking_id))


@router.delete("/{booking_id}", response_model=BookingOut)
def cancel_booking(booking_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    booking = _get_own_booking(db, booking_id, user)
    if booking.status != "booked":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Booking is not active")
    booking.status = "cancelled"
    db.commit()
    db.expire_all()
    return db.scalar(_load_bookings().where(Booking.id == booking_id))


@router.patch("/{booking_id}/status", response_model=BookingOut)
def set_status(booking_id: int, data: StatusIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    booking = db.scalar(_load_bookings().where(Booking.id == booking_id))
    if not booking:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    if booking.status != "booked":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Booking is not active")
    booking.status = data.status
    db.commit()
    db.expire_all()
    return db.scalar(_load_bookings().where(Booking.id == booking_id))
