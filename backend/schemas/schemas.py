from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    organization_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    phone_number: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None
    organization_id: Optional[UUID] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class UserResponse(UserBase):
    id: UUID
    phone_number: Optional[str] = None
    address: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    mfa_enabled: bool
    organization_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    created_at: datetime
    roles: List[str] = []
    
    class Config:
        from_attributes = True

# Organization Schemas
class OrgCreate(BaseModel):
    name: str
    code: Optional[str] = None

class OrgResponse(BaseModel):
    id: UUID
    name: str
    code: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Department Schemas
class DepartmentCreate(BaseModel):
    name: str
    code: Optional[str] = None
    organization_id: UUID

class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    code: Optional[str] = None
    organization_id: UUID
    created_at: datetime
    class Config:
        from_attributes = True

# Role & Permission Schemas
class PermissionResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    permissions: List[PermissionResponse] = []
    class Config:
        from_attributes = True

# Location Schemas
class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    speed: Optional[float] = 0.0
    heading: Optional[float] = 0.0
    battery_level: Optional[int] = 100
    organization_id: Optional[UUID] = None

class LocationResponse(BaseModel):
    user_id: UUID
    user_name: Optional[str] = "Responder"
    latitude: float
    longitude: float
    speed: float
    heading: float
    battery_level: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Incident Schemas
class IncidentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "Medium" # Low, Medium, High, Critical
    category: str = "Other" # Medical, Fire, Police, Disaster, Search & Rescue
    latitude: float
    longitude: float
    address: Optional[str] = None
    district: Optional[str] = None
    organization_id: UUID
    assigned_user_id: Optional[UUID] = None

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assigned_user_id: Optional[UUID] = None

class IncidentCommentCreate(BaseModel):
    comment: str

class IncidentCommentResponse(BaseModel):
    id: UUID
    incident_id: UUID
    user_id: UUID
    user_name: str
    comment: str
    created_at: datetime
    class Config:
        from_attributes = True

class IncidentResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    category: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    district: Optional[str] = None
    assigned_user_id: Optional[UUID] = None
    organization_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Geofence Schemas
class GeofenceCreate(BaseModel):
    name: str
    boundary_type: str = "Polygon" # Polygon, Circle, Rectangle
    coordinates: str # JSON string representation
    organization_id: UUID
    is_active: bool = True
    alert_on_entry: bool = True
    alert_on_exit: bool = True

class GeofenceUpdate(BaseModel):
    name: Optional[str] = None
    boundary_type: Optional[str] = None
    coordinates: Optional[str] = None
    is_active: Optional[bool] = None
    alert_on_entry: Optional[bool] = None
    alert_on_exit: Optional[bool] = None

class GeofenceResponse(BaseModel):
    id: UUID
    name: str
    boundary_type: str
    coordinates: str
    organization_id: UUID
    is_active: bool
    alert_on_entry: bool
    alert_on_exit: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Vehicle Schemas
class VehicleCreate(BaseModel):
    call_sign: str
    type: str = "Ambulance"
    license_plate: Optional[str] = None
    organization_id: UUID
    assigned_user_id: Optional[UUID] = None

class VehicleUpdate(BaseModel):
    call_sign: Optional[str] = None
    type: Optional[str] = None
    license_plate: Optional[str] = None
    status: Optional[str] = None
    battery_level: Optional[int] = None
    speed: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    assigned_user_id: Optional[UUID] = None

class VehicleResponse(BaseModel):
    id: UUID
    call_sign: str
    type: str
    license_plate: Optional[str] = None
    status: str
    battery_level: int
    speed: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    organization_id: UUID
    assigned_user_id: Optional[UUID] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Equipment Schemas
class EquipmentCreate(BaseModel):
    name: str
    serial_number: Optional[str] = None
    type: str = "General"
    organization_id: UUID
    assigned_user_id: Optional[UUID] = None

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    serial_number: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    assigned_user_id: Optional[UUID] = None

class EquipmentResponse(BaseModel):
    id: UUID
    name: str
    serial_number: Optional[str] = None
    type: str
    status: str
    organization_id: UUID
    assigned_user_id: Optional[UUID] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Device Schemas
class DeviceResponse(BaseModel):
    id: UUID
    device_name: str
    device_type: str
    os_version: Optional[str] = None
    user_id: UUID
    is_trusted: bool
    last_active: datetime
    ip_address: Optional[str] = None
    class Config:
        from_attributes = True

# Notification Schemas
class NotificationCreate(BaseModel):
    title: str
    body: str
    type: str = "info" # critical, warning, info
    priority: str = "Medium"
    user_id: Optional[UUID] = None

class NotificationResponse(BaseModel):
    id: UUID
    title: str
    body: str
    type: str
    priority: str
    user_id: Optional[UUID] = None
    is_read: bool
    is_pinned: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Emergency Contact Schemas
class EmergencyContactCreate(BaseModel):
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None
    is_primary: bool = False

class EmergencyContactResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    relationship: str
    phone: str
    email: Optional[str] = None
    is_primary: bool
    created_at: datetime
    class Config:
        from_attributes = True

# Audit & Session Schemas
class AuditLogResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    action: str
    affected_record: Optional[str] = None
    ip_address: Optional[str] = None
    browser: Optional[str] = None
    timestamp: datetime
    class Config:
        from_attributes = True

class SessionRecordResponse(BaseModel):
    id: UUID
    token_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# Setting Schemas
class SystemSettingUpdate(BaseModel):
    key: str
    value: str
    category: Optional[str] = "General"

class SystemSettingResponse(BaseModel):
    id: UUID
    key: str
    value: str
    category: str
    updated_at: datetime
    class Config:
        from_attributes = True

# Activity Timeline
class ActivityTimelineResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    description: Optional[str] = None
    performed_by_name: Optional[str] = None
    timestamp: datetime
    class Config:
        from_attributes = True

# Bulk Request Schemas
class BulkDeleteRequest(BaseModel):
    ids: List[UUID]

class BulkRoleAssignRequest(BaseModel):
    user_ids: List[UUID]
    role_name: str

class BulkSuspendRequest(BaseModel):
    user_ids: List[UUID]
    suspend: bool = True
