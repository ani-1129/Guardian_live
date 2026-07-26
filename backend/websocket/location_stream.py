from backend.websocket.broadcast import broadcast_to_room
from backend.repositories.location import LocationRepository
from backend.database.session import SessionLocal

async def handle_location_stream_update(user_id: str, data: dict):
    """
    Handles live geolocation stream data payload, stores in DB and broadcasts.
    """
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    speed = data.get("speed", 0.0)
    heading = data.get("heading", 0.0)
    battery = data.get("battery_level", 100)
    org_id = data.get("organization_id")
    
    if latitude is None or longitude is None:
        return
        
    # Write to DB using SessionLocal
    db = SessionLocal()
    try:
        repo = LocationRepository(db)
        repo.update_latest_location(
            user_id=user_id,
            latitude=latitude,
            longitude=longitude,
            speed=speed,
            heading=heading,
            battery=battery
        )
    finally:
        db.close()
        
    # Stream/broadcast payload
    payload = {
        "event": "location_update",
        "user_id": user_id,
        "latitude": latitude,
        "longitude": longitude,
        "speed": speed,
        "heading": heading,
        "battery_level": battery
    }
    
    # Broadcast to org-specific room if available
    if org_id:
        await broadcast_to_room(f"org_{org_id}", payload)
    else:
        await broadcast_to_room("global_tracking", payload)
