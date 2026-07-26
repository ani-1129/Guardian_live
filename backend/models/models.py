import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Table, Integer, Text, JSON, TypeDecorator
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# Cross-platform GUID type decorator for SQLite and PostgreSQL compatibility
class GUID(TypeDecorator):
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        try:
            return uuid.UUID(value)
        except ValueError:
            return value

# Join table for Roles and Permissions (PBAC)
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', GUID(), ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', GUID(), ForeignKey('permissions.id'), primary_key=True)
)

# Join table for Users and Roles (RBAC)
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', GUID(), ForeignKey('users.id'), primary_key=True),
    Column('role_id', GUID(), ForeignKey('roles.id'), primary_key=True)
)

class Organization(Base):
    __tablename__ = 'organizations'
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    logo_url = Column(String(500), nullable=True)
    
    # Address details
    address_line = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="organization")
    departments = relationship("Department", back_populates="organization")
    vehicles = relationship("Vehicle", back_populates="organization")

class Department(Base):
    __tablename__ = 'departments'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True)
    organization_id = Column(GUID(), ForeignKey('organizations.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="departments")

class Role(Base):
    __tablename__ = 'roles'
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

class Permission(Base):
    __tablename__ = 'permissions'
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False) # e.g. "users:create", "incidents:assign"
    description = Column(String(255))
    
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class User(Base):
    __tablename__ = 'users'
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    address = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String(100), nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(255), nullable=True)

    organization_id = Column(GUID(), ForeignKey('organizations.id'), nullable=True)
    department_id = Column(GUID(), ForeignKey('departments.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    organization = relationship("Organization", back_populates="users")
    roles = relationship("Role", secondary=user_roles)
    locations = relationship("Location", back_populates="user", uselist=False)

class Location(Base):
    __tablename__ = 'locations'
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey('users.id'), unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, default=0.0)
    heading = Column(Float, default=0.0)
    battery_level = Column(Integer, default=100)
    
    # Reverse geocoded address
    formatted_address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    geocoded_at = Column(DateTime, nullable=True)
    geocode_source = Column(String(100), default="OpenStreetMap/Nominatim")
    
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="locations")

class LocationHistory(Base):
    __tablename__ = 'location_history'
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey('users.id'), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, default=0.0)
    heading = Column(Float, default=0.0)
    formatted_address = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = 'incidents'
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="New") # New, Assigned, Accepted, En Route, On Scene, Resolved, Closed
    priority = Column(String(50), default="Medium") # Low, Medium, High, Critical
    category = Column(String(50), default="Other") # Medical, Fire, Police, Disaster, Search & Rescue
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    district = Column(String(100), nullable=True)
    geocoded_at = Column(DateTime, default=datetime.utcnow)
    geocode_source = Column(String(100), default="OpenStreetMap/Nominatim")
    
    assigned_user_id = Column(GUID(), ForeignKey('users.id'), nullable=True)
    organization_id = Column(GUID(), ForeignKey('organizations.id'), nullable=False)
    
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class IncidentComment(Base):
    __tablename__ = 'incident_comments'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    incident_id = Column(GUID(), ForeignKey('incidents.id'), nullable=False)
    user_id = Column(GUID(), ForeignKey('users.id'), nullable=False)
    user_name = Column(String(255), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class IncidentAttachment(Base):
    __tablename__ = 'incident_attachments'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    incident_id = Column(GUID(), ForeignKey('incidents.id'), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Geofence(Base):
    __tablename__ = 'geofences'
    
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    boundary_type = Column(String(50), default="Polygon") # Polygon, Circle, Rectangle
    coordinates = Column(Text, nullable=False) # JSON encoded coordinate list / center+radius
    organization_id = Column(GUID(), ForeignKey('organizations.id'), nullable=False)
    is_active = Column(Boolean, default=True)
    alert_on_entry = Column(Boolean, default=True)
    alert_on_exit = Column(Boolean, default=True)
    
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Vehicle(Base):
    __tablename__ = 'vehicles'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    call_sign = Column(String(100), nullable=False, unique=True)
    type = Column(String(50), default="Ambulance") # Ambulance, Fire Truck, Police Cruiser, Rescue Squad
    license_plate = Column(String(50), nullable=True)
    status = Column(String(50), default="Available") # Available, En Route, On Scene, Maintenance
    battery_level = Column(Integer, default=100)
    speed = Column(Float, default=0.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    formatted_address = Column(String(255), nullable=True)
    
    organization_id = Column(GUID(), ForeignKey('organizations.id'), nullable=False)
    assigned_user_id = Column(GUID(), ForeignKey('users.id'), nullable=True)
    
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="vehicles")

class Equipment(Base):
    __tablename__ = 'equipment'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    serial_number = Column(String(100), nullable=True)
    type = Column(String(50), default="General") # Medical Kit, Hazmat Suit, Radio, Defibrillator
    status = Column(String(50), default="Ready") # Ready, In Use, Under Repair
    assigned_user_id = Column(GUID(), ForeignKey('users.id'), nullable=True)
    organization_id = Column(GUID(), ForeignKey('organizations.id'), nullable=False)
    
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Device(Base):
    __tablename__ = 'devices'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    device_name = Column(String(255), nullable=False)
    device_type = Column(String(50), default="Mobile") # Mobile, Tablet, Workstation
    os_version = Column(String(50), nullable=True)
    user_id = Column(GUID(), ForeignKey('users.id'), nullable=False)
    is_trusted = Column(Boolean, default=True)
    last_active = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    type = Column(String(50), default="info") # critical, warning, info
    priority = Column(String(50), default="Medium")
    user_id = Column(GUID(), ForeignKey('users.id'), nullable=True) # None = system-wide
    is_read = Column(Boolean, default=False)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class EmergencyContact(Base):
    __tablename__ = 'emergency_contacts'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey('users.id'), nullable=False)
    name = Column(String(255), nullable=False)
    relationship = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(255), nullable=False) # e.g. "USER_LOGIN", "INCIDENT_CREATED"
    affected_record = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    browser = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SessionRecord(Base):
    __tablename__ = 'session_records'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey('users.id'), nullable=False)
    token_id = Column(String(255), nullable=False)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

class SystemSetting(Base):
    __tablename__ = 'system_settings'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    category = Column(String(50), default="General") # General, Email, SMS, Security, Map
    updated_at = Column(DateTime, default=datetime.utcnow)

class ActivityTimeline(Base):
    __tablename__ = 'activity_timeline'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(50), nullable=False) # Incident, User, Vehicle
    entity_id = Column(GUID(), nullable=False)
    action = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    performed_by_id = Column(GUID(), nullable=True)
    performed_by_name = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SavedFilter(Base):
    __tablename__ = 'saved_filters'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey('users.id'), nullable=False)
    filter_name = Column(String(100), nullable=False)
    filter_config = Column(Text, nullable=False) # JSON encoded
    created_at = Column(DateTime, default=datetime.utcnow)

class BackupRecord(Base):
    __tablename__ = 'backup_records'
 
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, default=0)
    status = Column(String(50), default="Completed")
    created_at = Column(DateTime, default=datetime.utcnow)

class DispatchMessage(Base):
    __tablename__ = 'dispatch_messages'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    incident_id = Column(GUID(), ForeignKey('incidents.id'), nullable=False)
    sender_id = Column(GUID(), ForeignKey('users.id'), nullable=False)
    sender_name = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class RouteCache(Base):
    __tablename__ = 'route_caches'

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lng = Column(Float, nullable=False)
    geometry = Column(Text, nullable=False)
    distance_km = Column(Float, nullable=False)
    duration_min = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)

