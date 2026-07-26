from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.schemas.schemas import UserCreate, UserLogin, UserResponse, Token
from backend.repositories.user import UserRepository
from backend.services.auth import AuthService
from backend.models.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    db_user = repo.get_by_email(user_in.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = AuthService.hash_password(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed,
        full_name=user_in.full_name,
        is_active=True,
        is_verified=True
    )
    return repo.create(user)

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    user = repo.get_by_email(user_in.email)
    if not user or not AuthService.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = AuthService.create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = AuthService.create_refresh_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout():
    return {"status": "success", "message": "Successfully logged out"}
