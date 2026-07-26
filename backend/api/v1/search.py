from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.database.session import get_db
from backend.models.models import User, Incident, Vehicle, Equipment, Geofence

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    pattern = f"%{q}%"
    results = []

    # 1. Users / Responders
    users = db.query(User).filter(
        (User.full_name.ilike(pattern)) | (User.email.ilike(pattern)),
        User.is_deleted == False
    ).limit(5).all()
    for u in users:
        results.append({
            "id": str(u.id),
            "title": u.full_name,
            "subtitle": u.email,
            "category": "User",
            "href": "/admin",
            "badge": "Responder"
        })

    # 2. Incidents
    incidents = db.query(Incident).filter(
        (Incident.title.ilike(pattern)) | (Incident.category.ilike(pattern)) | (Incident.address.ilike(pattern)),
        Incident.is_deleted == False
    ).limit(5).all()
    for inc in incidents:
        results.append({
            "id": str(inc.id),
            "title": inc.title,
            "subtitle": f"{inc.category} • {inc.priority} Priority",
            "category": "Incident",
            "href": "/console",
            "badge": inc.status
        })

    # 3. Vehicles
    vehicles = db.query(Vehicle).filter(
        (Vehicle.call_sign.ilike(pattern)) | (Vehicle.type.ilike(pattern)),
        Vehicle.is_deleted == False
    ).limit(5).all()
    for v in vehicles:
        results.append({
            "id": str(v.id),
            "title": v.call_sign,
            "subtitle": f"{v.type} • {v.status}",
            "category": "Vehicle",
            "href": "/admin",
            "badge": v.status
        })

    # 4. Geofences
    geofences = db.query(Geofence).filter(
        Geofence.name.ilike(pattern),
        Geofence.is_deleted == False
    ).limit(5).all()
    for g in geofences:
        results.append({
            "id": str(g.id),
            "title": g.name,
            "subtitle": f"{g.boundary_type} Zone",
            "category": "Geofence",
            "href": "/geofences",
            "badge": "Active" if g.is_active else "Inactive"
        })

    return {"query": q, "total": len(results), "results": results}
