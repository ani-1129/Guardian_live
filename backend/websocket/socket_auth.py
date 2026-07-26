from typing import Optional
from backend.services.auth import AuthService

def authenticate_socket_token(token: str) -> Optional[dict]:
    """
    Decodes the JWT token passed during WebSocket connection and returns user info
    """
    if not token:
        return None
    
    # Strip Bearer prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
        
    payload = AuthService.decode_token(token)
    if payload and payload.get("type") == "access":
        return {"user_id": payload.get("sub"), "email": payload.get("email")}
    return None
