from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Dict

from backend.database.session import get_db
from backend.models.models import SystemSetting, User
from backend.schemas.schemas import SystemSettingUpdate, SystemSettingResponse
from backend.services.audit import AuditService
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "org_name": "City Emergency Dispatch & Safety Agency",
    "timezone": "UTC",
    "language": "en-US",
    "map_provider": "OpenStreetMap",
    "theme": "dark",
    "units": "metric",
    "email_notifications": "true",
    "sms_notifications": "false",
    "two_factor_auth_required": "false",
    "session_timeout_minutes": "60",
    "password_min_length": "8",
    "max_login_attempts": "5"
}

@router.get("/", response_model=Dict[str, str])
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSetting).all()
    res = DEFAULT_SETTINGS.copy()
    for s in settings:
        res[s.key] = s.value
    return res

@router.post("/")
def update_setting(
    setting_in: SystemSettingUpdate,
    req: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    setting = db.query(SystemSetting).filter(SystemSetting.key == setting_in.key).first()
    if not setting:
        setting = SystemSetting(key=setting_in.key, value=setting_in.value, category=setting_in.category or "General")
        db.add(setting)
    else:
        setting.value = setting_in.value
        if setting_in.category:
            setting.category = setting_in.category

    db.commit()
    AuditService.log_action(db, "SETTING_CHANGED", user_id=current_user.id, user_email=current_user.email, affected_record=f"{setting_in.key}={setting_in.value}", ip_address=req.client.host)
    return {"status": "success", "key": setting_in.key, "value": setting_in.value}
