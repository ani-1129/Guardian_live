from fastapi import WebSocket, WebSocketDisconnect
from backend.websocket.connection_manager import manager
from backend.websocket.socket_auth import authenticate_socket_token
from backend.websocket.location_stream import handle_location_stream_update
from backend.websocket.room_manager import rooms

async def handle_websocket_connection(websocket: WebSocket, token: str):
    user_info = authenticate_socket_token(token)
    if not user_info:
        await websocket.close(code=4001) # Unauthorized
        return
        
    user_id = user_info["user_id"]
    await manager.connect(user_id, websocket)
    
    # Auto join global tracking room for convenience
    rooms.join_room("global_tracking", user_id)
    
    try:
        while True:
            # Expect client updates
            data = await websocket.receive_json()
            event = data.get("event")
            
            if event == "location_ping":
                await handle_location_stream_update(user_id, data)
            elif event == "join_room":
                room_id = data.get("room_id")
                if room_id:
                    rooms.join_room(room_id, user_id)
            elif event == "leave_room":
                room_id = data.get("room_id")
                if room_id:
                    rooms.leave_room(room_id, user_id)
                    
    except WebSocketDisconnect:
        rooms.leave_room("global_tracking", user_id)
        manager.disconnect(user_id)
