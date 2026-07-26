import urllib.request
import urllib.parse
import json
from typing import Dict, Any, List, Optional
import math

USER_AGENT = "GuardianLiveEnterprise/1.0 (EmergencyDispatchPlatform)"

class GeocodingService:
    @staticmethod
    def validate_coordinates(lat: float, lng: float) -> bool:
        if lat is None or lng is None:
            return False
        return -90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0

    @staticmethod
    def forward_geocode(query: str) -> List[Dict[str, Any]]:
        """
        Converts text address query into latitude, longitude, and formatted address details using Nominatim OpenStreetMap API.
        """
        if not query or not query.strip():
            return []
            
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&addressdetails=1&limit=5"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                results = []
                for item in data:
                    addr = item.get("address", {})
                    results.append({
                        "latitude": float(item["lat"]),
                        "longitude": float(item["lon"]),
                        "formatted_address": item.get("display_name"),
                        "city": addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb"),
                        "state": addr.get("state"),
                        "country": addr.get("country"),
                        "postal_code": addr.get("postcode"),
                        "source": "OpenStreetMap/Nominatim"
                    })
                return results
        except Exception as e:
            print(f"[Geocoding Warning] Forward geocode failed: {e}")
            return []

    @staticmethod
    def reverse_geocode(lat: float, lng: float) -> Dict[str, Any]:
        """
        Converts latitude/longitude into human-readable formatted address using Nominatim OpenStreetMap API.
        """
        if not GeocodingService.validate_coordinates(lat, lng):
            return {"formatted_address": "Invalid Coordinates", "city": None, "country": None}

        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json&addressdetails=1"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                item = json.loads(resp.read().decode("utf-8"))
                addr = item.get("address", {})
                return {
                    "formatted_address": item.get("display_name") or f"{lat:.4f}°, {lng:.4f}°",
                    "city": addr.get("city") or addr.get("town") or addr.get("village") or addr.get("suburb"),
                    "state": addr.get("state"),
                    "country": addr.get("country"),
                    "postal_code": addr.get("postcode"),
                    "source": "OpenStreetMap/Nominatim"
                }
        except Exception as e:
            print(f"[Geocoding Warning] Reverse geocode failed: {e}")
            return {
                "formatted_address": f"{lat:.4f}°, {lng:.4f}°",
                "city": "Unknown",
                "country": "Unknown",
                "source": "Fallback Coordinates"
            }

    @staticmethod
    def calculate_haversine_distance(coord1: tuple, coord2: tuple) -> float:
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @staticmethod
    def get_route(start_lat: float, start_lng: float, end_lat: float, end_lng: float) -> Dict[str, Any]:
        """
        Calculates driving route polyline, distance in km, and duration in minutes using OSRM Routing API with database caching.
        """
        if not (GeocodingService.validate_coordinates(start_lat, start_lng) and GeocodingService.validate_coordinates(end_lat, end_lng)):
            return {"distance_km": 0, "duration_minutes": 0, "polyline": []}

        # Check Cache
        from backend.database.session import SessionLocal
        from backend.models.models import RouteCache
        
        db = SessionLocal()
        try:
            # Query Cache with tolerance
            tolerance = 0.0005
            cached = db.query(RouteCache).filter(
                RouteCache.origin_lat.between(start_lat - tolerance, start_lat + tolerance),
                RouteCache.origin_lng.between(start_lng - tolerance, start_lng + tolerance),
                RouteCache.dest_lat.between(end_lat - tolerance, end_lat + tolerance),
                RouteCache.dest_lng.between(end_lng - tolerance, end_lng + tolerance)
            ).first()

            if cached:
                return {
                    "distance_km": cached.distance_km,
                    "duration_minutes": cached.duration_min,
                    "polyline": json.loads(cached.geometry)
                }
        except Exception as ce:
            print(f"[Routing Cache Warning] Query failed: {ce}")
        finally:
            db.close()

        url = f"http://router.project-osrm.org/route/v1/driving/{start_lng},{start_lat};{end_lng},{end_lat}?overview=full&geometries=geojson"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

        route_info = None
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                routes = data.get("routes", [])
                if routes:
                    route = routes[0]
                    dist_km = route.get("distance", 0) / 1000.0
                    duration_min = route.get("duration", 0) / 60.0
                    coordinates = route.get("geometry", {}).get("coordinates", [])
                    # OSRM returns [lng, lat], convert to [lat, lng] for Leaflet
                    polyline = [[coord[1], coord[0]] for coord in coordinates]
                    route_info = {
                        "distance_km": round(dist_km, 2),
                        "duration_minutes": round(duration_min, 1),
                        "polyline": polyline
                    }
        except Exception as e:
            print(f"[Routing Warning] OSRM Route request failed: {e}")
            
        if not route_info:
            # Fallback straight-line polyline if OSRM unavailable
            dist = GeocodingService.calculate_haversine_distance((start_lat, start_lng), (end_lat, end_lng))
            route_info = {
                "distance_km": round(dist, 2),
                "duration_minutes": round((dist / 40.0) * 60.0, 1),
                "polyline": [[start_lat, start_lng], [end_lat, end_lng]]
            }

        # Save Cache
        db = SessionLocal()
        try:
            cache_entry = RouteCache(
                origin_lat=start_lat,
                origin_lng=start_lng,
                dest_lat=end_lat,
                dest_lng=end_lng,
                geometry=json.dumps(route_info["polyline"]),
                distance_km=route_info["distance_km"],
                duration_min=route_info["duration_minutes"]
            )
            db.add(cache_entry)
            db.commit()
        except Exception as se:
            print(f"[Routing Cache Warning] Save failed: {se}")
        finally:
            db.close()

        return route_info

