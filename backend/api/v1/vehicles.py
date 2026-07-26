from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database.session import get_db
from backend.models.models import Vehicle, User
from backend.schemas.schemas import VehicleCreate, VehicleUpdate, VehicleResponse
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.get("/", response_model=List[VehicleResponse])
def get_vehicles(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Vehicle).filter(Vehicle.is_deleted == False)
    if status:
        query = query.filter(Vehicle.status == status)
    if type:
        query = query.filter(Vehicle.type == type)
    return query.all()

@router.post("/", response_model=VehicleResponse)
def create_vehicle(
    veh_in: VehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Vehicle).filter(Vehicle.call_sign == veh_in.call_sign).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle with this call sign already exists")

    vehicle = Vehicle(
        call_sign=veh_in.call_sign,
        type=veh_in.type,
        license_plate=veh_in.license_plate,
        organization_id=veh_in.organization_id or current_user.organization_id,
        assigned_user_id=veh_in.assigned_user_id,
        status="Available"
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.put("/{id}", response_model=VehicleResponse)
def update_vehicle(id: str, veh_in: VehicleUpdate, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.id == id, Vehicle.is_deleted == False).first()
    if not veh:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if veh_in.call_sign is not None:
        veh.call_sign = veh_in.call_sign
    if veh_in.type is not None:
        veh.type = veh_in.type
    if veh_in.license_plate is not None:
        veh.license_plate = veh_in.license_plate
    if veh_in.status is not None:
        veh.status = veh_in.status
    if veh_in.battery_level is not None:
        veh.battery_level = veh_in.battery_level
    if veh_in.speed is not None:
        veh.speed = veh_in.speed
    if veh_in.latitude is not None:
        veh.latitude = veh_in.latitude
    if veh_in.longitude is not None:
        veh.longitude = veh_in.longitude
    if veh_in.assigned_user_id is not None:
        veh.assigned_user_id = veh_in.assigned_user_id

    db.commit()
    db.refresh(veh)
    return veh

@router.delete("/{id}")
def delete_vehicle(id: str, db: Session = Depends(get_db)):
    veh = db.query(Vehicle).filter(Vehicle.id == id).first()
    if veh:
        veh.is_deleted = True
        db.commit()
    return {"status": "success", "message": "Vehicle soft deleted"}
