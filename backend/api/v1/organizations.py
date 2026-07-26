from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from backend.database.session import get_db
from backend.models.models import Organization, User
from pydantic import BaseModel
from uuid import UUID

router = APIRouter(prefix="/organizations", tags=["organizations"])

class OrgCreate(BaseModel):
    name: str

class OrgResponse(BaseModel):
    id: UUID
    name: str
    class Config:
        from_attributes = True

@router.post("/", response_model=OrgResponse)
def create_organization(org_in: OrgCreate, db: Session = Depends(get_db)):
    org = Organization(name=org_in.name)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("/", response_model=List[OrgResponse])
def list_organizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Paginated list of active enterprise organizations.
    """
    return db.query(Organization).offset(skip).limit(limit).all()

@router.post("/{org_id}/users/{user_id}")
def associate_user_to_org(org_id: str, user_id: str, db: Session = Depends(get_db)):
    org = db.query(Organization).filter(Organization.id == org_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    if not org or not user:
        raise HTTPException(status_code=404, detail="Organization or User not found")
        
    user.organization_id = org.id
    db.commit()
    return {"status": "success", "message": f"Associated user {user.full_name} to org {org.name}"}
