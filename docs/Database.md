# Database Schema & Design Documentation

## Schema Diagram (Summary)

The database schema utilizes standard PostgreSQL foreign keys, default UUID identifiers, and spatial indexes on geolocations.

### Core Tables

#### `users`
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique, Indexed)
- `hashed_password` (VARCHAR)
- `full_name` (VARCHAR)
- `is_active` (BOOLEAN)
- `is_verified` (BOOLEAN)
- `mfa_secret` (VARCHAR, Optional)
- `mfa_enabled` (BOOLEAN)
- `organization_id` (UUID, Foreign Key)

#### `roles` & `permissions`
- RBAC is mapped through `user_roles` and role-permission tables enabling roles such as `Dispatcher`, `Responder`, `Supervisor`, and `Admin` with granular permissions (`can_assign_incident`, `can_view_location`, etc.).

#### `locations` & `location_history`
- `user_id` (UUID, Foreign Key)
- `latitude` (DOUBLE PRECISION)
- `longitude` (DOUBLE PRECISION)
- `speed` (FLOAT)
- `heading` (FLOAT)
- `battery_level` (INT)
- `timestamp` (TIMESTAMP WITH TIME ZONE, Indexed)

#### `incidents`
- `id` (UUID, Primary Key)
- `title` (VARCHAR)
- `description` (TEXT)
- `status` (VARCHAR: New, Assigned, Accepted, En Route, On Scene, Resolved, Closed)
- `priority` (VARCHAR: Low, Medium, High, Critical)
- `category` (VARCHAR: Medical, Fire, Police, Disaster, Search & Rescue)
- `latitude` (DOUBLE PRECISION)
- `longitude` (DOUBLE PRECISION)
- `organization_id` (UUID, Foreign Key)

#### `geofences`
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `boundary_type` (VARCHAR: Safe Zone, Restricted Area, Event Boundary)
- `coordinates` (JSON/Geometry for polygon definition)
- `organization_id` (UUID, Key)
