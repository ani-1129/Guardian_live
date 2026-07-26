from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database.session import get_db
from backend.schemas.schemas import LocationUpdate, LocationResponse
from backend.repositories.location import LocationRepository

router = APIRouter(prefix="/locations", tags=["locations"])

@router.post("/{user_id}", response_model=LocationResponse)
def update_user_location(user_id: str, loc_in: LocationUpdate, db: Session = Depends(get_db)):
    repo = LocationRepository(db)
    return repo.update_latest_location(
        user_id=user_id,
        latitude=loc_in.latitude,
        longitude=loc_in.longitude,
        speed=loc_in.speed,
        heading=loc_in.heading,
        battery=loc_in.battery_level
    )

@router.get("/latest", response_model=List[LocationResponse])
def get_latest_locations(db: Session = Depends(get_db)):
    repo = LocationRepository(db)
    return repo.get_latest_locations()
