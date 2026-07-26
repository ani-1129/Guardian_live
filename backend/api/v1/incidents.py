from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from backend.database.session import get_db
from backend.schemas.schemas import IncidentCreate, IncidentResponse
from backend.repositories.incident import IncidentRepository
from datetime import datetime
from backend.models.models import Incident, AuditLog, ActivityTimeline, User
from backend.websocket.broadcast import broadcast_to_all
from backend.middleware.auth import has_permission, get_current_user

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.post("/public", response_model=IncidentResponse)
async def create_public_incident(incident_in: IncidentCreate, db: Session = Depends(get_db)):
    repo = IncidentRepository(db)
    incident = Incident(
        title=incident_in.title,
        description=incident_in.description,
        priority=incident_in.priority,
        category=incident_in.category,
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        address=incident_in.address,
        district=incident_in.district,
        organization_id=incident_in.organization_id
    )
    created = repo.create(incident)
    
    # Log timeline and audit
    timeline = ActivityTimeline(
        entity_type="Incident",
        entity_id=created.id,
        action="INCIDENT_CREATED",
        description=f"Incident '{created.title}' created [{created.category}] Priority: {created.priority}",
        performed_by_name="Emergency Reporter"
    )
    audit = AuditLog(
        action="INCIDENT_CREATED_PUBLIC",
        affected_record=f"Incident:{created.id}",
        ip_address="127.0.0.1"
    )
    db.add(timeline)
    db.add(audit)
    db.commit()

    # Serialize via Pydantic v2 model_validate
    resp = IncidentResponse.model_validate(created)
    
    # Broadcast to all operators
    await broadcast_to_all({
        "event": "new_incident",
        "data": {
            "id": str(resp.id),
            "title": resp.title,
            "description": resp.description,
            "status": resp.status,
            "priority": resp.priority,
            "category": resp.category,
            "latitude": resp.latitude,
            "longitude": resp.longitude,
            "address": resp.address,
            "district": resp.district,
            "assigned_user_id": str(resp.assigned_user_id) if resp.assigned_user_id else None,
            "organization_id": str(resp.organization_id),
            "created_at": resp.created_at.isoformat()
        }
    })
    await broadcast_to_all({"event": "statistics_updated", "data": {}})
    return created

@router.post("/", response_model=IncidentResponse, dependencies=[Depends(has_permission("incidents:create"))])
async def create_incident(incident_in: IncidentCreate, db: Session = Depends(get_db)):
    repo = IncidentRepository(db)
    incident = Incident(
        title=incident_in.title,
        description=incident_in.description,
        priority=incident_in.priority,
        category=incident_in.category,
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        address=incident_in.address,
        district=incident_in.district,
        organization_id=incident_in.organization_id,
        assigned_user_id=incident_in.assigned_user_id
    )
    created = repo.create(incident)

    timeline = ActivityTimeline(
        entity_type="Incident",
        entity_id=created.id,
        action="INCIDENT_CREATED",
        description=f"Incident '{created.title}' created by Dispatcher [{created.category}] Priority: {created.priority}",
        performed_by_name="Dispatcher"
    )
    audit = AuditLog(
        action="INCIDENT_CREATED",
        affected_record=f"Incident:{created.id}",
        ip_address="127.0.0.1"
    )
    db.add(timeline)
    db.add(audit)
    db.commit()

    resp = IncidentResponse.model_validate(created)
    await broadcast_to_all({
        "event": "new_incident",
        "data": {
            "id": str(resp.id),
            "title": resp.title,
            "description": resp.description,
            "status": resp.status,
            "priority": resp.priority,
            "category": resp.category,
            "latitude": resp.latitude,
            "longitude": resp.longitude,
            "address": resp.address,
            "district": resp.district,
            "assigned_user_id": str(resp.assigned_user_id) if resp.assigned_user_id else None,
            "organization_id": str(resp.organization_id),
            "created_at": resp.created_at.isoformat()
        }
    })
    await broadcast_to_all({"event": "statistics_updated", "data": {}})
    return created

