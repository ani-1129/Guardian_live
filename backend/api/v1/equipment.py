from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database.session import get_db
from backend.models.models import Equipment, User
from backend.schemas.schemas import EquipmentCreate, EquipmentUpdate, EquipmentResponse
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/equipment", tags=["equipment"])

@router.get("/", response_model=List[EquipmentResponse])
def get_equipment(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Equipment).filter(Equipment.is_deleted == False)
    if type:
        query = query.filter(Equipment.type == type)
    if status:
        query = query.filter(Equipment.status == status)
    return query.all()

@router.post("/", response_model=EquipmentResponse)
def create_equipment(
    eq_in: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    eq = Equipment(
        name=eq_in.name,
        serial_number=eq_in.serial_number,
        type=eq_in.type,
        organization_id=eq_in.organization_id or current_user.organization_id,
        assigned_user_id=eq_in.assigned_user_id,
        status="Ready"
    )
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return eq

@router.put("/{id}", response_model=EquipmentResponse)
def update_equipment(id: str, eq_in: EquipmentUpdate, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.id == id, Equipment.is_deleted == False).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")

    if eq_in.name is not None:
        eq.name = eq_in.name
    if eq_in.serial_number is not None:
        eq.serial_number = eq_in.serial_number
    if eq_in.type is not None:
        eq.type = eq_in.type
    if eq_in.status is not None:
        eq.status = eq_in.status
    if eq_in.assigned_user_id is not None:
        eq.assigned_user_id = eq_in.assigned_user_id

    db.commit()
    db.refresh(eq)
    return eq

@router.delete("/{id}")
def delete_equipment(id: str, db: Session = Depends(get_db)):
    eq = db.query(Equipment).filter(Equipment.id == id).first()
    if eq:
        eq.is_deleted = True
        db.commit()
    return {"status": "success", "message": "Equipment soft deleted"}
