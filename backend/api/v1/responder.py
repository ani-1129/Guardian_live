from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from backend.database.session import get_db
from backend.models.models import Incident, User, DispatchMessage, ActivityTimeline, AuditLog
from backend.middleware.auth import get_current_user, has_permission
from backend.websocket.broadcast import broadcast_to_all

router = APIRouter(prefix="/responder", tags=["responder"])

@router.get("/assignment")
def get_current_assignment(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Find any active incident assigned to the current responder user
    incident = db.query(Incident).filter(
        Incident.assigned_user_id == current_user.id,
        Incident.status.in_(["Assigned", "Accepted", "Preparing", "En Route", "Delayed", "On Scene", "Transporting", "Returning"]),
        Incident.is_deleted == False
    ).order_by(Incident.created_at.desc()).first()

    if not incident:
         return {"assignment": None}
    
    return {
         "assignment": {
              "id": str(incident.id),
              "title": incident.title,
              "description": incident.description,
              "status": incident.status,
              "priority": incident.priority,
              "category": incident.category,
              "latitude": incident.latitude,
              "longitude": incident.longitude,
              "address": incident.address,
              "created_at": incident.created_at.isoformat()
         }
    }

@router.post("/status")
async def update_operational_status(
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    valid_statuses = ["Available", "Assigned", "Accepted", "Preparing", "En Route", "Delayed", "On Scene", "Transporting", "Returning", "Available Again"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid operational status choice. Choose from {valid_statuses}")

    # Find the current active assignment
    incident = db.query(Incident).filter(
        Incident.assigned_user_id == current_user.id,
        Incident.is_deleted == False
    ).order_by(Incident.created_at.desc()).first()

    if incident:
        prev_status = incident.status
        incident.status = status if status != "Available Again" else "Resolved"
        db.commit()

        # Log timeline
        timeline = ActivityTimeline(
            entity_type="Incident",
            entity_id=incident.id,
            action="STATUS_CHANGED",
            description=f"Unit '{current_user.full_name}' changed status from '{prev_status}' to '{status}'.",
            performed_by_id=current_user.id,
            performed_by_name=current_user.full_name
        )
        db.add(timeline)

    # Log Audit
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="RESPONDER_STATUS_CHANGED",
        affected_record=f"User:{current_user.id}, Status:{status}",
        ip_address="127.0.0.1"
    )
    db.add(audit)
    db.commit()

    # Broadcast websocket event
    await broadcast_to_all({
        "event": "status_changed",
        "data": {
            "user_id": str(current_user.id),
            "user_name": current_user.full_name,
            "status": status,
            "incident_id": str(incident.id) if incident else None
        }
    })
    await broadcast_to_all({"event": "statistics_updated", "data": {}})

    return {"status": "success", "message": f"Operational status updated to '{status}'"}

@router.post("/message")
async def send_dispatch_message(
    incident_id: str,
    message: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = DispatchMessage(
        incident_id=UUID(incident_id),
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        message=message
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    # Broadcast message to dispatch dashboards
    await broadcast_to_all({
        "event": "dispatch_message",
        "data": {
            "id": str(msg.id),
            "incident_id": str(msg.incident_id),
            "sender_id": str(msg.sender_id),
            "sender_name": msg.sender_name,
            "message": msg.message,
            "timestamp": msg.timestamp.isoformat()
        }
    })

    return {"status": "success", "message": "Message dispatched successfully."}

@router.get("/messages")
def get_dispatch_messages(incident_id: str, db: Session = Depends(get_db)):
    msgs = db.query(DispatchMessage).filter(
        DispatchMessage.incident_id == UUID(incident_id)
    ).order_by(DispatchMessage.timestamp.asc()).all()

    return [{
        "id": str(m.id),
        "sender_name": m.sender_name,
        "message": m.message,
        "timestamp": m.timestamp.isoformat()
    } for m in msgs]
