from sqlalchemy.orm import Session
from backend.models.models import Location, LocationHistory
from backend.repositories.base import BaseRepository

class LocationRepository(BaseRepository):
    def update_latest_location(self, user_id: str, latitude: float, longitude: float, speed: float = 0.0, heading: float = 0.0, battery: int = 100) -> Location:
        loc = self.db.query(Location).filter(Location.user_id == user_id).first()
        if not loc:
            loc = Location(user_id=user_id, latitude=latitude, longitude=longitude, speed=speed, heading=heading, battery_level=battery)
            self.db.add(loc)
        else:
            loc.latitude = latitude
            loc.longitude = longitude
            loc.speed = speed
            loc.heading = heading
            loc.battery_level = battery
        
        # Log history
        history = LocationHistory(user_id=user_id, latitude=latitude, longitude=longitude, speed=speed, heading=heading)
        self.db.add(history)
        
        self.db.commit()
        self.db.refresh(loc)
        return loc

    def get_latest_locations(self):
        return self.db.query(Location).all()
