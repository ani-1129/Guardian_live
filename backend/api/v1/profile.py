from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from backend.database.session import get_db
from backend.models.models import User, EmergencyContact, SessionRecord
from backend.schemas.schemas import UserResponse, UserProfileUpdate, UserPasswordUpdate, EmergencyContactCreate, EmergencyContactResponse, SessionRecordResponse
from backend.services.auth import AuthService
from backend.services.audit import AuditService
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        address=current_user.address,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        mfa_enabled=current_user.mfa_enabled,
        organization_id=current_user.organization_id,
        department_id=current_user.department_id,
        created_at=current_user.created_at,
        roles=[r.name for r in current_user.roles]
    )

@router.put("/me", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    req: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.phone_number is not None:
        current_user.phone_number = profile_in.phone_number
    if profile_in.address is not None:
        current_user.address = profile_in.address

    db.commit()
    db.refresh(current_user)
    AuditService.log_action(db, "PROFILE_UPDATED", user_id=current_user.id, user_email=current_user.email, ip_address=req.client.host)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone_number=current_user.phone_number,
        address=current_user.address,
        avatar_url=current_user.avatar_url,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        mfa_enabled=current_user.mfa_enabled,
        organization_id=current_user.organization_id,
        department_id=current_user.department_id,
        created_at=current_user.created_at,
        roles=[r.name for r in current_user.roles]
    )

@router.post("/password")
def change_password(
    pw_in: UserPasswordUpdate,
    req: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not AuthService.verify_password(pw_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    current_user.hashed_password = AuthService.hash_password(pw_in.new_password)
    db.commit()
    AuditService.log_action(db, "PASSWORD_CHANGED", user_id=current_user.id, user_email=current_user.email, ip_address=req.client.host)
    return {"status": "success", "message": "Password updated successfully"}

@router.get("/contacts", response_model=List[EmergencyContactResponse])
def get_emergency_contacts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(EmergencyContact).filter(EmergencyContact.user_id == current_user.id).all()

@router.post("/contacts", response_model=EmergencyContactResponse)
def add_emergency_contact(
    contact_in: EmergencyContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = EmergencyContact(
        user_id=current_user.id,
        name=contact_in.name,
        relationship=contact_in.relationship,
        phone=contact_in.phone,
        email=contact_in.email,
        is_primary=contact_in.is_primary
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.get("/sessions", response_model=List[SessionRecordResponse])
def get_active_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SessionRecord).filter(SessionRecord.user_id == current_user.id, SessionRecord.is_active == True).all()

@router.delete("/sessions/{id}")
def terminate_session(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(SessionRecord).filter(SessionRecord.id == id, SessionRecord.user_id == current_user.id).first()
    if session:
        session.is_active = False
        db.commit()
    return {"status": "success", "message": "Session terminated"}
