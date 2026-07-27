from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.requests import Request
import time, os

from backend.database.session import engine
from backend.models.models import Base

# Routers
from backend.api.v1.auth import router as auth_router
from backend.api.v1.incidents import router as incident_router
from backend.api.v1.locations import router as location_router
from backend.api.v1.organizations import router as org_router
from backend.api.v1.users import router as user_router
from backend.api.v1.admin import router as admin_router
from backend.api.v1.settings import router as settings_router
from backend.api.v1.profile import router as profile_router
from backend.api.v1.geofences import router as geofences_router
from backend.api.v1.vehicles import router as vehicles_router
from backend.api.v1.equipment import router as equipment_router
from backend.api.v1.devices import router as devices_router
from backend.api.v1.notifications import router as notifications_router
from backend.api.v1.reports import router as reports_router
from backend.api.v1.analytics import router as analytics_router
from backend.api.v1.search import router as search_router
from backend.api.v1.upload import router as upload_router
from backend.api.v1.backups import router as backups_router
from backend.api.v1.import_export import router as import_router
from backend.api.v1.geocoding import router as geocoding_router
from backend.api.v1.responder import router as responder_router

from backend.websocket.event_manager import handle_websocket_connection

# Create tables for database compatibility
Base.metadata.create_all(bind=engine)
from backend.scripts.seed import seed
seed(drop_tables=False)

app = FastAPI(
    title="Guardian Live Enterprise API",
    version="1.0.0",
    description="Secure Real-Time Location Sharing & Emergency Dispatch API"
)

# Static Uploads directory
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing & Monitoring Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Include v1 REST Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(incident_router, prefix="/api/v1")
app.include_router(location_router, prefix="/api/v1")
app.include_router(org_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")
app.include_router(profile_router, prefix="/api/v1")
app.include_router(geofences_router, prefix="/api/v1")
app.include_router(vehicles_router, prefix="/api/v1")
app.include_router(equipment_router, prefix="/api/v1")
app.include_router(devices_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(upload_router, prefix="/api/v1")
app.include_router(backups_router, prefix="/api/v1")
app.include_router(import_router, prefix="/api/v1")
app.include_router(geocoding_router, prefix="/api/v1")
app.include_router(responder_router, prefix="/api/v1")

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    await handle_websocket_connection(websocket, token)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "guardian-backend", "timestamp": time.time()}

@app.get("/metrics")
def get_metrics():
    return {
        "active_websocket_connections": 8,
        "uptime_seconds": time.process_time()
    }
