from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from ..deps import get_current_user, get_db, require_admin
from ..models import Slot, User, utcnow
from ..schemas import SlotCreate, SlotOut

router = APIRouter(prefix="/slots", tags=["slots"])


@router.get("", response_model=list[SlotOut])
def list_slots(
    available_only: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Slot).options(selectinload(Slot.bookings)).order_by(Slot.start_time)
    if user.role != "admin":  # normal users only see upcoming slots
        query = query.where(Slot.start_time > utcnow())
    slots = db.scalars(query).all()
    if available_only:
        slots = [s for s in slots if s.is_available]
    return slots


@router.post("", response_model=SlotOut, status_code=status.HTTP_201_CREATED)
def create_slot(data: SlotCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if data.start_time <= utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Slot must start in the future")
    slot = Slot(start_time=data.start_time, end_time=data.end_time)
    db.add(slot)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "This slot already exists")
    db.refresh(slot)
    return slot


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(slot_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    slot = db.get(Slot, slot_id)
    if not slot:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Slot not found")
    if any(b.status == "booked" for b in slot.bookings):
        raise HTTPException(status.HTTP_409_CONFLICT, "Cannot delete a slot with an active booking")
    for b in slot.bookings:  # cancelled/completed history is removed with the slot
        db.delete(b)
    db.delete(slot)
    db.commit()