@router.get("/", response_model=List[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    repo = IncidentRepository(db)
    return repo.get_all()

@router.get("/{id}", response_model=IncidentResponse)
def get_incident_by_id(id: str, db: Session = Depends(get_db)):
    repo = IncidentRepository(db)
    incident = repo.get_by_id(id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.patch("/{id}", response_model=IncidentResponse, dependencies=[Depends(has_permission("incidents:assign"))])
async def update_incident(
    id: str,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = IncidentRepository(db)
    incident = repo.get_by_id(id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    prev_status = incident.status
    prev_assignee = str(incident.assigned_user_id) if incident.assigned_user_id else None

    if status is not None:
        incident.status = status
    if priority is not None:
        incident.priority = priority
    if assigned_user_id is not None:
        if assigned_user_id == "" or assigned_user_id == "null" or assigned_user_id == "None":
            incident.assigned_user_id = None
        else:
            try:
                incident.assigned_user_id = UUID(assigned_user_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid assigned_user_id UUID format")
                
    updated = repo.update(incident)
    resp = IncidentResponse.model_validate(updated)
    
    # Log Activity Timeline
    timeline_entry = ActivityTimeline(
        entity_type="Incident",
        entity_id=incident.id,
        action="INCIDENT_UPDATED",
        description=f"Status changed from '{prev_status}' to '{incident.status}'. Assignee updated.",
        performed_by_id=current_user.id if current_user else None,
        performed_by_name=current_user.full_name if current_user else "Dispatcher"
    )
    db.add(timeline_entry)

    # Log Audit
    audit_log = AuditLog(
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else "system",
        action="INCIDENT_UPDATED",
        affected_record=f"Incident:{id}",
        ip_address="127.0.0.1"
    )
    db.add(audit_log)
    db.commit()

    # Broadcast status change / assignment / priority updates
    await broadcast_to_all({
        "event": "incident_updated",
        "data": {
            "id": str(resp.id),
            "title": resp.title,
            "description": resp.description,
            "status": resp.status,
            "priority": resp.priority,
            "category": resp.category,
            "latitude": resp.latitude,
            "longitude": resp.longitude,
            "address": resp.address,
            "district": resp.district,
            "assigned_user_id": str(resp.assigned_user_id) if resp.assigned_user_id else None,
            "organization_id": str(resp.organization_id),
            "created_at": resp.created_at.isoformat()
        }
    })

    # Broadcast updated statistics
    await broadcast_to_all({"event": "statistics_updated", "data": {}})
    return updated

@router.delete("/{id}")
async def delete_incident(
    id: str,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = IncidentRepository(db)
    incident = repo.get_by_id(id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Soft delete
    incident.is_deleted = True
    incident.deleted_at = datetime.utcnow()
    incident.deleted_by = current_user.email if current_user else "unknown"
    repo.update(incident)

    # Log Audit & Activity
    audit = AuditLog(
        user_id=current_user.id if current_user else None,
        user_email=current_user.email if current_user else "unknown",
        action="INCIDENT_DELETED",
        affected_record=f"Incident:{id}",
        ip_address="127.0.0.1"
    )
    timeline = ActivityTimeline(
        entity_type="Incident",
        entity_id=incident.id,
        action="INCIDENT_DELETED",
        description=f"Incident '{incident.title}' was soft-deleted. Reason: {reason or 'N/A'}",
        performed_by_id=current_user.id if current_user else None,
        performed_by_name=current_user.full_name if current_user else "Dispatcher"
    )
    db.add(audit)
    db.add(timeline)
    db.commit()

    # Broadcast WebSocket deletion event & statistics update
    await broadcast_to_all({
        "event": "incident_deleted",
        "data": {"id": id, "title": incident.title}
    })
    await broadcast_to_all({"event": "statistics_updated", "data": {}})

    return {"status": "success", "message": f"Incident '{incident.title}' soft-deleted successfully."}

@router.get("/{id}/recommendations")
def get_incident_recommendations(id: str, db: Session = Depends(get_db)):
    repo = IncidentRepository(db)
    incident = repo.get_by_id(id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    from backend.services.dispatch_engine import get_dispatch_recommendations
    return get_dispatch_recommendations(db, incident)

@router.post("/{id}/override")
async def chief_dispatcher_override(
    id: str,
    unit_id: str,
    reason: str = "Chief Dispatcher Override Force Assignment",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify Chief Dispatcher or Admin role
    user_roles = [r.name for r in current_user.roles]
    if "Chief Dispatcher" not in user_roles and "Admin" not in user_roles:
        raise HTTPException(status_code=403, detail="Chief Dispatcher approval required for override operations.")

    repo = IncidentRepository(db)
    incident = repo.get_by_id(id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    try:
        incident.assigned_user_id = UUID(unit_id)
    except ValueError:
        pass
    
    incident.status = "Assigned"
    repo.update(incident)

    # Add audit log and activity timeline entry
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="CHIEF_DISPATCHER_OVERRIDE",
        affected_record=f"Incident:{id}, Unit:{unit_id}",
        ip_address="127.0.0.1"
    )
    timeline = ActivityTimeline(
        entity_type="Incident",
        entity_id=incident.id,
        action="CHIEF_OVERRIDE_ASSIGNMENT",
        description=f"Chief Dispatcher ({current_user.full_name}) overridden unit assignment to unit {unit_id}. Reason: {reason}",
        performed_by_id=current_user.id,
        performed_by_name=current_user.full_name
    )
    db.add(audit)
    db.add(timeline)
    db.commit()

    # Broadcast real-time WS update
    await broadcast_to_all({
        "event": "incident_updated",
        "data": {
            "id": str(incident.id),
            "title": incident.title,
            "status": incident.status,
            "priority": incident.priority,
            "assigned_user_id": str(unit_id)
        }
    })
    await broadcast_to_all({"event": "statistics_updated", "data": {}})

    return {"status": "success", "message": "Chief Dispatcher override executed successfully."}

@router.get("/{id}/timeline")
def get_incident_timeline(id: str, db: Session = Depends(get_db)):
    from backend.models.models import ActivityTimeline
    timeline = db.query(ActivityTimeline).filter(
        ActivityTimeline.entity_type == "Incident",
        ActivityTimeline.entity_id == UUID(id)
    ).order_by(ActivityTimeline.timestamp.desc()).all()

    return [{
        "id": str(t.id),
        "action": t.action,
        "description": t.description,
        "performed_by": t.performed_by_name or "System",
        "timestamp": t.timestamp.isoformat()
    } for t in timeline]



