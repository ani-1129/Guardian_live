from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from backend.database.session import get_db
from backend.models.models import User, Role, Organization, Department
from backend.schemas.schemas import UserCreate, UserUpdate, UserResponse, BulkDeleteRequest, BulkRoleAssignRequest, BulkSuspendRequest
from backend.services.auth import AuthService
from backend.services.audit import AuditService
from backend.middleware.auth import get_current_user, has_permission

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserResponse])
def get_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(User).filter(User.is_deleted == False)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter((User.full_name.ilike(search_pattern)) | (User.email.ilike(search_pattern)))
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if role:
        query = query.join(User.roles).filter(Role.name == role)
        
    users = query.offset(skip).limit(limit).all()
    
    response = []
    for u in users:
        u_dict = UserResponse(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            phone_number=u.phone_number,
            address=u.address,
            avatar_url=u.avatar_url,
            is_active=u.is_active,
            is_verified=u.is_verified,
            mfa_enabled=u.mfa_enabled,
            organization_id=u.organization_id,
            department_id=u.department_id,
            created_at=u.created_at,
            roles=[r.name for r in u.roles]
        )
        response.append(u_dict)
    return response

@router.post("/", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    req: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pw = AuthService.hash_password(user_in.password)
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pw,
        phone_number=user_in.phone_number,
        organization_id=user_in.organization_id or current_user.organization_id,
        department_id=user_in.department_id,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Assign default Responder role if no role specified
    responder_role = db.query(Role).filter(Role.name == "Responder").first()
    if responder_role:
        user.roles.append(responder_role)
        db.commit()

    AuditService.log_action(db, "USER_CREATED", user_id=current_user.id, user_email=current_user.email, affected_record=str(user.id), ip_address=req.client.host)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone_number=user.phone_number,
        address=user.address,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        mfa_enabled=user.mfa_enabled,
        organization_id=user.organization_id,
        department_id=user.department_id,
        created_at=user.created_at,
        roles=[r.name for r in user.roles]
    )

@router.get("/{id}", response_model=UserResponse)
def get_user_by_id(id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone_number=user.phone_number,
        address=user.address,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        mfa_enabled=user.mfa_enabled,
        organization_id=user.organization_id,
        department_id=user.department_id,
        created_at=user.created_at,
        roles=[r.name for r in user.roles]
    )

@router.put("/{id}", response_model=UserResponse)
def update_user(
    id: str,
    user_in: UserUpdate,
    req: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == id, User.is_deleted == False).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.email is not None:
        user.email = user_in.email
    if user_in.phone_number is not None:
        user.phone_number = user_in.phone_number
    if user_in.address is not None:
        user.address = user_in.address
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.organization_id is not None:
        user.organization_id = user_in.organization_id

    db.commit()
    db.refresh(user)
    AuditService.log_action(db, "USER_UPDATED", user_id=current_user.id, user_email=current_user.email, affected_record=str(user.id), ip_address=req.client.host)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone_number=user.phone_number,
        address=user.address,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_verified=user.is_verified,
        mfa_enabled=user.mfa_enabled,
        organization_id=user.organization_id,
        department_id=user.department_id,
        created_at=user.created_at,
        roles=[r.name for r in user.roles]
    )

@router.delete("/{id}")
def delete_user(
    id: str,
    req: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_deleted = True
    user.deleted_at = datetime.utcnow()
    user.deleted_by = current_user.email
    db.commit()

    AuditService.log_action(db, "USER_DELETED_SOFT", user_id=current_user.id, user_email=current_user.email, affected_record=str(user.id), ip_address=req.client.host)
    return {"status": "success", "message": f"User {user.full_name} soft deleted"}

@router.post("/bulk-delete")
def bulk_delete_users(
    bulk_in: BulkDeleteRequest,
    req: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).filter(User.id.in_([str(i) for i in bulk_in.ids])).all()
    for u in users:
        u.is_deleted = True
        u.deleted_at = datetime.utcnow()
        u.deleted_by = current_user.email
    db.commit()
    AuditService.log_action(db, "BULK_USERS_DELETED", user_id=current_user.id, user_email=current_user.email, affected_record=f"Count: {len(users)}", ip_address=req.client.host)
    return {"status": "success", "message": f"Deleted {len(users)} users"}

@router.post("/bulk-assign-role")
def bulk_assign_role(
    bulk_in: BulkRoleAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = db.query(Role).filter(Role.name == bulk_in.role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail=f"Role {bulk_in.role_name} not found")

    users = db.query(User).filter(User.id.in_([str(i) for i in bulk_in.user_ids])).all()
    for u in users:
        if role not in u.roles:
            u.roles.append(role)
    db.commit()
    return {"status": "success", "message": f"Assigned role {role.name} to {len(users)} users"}
