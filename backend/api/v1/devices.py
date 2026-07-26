from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.database.session import get_db
from backend.models.models import Device, User
from backend.schemas.schemas import DeviceResponse
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/devices", tags=["devices"])

@router.get("/", response_model=List[DeviceResponse])
def get_user_devices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Device).filter(Device.user_id == current_user.id).all()

@router.delete("/{id}")
def revoke_device(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    device = db.query(Device).filter(Device.id == id, Device.user_id == current_user.id).first()
    if device:
        db.delete(device)
        db.commit()
    return {"status": "success", "message": "Device access revoked"}
