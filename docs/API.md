# REST & WebSocket API Documentation

## REST v1 API Endpoints

### Authentication
- `POST /api/v1/auth/register`: Create user account.
- `POST /api/v1/auth/login`: Authenticate user and retrieve JWT Access and Refresh Tokens.
- `POST /api/v1/auth/refresh`: Refresh expired Access Token using valid Refresh Token.
- `POST /api/v1/auth/logout`: Revoke active token.
- `POST /api/v1/auth/mfa/enable`: Initialize 2FA TOTP setup.
- `POST /api/v1/auth/mfa/verify`: Confirm 2FA setup.

### Location Tracking
- `POST /api/v1/locations`: Send batch locations (offline backup sync).
- `GET /api/v1/locations/latest`: Retrieve current locations of active responders.
- `GET /api/v1/locations/history`: Get path tracking log for timeline replay.

### Incident Management
- `POST /api/v1/incidents`: Register a new emergency incident.
- `GET /api/v1/incidents`: List all active, assigned, and resolved incidents.
- `PATCH /api/v1/incidents/{id}`: Modify details or update status (New -> Assigned -> Accepted -> En Route -> On Scene -> Resolved -> Closed).
- `POST /api/v1/dispatch/assign`: Assign responder to incident.

### Geofences
- `POST /api/v1/geofences`: Create safe zones, restricted areas, or boundaries.
- `GET /api/v1/geofences`: Get geofences for active tracking overlay.

---

## WebSocket Event API

- `connect`: Fired upon socket initiation. Requires authorization header.
- `user_online`: Sent when responder goes active.
- `location_update`: Payload: `{"latitude": float, "longitude": float, "speed": float, "battery": int}`.
- `sos_triggered`: Emitted by mobile app to broadcast urgent panic status.
- `geofence_enter` / `geofence_exit`: System notifications when coordinate breaches bounds.
