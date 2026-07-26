import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.models.models import Incident, Vehicle, User, Location, AuditLog, ActivityTimeline

SCENARIO_REQUIREMENTS = {
    "Fire": {
        "vehicles": ["Fire Truck", "Rescue Squad"],
        "roles": ["Supervisor", "Responder"],
        "critical_extra_vehicles": ["Police Cruiser"],
        "critical_extra_roles": ["Admin", "Chief Dispatcher"],
        "resources": ["Water Supply", "Rescue Equipment", "Command Vehicle"]
    },
    "Medical": {
        "vehicles": ["Ambulance"],
        "roles": ["Responder"],
        "critical_extra_vehicles": ["Ambulance", "Police Cruiser"],
        "critical_extra_roles": ["Supervisor"],
        "resources": ["ICU Ambulance", "Blood Bank Notification", "Defibrillator"]
    },
    "Road Accident": {
        "vehicles": ["Ambulance", "Police Cruiser"],
        "roles": ["Responder"],
        "critical_extra_vehicles": ["Rescue Squad", "Fire Truck"],
        "critical_extra_roles": ["Supervisor"],
        "resources": ["Jaws of Life", "Traffic Cones", "Tow Service"]
    },
    "Building Collapse": {
        "vehicles": ["Rescue Squad", "Fire Truck", "Ambulance", "Police Cruiser"],
        "roles": ["Supervisor", "Responder"],
        "critical_extra_vehicles": [],
        "critical_extra_roles": ["Admin", "Chief Dispatcher"],
        "resources": ["USAR Heavy Equipment", "K9 Search Unit", "Structural Shoring"]
    },
    "Gas Leak": {
        "vehicles": ["Fire Truck", "Police Cruiser", "Ambulance"],
        "roles": ["Responder"],
        "critical_extra_vehicles": [],
        "critical_extra_roles": ["Supervisor"],
        "resources": ["Hazmat Air Detector", "Evacuation Megaphones", "Breathing Apparatus"]
    },
    "Flood": {
        "vehicles": ["Rescue Squad", "Ambulance"],
        "roles": ["Responder", "Supervisor"],
        "critical_extra_vehicles": ["Fire Truck"],
        "critical_extra_roles": ["Admin"],
        "resources": ["Rescue Boats", "Life Vests", "Water Pumps", "Relief Supplies"]
    },
    "Earthquake": {
        "vehicles": ["Rescue Squad", "Fire Truck", "Ambulance", "Police Cruiser"],
        "roles": ["Responder", "Supervisor"],
        "critical_extra_vehicles": [],
        "critical_extra_roles": ["Admin", "Chief Dispatcher"],
        "resources": ["Disaster Emergency Kits", "Satellite Comms", "Temporary Shelters"]
    },
    "Bomb Threat": {
        "vehicles": ["Police Cruiser", "Fire Truck", "Ambulance"],
        "roles": ["Supervisor", "Responder"],
        "critical_extra_vehicles": ["Rescue Squad"],
        "critical_extra_roles": ["Admin"],
        "resources": ["Bomb Disposal Unit", "Explosive Sniffer Dogs", "Blast Shields"]
    },
    "Missing Person": {
        "vehicles": ["Police Cruiser"],
        "roles": ["Responder"],
        "critical_extra_vehicles": ["Rescue Squad"],
        "critical_extra_roles": ["Supervisor"],
        "resources": ["Search Drones", "Thermal Cameras", "K9 Trackers"]
    },
    "Security": {
        "vehicles": ["Police Cruiser"],
        "roles": ["Responder", "Supervisor"],
        "critical_extra_vehicles": ["Ambulance"],
        "critical_extra_roles": ["Admin"],
        "resources": ["Crowd Barriers", "Tactical Body Armor", "CCTV Monitoring Unit"]
    },
    "Other": {
        "vehicles": ["Ambulance", "Police Cruiser"],
        "roles": ["Responder"],
        "critical_extra_vehicles": [],
        "critical_extra_roles": [],
        "resources": ["Standard First Aid Kit", "Emergency Radio"]
    }
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance in kilometers using the Haversine formula."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 999.0
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_eta_minutes(distance_km: float, speed_kmh: float = 40.0) -> float:
    """Calculates estimated arrival time in minutes."""
    if speed_kmh <= 0:
        speed_kmh = 40.0
    time_hours = distance_km / speed_kmh
    return round(time_hours * 60.0, 1)

def get_dispatch_recommendations(db: Session, incident: Incident) -> Dict[str, Any]:
    cat = incident.category if incident.category in SCENARIO_REQUIREMENTS else "Other"
    rules = SCENARIO_REQUIREMENTS[cat]
    is_critical = incident.priority == "Critical"

    required_v_types = list(rules["vehicles"])
    if is_critical:
        required_v_types.extend(rules["critical_extra_vehicles"])

    # Query vehicles
    vehicles = db.query(Vehicle).filter(Vehicle.is_deleted == False).all()
    available_vehicles = [v for v in vehicles if v.status == "Available"]
    busy_vehicles = [v for v in vehicles if v.status != "Available"]

    recommendations = []
    
    # Evaluate vehicles
    for v in available_vehicles:
        dist = haversine_distance(incident.latitude, incident.longitude, v.latitude, v.longitude)
        eta = calculate_eta_minutes(dist, speed_kmh=v.speed if v.speed and v.speed > 0 else 45.0)
        
        matches_type = v.type in required_v_types
        score = (100 if matches_type else 40) - (dist * 2.0)

        recommendations.append({
            "unit_id": str(v.id),
            "unit_name": v.call_sign,
            "unit_type": v.type,
            "category": "Vehicle",
            "status": v.status,
            "distance_km": round(dist, 2),
            "eta_minutes": eta,
            "match_score": max(10, round(score, 1)),
            "reason": f"Matches required vehicle type [{v.type}] with {eta} min ETA." if matches_type else f"Available alternative vehicle ({v.type})."
        })

    # Sort recommendations by match_score descending
    recommendations.sort(key=lambda x: x["match_score"], reverse=True)

    # Check if Chief Dispatcher override is required (no matching available units)
    override_required = len([r for r in recommendations if r["status"] == "Available"]) == 0

    busy_recommendations = []
    if override_required:
        for v in busy_vehicles:
            dist = haversine_distance(incident.latitude, incident.longitude, v.latitude, v.longitude)
            eta = calculate_eta_minutes(dist)
            busy_recommendations.append({
                "unit_id": str(v.id),
                "unit_name": v.call_sign,
                "unit_type": v.type,
                "category": "Vehicle",
                "status": v.status,
                "distance_km": round(dist, 2),
                "eta_minutes": eta,
                "reason": f"Currently {v.status}. Chief Dispatcher override required to force re-assign."
            })

    return {
        "incident_id": str(incident.id),
        "category": cat,
        "priority": incident.priority,
        "override_required": override_required,
        "warning_message": "No available units match this incident. Chief Dispatcher approval is required." if override_required else None,
        "recommended_units": recommendations[:5],
        "busy_units_for_override": busy_recommendations[:5],
        "suggested_resources": rules["resources"]
    }
