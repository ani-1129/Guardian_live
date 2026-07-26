from typing import Dict, Set
from fastapi import WebSocket

class RoomManager:
    def __init__(self):
        # Maps roomId -> Set of user_ids
        self.rooms: Dict[str, Set[str]] = {}

    def join_room(self, room_id: str, user_id: str):
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(user_id)

    def leave_room(self, room_id: str, user_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].discard(user_id)
            if not self.rooms[room_id]:
                del self.rooms[room_id]

    def get_room_members(self, room_id: str) -> Set[str]:
        return self.rooms.get(room_id, set())

rooms = RoomManager()
