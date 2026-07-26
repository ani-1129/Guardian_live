from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
import csv, io

from backend.database.session import get_db
from backend.models.models import Incident, User, Vehicle
from backend.services.reporting import ReportingService

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/export/csv")
def export_incidents_csv(db: Session = Depends(get_db)):
    incidents = db.query(Incident).filter(Incident.is_deleted == False).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Title", "Category", "Priority", "Status", "Address", "Created At"])
    
    for inc in incidents:
        writer.writerow([str(inc.id), inc.title, inc.category, inc.priority, inc.status, inc.address or "", inc.created_at.isoformat() if inc.created_at else ""])
        
    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=incidents_report.csv"}
    )

@router.get("/export/responders/csv")
def export_responders_csv(db: Session = Depends(get_db)):
    users = db.query(User).filter(User.is_deleted == False).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Full Name", "Email", "Phone", "Status", "Created At"])
    
    for u in users:
        writer.writerow([str(u.id), u.full_name, u.email, u.phone_number or "", "Active" if u.is_active else "Inactive", u.created_at.isoformat() if u.created_at else ""])
        
    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=responders_report.csv"}
    )
