# Architecture Design Document

## 1. Context and Scope
Guardian Live Enterprise is a mission-critical platform designed to enable secure, real-time location sharing and emergency dispatch. It scales horizontally and separates concerns into clear service domains.

## 2. Component Design

### Client Layer
- **Dashboard (Next.js)**: Used by dispatchers, organization admins, and supervisors. Built on Next.js 14+ with App Router. Communicates via REST and Socket.IO.
- **Mobile Client (React Native Expo)**: Used by responders and field agents to securely stream geolocation. Runs background tasks and includes offline SQLite sync.

### Gateway Layer
- **Nginx Reverse Proxy**: Offloads SSL termination, directs requests to HTTP `/api/` or `/socket.io/` paths, handles CORS settings, and applies basic rate limiting.

### Backend Layer (FastAPI)
- **REST Endpoints**: FastAPI handlers built upon a Repository-Service architectural pattern.
- **WebSocket Gateway (Socket.IO)**: Manages connections, coordinates real-time location streaming, maps active users to rooms based on organization or incident boundaries.
- **Asynchronous Task Queue (Celery & Redis)**: Executes long-running tasks asynchronously (e.g., generating PDF reports, scrubbing old location history, firing background emails/SMS).

### Storage & Cache Layer
- **PostgreSQL**: Stores relational transactional data including users, incidents, geofences, and logs. Spatially indexed using PostGIS/SQLAlchemy geometry.
- **Redis Cache & Session Store**: Temporarily holds active tracking coordinates, manages token denylist for logout/revocation, and acts as Celery's message broker.

## 3. Real-Time Stream Design
```
Mobile GPS -> WebSocket (location_update) -> Socket.IO server -> Redis Cache (Latest Coordinates)
                                                                 -> Celery (Write to Location History DB)
                                                                 -> Rooms (Broadcast to online Dispatchers)
```
This guarantees sub-second UI updates on the Live Map without bottlenecking PostgreSQL writes.
