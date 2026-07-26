from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database.session import get_db
from backend.models.models import Geofence, User
from backend.schemas.schemas import GeofenceCreate, GeofenceUpdate, GeofenceResponse
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/geofences", tags=["geofences"])

@router.get("/", response_model=List[GeofenceResponse])
def get_geofences(
    organization_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Geofence).filter(Geofence.is_deleted == False)
    if organization_id:
        query = query.filter(Geofence.organization_id == organization_id)
    return query.all()

@router.post("/", response_model=GeofenceResponse)
def create_geofence(
    geo_in: GeofenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    geofence = Geofence(
        name=geo_in.name,
        boundary_type=geo_in.boundary_type,
        coordinates=geo_in.coordinates,
        organization_id=geo_in.organization_id or current_user.organization_id,
        is_active=geo_in.is_active,
        alert_on_entry=geo_in.alert_on_entry,
        alert_on_exit=geo_in.alert_on_exit
    )
    db.add(geofence)
    db.commit()
    db.refresh(geofence)
    return geofence

@router.get("/{id}", response_model=GeofenceResponse)
def get_geofence_by_id(id: str, db: Session = Depends(get_db)):
    geo = db.query(Geofence).filter(Geofence.id == id, Geofence.is_deleted == False).first()
    if not geo:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return geo

@router.put("/{id}", response_model=GeofenceResponse)
def update_geofence(id: str, geo_in: GeofenceUpdate, db: Session = Depends(get_db)):
    geo = db.query(Geofence).filter(Geofence.id == id, Geofence.is_deleted == False).first()
    if not geo:
        raise HTTPException(status_code=404, detail="Geofence not found")

    if geo_in.name is not None:
        geo.name = geo_in.name
    if geo_in.boundary_type is not None:
        geo.boundary_type = geo_in.boundary_type
    if geo_in.coordinates is not None:
        geo.coordinates = geo_in.coordinates
    if geo_in.is_active is not None:
        geo.is_active = geo_in.is_active
    if geo_in.alert_on_entry is not None:
        geo.alert_on_entry = geo_in.alert_on_entry
    if geo_in.alert_on_exit is not None:
        geo.alert_on_exit = geo_in.alert_on_exit

    db.commit()
    db.refresh(geo)
    return geo

@router.delete("/{id}")
def delete_geofence(id: str, db: Session = Depends(get_db)):
    geo = db.query(Geofence).filter(Geofence.id == id).first()
    if geo:
        geo.is_deleted = True
        db.commit()
    return {"status": "success", "message": "Geofence soft deleted"}
