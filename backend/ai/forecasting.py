import math
from typing import Tuple, List

class AIForecastingService:
    @staticmethod
    def calculate_haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        Calculate distance between two coordinates in kilometers.
        """
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        R = 6371.0 # Earth radius
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @staticmethod
    def predict_eta_minutes(origin: Tuple[float, float], destination: Tuple[float, float], average_speed_kmh: float = 40.0) -> float:
        """
        Predicts ETA in minutes based on distance and expected travel speed.
        """
        distance = AIForecastingService.calculate_haversine_distance(origin, destination)
        if average_speed_kmh <= 0:
            average_speed_kmh = 40.0
        hours = distance / average_speed_kmh
        return hours * 60.0

    @staticmethod
    def detect_inactivity_anomaly(location_history: List[dict], max_stationary_minutes: int = 15) -> bool:
        """
        Heuristic to detect if a tracked responder shows static position for too long without reaching destination.
        """
        if len(location_history) < 2:
            return False
        
        # Check if coordinates changed significantly across recent tracking events
        first = location_history[0]
        last = location_history[-1]
        distance = AIForecastingService.calculate_haversine_distance(
            (first["lat"], first["lng"]),
            (last["lat"], last["lng"])
        )
        # If moved less than 10 meters in historical timeframe, flag anomaly
        return distance < 0.01
