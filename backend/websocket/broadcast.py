from backend.websocket.connection_manager import manager
from backend.websocket.room_manager import rooms

async def broadcast_to_all(message: dict):
    """
    Broadcasts message to all connected clients
    """
    for user_id in list(manager.active_connections.keys()):
        try:
            await manager.send_personal_message(message, user_id)
        except Exception:
            manager.disconnect(user_id)

async def broadcast_to_room(room_id: str, message: dict):
    """
    Broadcasts message to members of a specific room
    """
    members = rooms.get_room_members(room_id)
    for user_id in list(members):
        try:
            await manager.send_personal_message(message, user_id)
        except Exception:
            rooms.leave_room(room_id, user_id)
            manager.disconnect(user_id)
