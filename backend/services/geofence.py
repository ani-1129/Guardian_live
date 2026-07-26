from typing import List, Tuple

class GeofenceService:
    @staticmethod
    def is_point_in_polygon(point: Tuple[float, float], polygon: List[Tuple[float, float]]) -> bool:
        """
        Ray-casting algorithm to determine if a point (latitude, longitude)
        is inside a polygon defined by a list of coordinates.
        """
        x, y = point
        inside = False
        n = len(polygon)
        if n < 3:
            return False

        p1x, p1y = polygon[0]
        for i in range(n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y

        return inside

    @staticmethod
    def check_geofence_breach(point: Tuple[float, float], boundary_type: str, polygon: List[Tuple[float, float]]) -> str:
        """
        Returns status regarding whether user has breached a boundary or safe zone limit.
        """
        is_inside = GeofenceService.is_point_in_polygon(point, polygon)
        if boundary_type == "Restricted Area" and is_inside:
            return "BREACH_ENTER_RESTRICTED"
        elif boundary_type == "Safe Zone" and not is_inside:
            return "BREACH_EXIT_SAFE"
        return "OK"
