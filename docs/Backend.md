# Backend Architecture Document

The backend is built on **FastAPI** with **SQLAlchemy** for database operations and **Socket.IO** for WebSocket streaming.

## Layered Execution Flow

```
HTTP/WS API Router (backend/api/v1/)
       ↓
Service Layer (backend/services/)
       ↓
Repository Layer (backend/repositories/)
       ↓
Database Model (backend/models/)
```

## Modules
- `backend/websocket/`: Connections and real-time channel rooms.
- `backend/workers/`: Celery asynchronous queue for report generation, notifications, and scheduled backups.
- `backend/ai/`: Predictive services for ETA, priority forecasting, and abnormal motion heuristics.
- `backend/repositories/`: Clean DB access abstractions separating queries from routes.
