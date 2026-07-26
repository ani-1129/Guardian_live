from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import csv, io

from backend.database.session import get_db
from backend.models.models import User, Role, Organization
from backend.services.auth import AuthService

router = APIRouter(prefix="/import", tags=["import"])

@router.post("/users/csv")
async def import_users_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    text = content.decode("utf-8")
    csv_reader = csv.DictReader(io.StringIO(text))

    imported_count = 0
    errors = []
    responder_role = db.query(Role).filter(Role.name == "Responder").first()
    default_org = db.query(Organization).first()

    for idx, row in enumerate(csv_reader, start=1):
        email = row.get("email") or row.get("Email")
        full_name = row.get("full_name") or row.get("Name") or row.get("Full Name")
        if not email or not full_name:
            errors.append(f"Row {idx}: Missing email or full_name")
            continue

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            errors.append(f"Row {idx}: User {email} already exists")
            continue

        user = User(
            email=email,
            full_name=full_name,
            hashed_password=AuthService.hash_password("defaultpass123"),
            organization_id=default_org.id if default_org else None,
            is_active=True,
            is_verified=True
        )
        if responder_role:
            user.roles.append(responder_role)

        db.add(user)
        imported_count += 1

    db.commit()
    return {
        "status": "success",
        "imported_count": imported_count,
        "failed_count": len(errors),
        "errors": errors
    }
