from fastapi import APIRouter, Query, HTTPException
from backend.services.geocoding import GeocodingService

router = APIRouter(prefix="/geocoding", tags=["geocoding"])

@router.get("/search")
def forward_geocode(q: str = Query(..., min_length=2)):
    """
    Search address text query and return list of geocoded geographic locations with coordinates.
    """
    results = GeocodingService.forward_geocode(q)
    return {"query": q, "results": results}

@router.get("/reverse")
def reverse_geocode(lat: float = Query(...), lng: float = Query(...)):
    """
    Convert latitude/longitude coordinates into human-readable formatted address.
    """
    if not GeocodingService.validate_coordinates(lat, lng):
        raise HTTPException(status_code=400, detail="Coordinates out of valid range (-90 to 90 lat, -180 to 180 lng)")

    result = GeocodingService.reverse_geocode(lat, lng)
    return result

@router.get("/route")
def calculate_route(
    start_lat: float = Query(...),
    start_lng: float = Query(...),
    end_lat: float = Query(...),
    end_lng: float = Query(...)
):
    """
    Calculate driving route polyline, distance in km, and estimated travel duration in minutes.
    """
    if not (GeocodingService.validate_coordinates(start_lat, start_lng) and GeocodingService.validate_coordinates(end_lat, end_lng)):
        raise HTTPException(status_code=400, detail="Invalid route coordinates")

    route_info = GeocodingService.get_route(start_lat, start_lng, end_lat, end_lng)
    return route_info
