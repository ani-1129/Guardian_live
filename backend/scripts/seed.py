from backend.database.session import SessionLocal, engine
from backend.models.models import Base, Organization, Department, User, Incident, Role, Permission, Vehicle, Equipment, Geofence, Location, SystemSetting
from backend.services.auth import AuthService
import json

def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Organizations
        org_fire = db.query(Organization).filter(Organization.name == "City Fire Dept").first()
        if not org_fire:
            org_fire = Organization(
                name="City Fire Dept",
                code="CFD-01",
                address_line="250 Hudson St",
                city="New York",
                state="NY",
                country="United States",
                postal_code="10013",
                latitude=40.7258,
                longitude=-74.0078
            )
            db.add(org_fire)
        
        org_ems = db.query(Organization).filter(Organization.name == "Metro EMS Services").first()
        if not org_ems:
            org_ems = Organization(
                name="Metro EMS Services",
                code="EMS-02",
                address_line="100 W 33rd St",
                city="New York",
                state="NY",
                country="United States",
                postal_code="10001",
                latitude=40.7490,
                longitude=-73.9880
            )
            db.add(org_ems)

        db.commit()
        db.refresh(org_fire)
        if org_ems:
            db.refresh(org_ems)

        # 2. Departments
        dept_ops = db.query(Department).filter(Department.name == "Operations").first()
        if not dept_ops:
            dept_ops = Department(name="Operations", code="OPS", organization_id=org_fire.id)
            db.add(dept_ops)
            db.commit()
            db.refresh(dept_ops)

        # 3. Permissions
        permissions_list = [
            ("users:view", "View users"),
            ("users:create", "Create users"),
            ("users:edit", "Edit users"),
            ("users:delete", "Delete users"),
            ("incidents:view", "View incidents"),
            ("incidents:create", "Create incidents"),
            ("incidents:assign", "Assign responders"),
            ("incidents:close", "Close incidents"),
            ("reports:export", "Export reports"),
            ("analytics:view", "View analytics"),
            ("settings:edit", "Edit settings"),
        ]

        perm_objs = {}
        for p_name, p_desc in permissions_list:
            p = db.query(Permission).filter(Permission.name == p_name).first()
            if not p:
                p = Permission(name=p_name, description=p_desc)
                db.add(p)
            perm_objs[p_name] = p
        db.commit()

        # 4. Roles
        roles_data = ["Admin", "Dispatcher", "Responder", "Supervisor"]
        role_objs = {}
        for r_name in roles_data:
            r = db.query(Role).filter(Role.name == r_name).first()
            if not r:
                r = Role(name=r_name, description=f"{r_name} role")
                db.add(r)
            role_objs[r_name] = r
        db.commit()

        # Assign permissions to Admin
        for p in perm_objs.values():
            if p not in role_objs["Admin"].permissions:
                role_objs["Admin"].permissions.append(p)
        db.commit()

        # 5. Users & Responders with Real Addresses
        users_seed = [
            {
                "email": "dispatcher@cityfire.gov",
                "full_name": "Chief Dispatcher",
                "role": "Admin",
                "phone": "+1 (555) 019-2831",
                "address": "250 Hudson St, New York, NY 10013",
                "lat": 40.7258, "lng": -74.0078,
                "org_id": org_fire.id
            },
            {
                "email": "alex.rivers@cityfire.gov",
                "full_name": "Capt. Alex Rivers",
                "role": "Supervisor",
                "phone": "+1 (555) 234-5678",
                "address": "Grand Central Terminal, New York, NY 10017",
                "lat": 40.7527, "lng": -73.9772,
                "org_id": org_fire.id
            },
            {
                "email": "sarah.chen@cityfire.gov",
                "full_name": "Lt. Sarah Chen",
                "role": "Responder",
                "phone": "+1 (555) 876-5432",
                "address": "Times Square, New York, NY 10036",
                "lat": 40.7580, "lng": -73.9855,
                "org_id": org_fire.id
            },
            {
                "email": "marcus.vance@metroems.gov",
                "full_name": "Paramedic Marcus Vance",
                "role": "Responder",
                "phone": "+1 (555) 432-1098",
                "address": "Empire State Building, New York, NY 10001",
                "lat": 40.7484, "lng": -73.9857,
                "org_id": org_ems.id if org_ems else org_fire.id
            }
        ]

        for udata in users_seed:
            u = db.query(User).filter(User.email == udata["email"]).first()
            if not u:
                u = User(
                    email=udata["email"],
                    full_name=udata["full_name"],
                    hashed_password=AuthService.hash_password("adminpass123"),
                    phone_number=udata["phone"],
                    address=udata["address"],
                    is_active=True,
                    is_verified=True,
                    organization_id=udata["org_id"],
                    department_id=dept_ops.id if dept_ops else None
                )
                u.roles.append(role_objs[udata["role"]])
                db.add(u)
                db.commit()
                db.refresh(u)

                # Seed location
                loc = Location(
                    user_id=u.id,
                    latitude=udata["lat"],
                    longitude=udata["lng"],
                    speed=14.2 if udata["role"] == "Responder" else 0.0,
                    heading=90.0,
                    battery_level=96,
                    formatted_address=udata["address"],
                    city="New York",
                    state="NY",
                    country="United States"
                )
                db.add(loc)
                db.commit()

        # 6. Fleet Vehicles
        vehicles_seed = [
            {"call_sign": "Engine 04", "type": "Fire Truck", "status": "Available", "lat": 40.7258, "lng": -74.0078, "address": "250 Hudson St, New York, NY"},
            {"call_sign": "Rescue Squad 2", "type": "Rescue Squad", "status": "En Route", "lat": 40.7580, "lng": -73.9855, "address": "Times Square, New York, NY"},
            {"call_sign": "Medic 12", "type": "Ambulance", "status": "Available", "lat": 40.7484, "lng": -73.9857, "address": "Empire State Bldg, New York, NY"},
            {"call_sign": "Command Alpha", "type": "Police Cruiser", "status": "On Scene", "lat": 40.7527, "lng": -73.9772, "address": "Grand Central, New York, NY"}
        ]

        for vdata in vehicles_seed:
            v = db.query(Vehicle).filter(Vehicle.call_sign == vdata["call_sign"]).first()
            if not v:
                v = Vehicle(
                    call_sign=vdata["call_sign"],
                    type=vdata["type"],
                    status=vdata["status"],
                    latitude=vdata["lat"],
                    longitude=vdata["lng"],
                    formatted_address=vdata["address"],
                    organization_id=org_fire.id
                )
                db.add(v)
        db.commit()

        # 7. Equipment
        equipment_seed = [
            {"name": "Defibrillator X1", "serial": "DEF-90812", "type": "Medical Kit", "status": "Ready"},
            {"name": "Hazmat Air Detector", "serial": "HAZ-33211", "type": "Hazmat Detector", "status": "Ready"},
            {"name": "Tactical Radio Comm Unit", "serial": "RAD-77123", "type": "Radio", "status": "In Use"}
        ]
        for eqdata in equipment_seed:
            eq = db.query(Equipment).filter(Equipment.name == eqdata["name"]).first()
            if not eq:
                eq = Equipment(
                    name=eqdata["name"],
                    serial_number=eqdata["serial"],
                    type=eqdata["type"],
                    status=eqdata["status"],
                    organization_id=org_fire.id
                )
                db.add(eq)
        db.commit()

        # 8. Incidents with Verified Coordinates & Addresses
        incidents_seed = [
            {
                "title": "Commercial Structure Fire - Times Square",
                "description": "2-alarm commercial building fire near Broadway & W 42nd St.",
                "priority": "Critical",
                "category": "Fire",
                "status": "En Route",
                "address": "Broadway & W 42nd St, Times Square, New York, NY 10036",
                "city": "New York", "state": "NY", "country": "United States", "postal_code": "10036",
                "lat": 40.7560, "lng": -73.9868
            },
            {
                "title": "Medical Emergency - Cardiac Arrest",
                "description": "Adult male collapsed near Grand Central Terminal entrance.",
                "priority": "High",
                "category": "Medical",
                "status": "On Scene",
                "address": "89 E 42nd St, Grand Central Terminal, New York, NY 10017",
                "city": "New York", "state": "NY", "country": "United States", "postal_code": "10017",
                "lat": 40.7527, "lng": -73.9772
            },
            {
                "title": "Multi-Vehicle Collision",
                "description": "3-vehicle accident blocking FDR Drive south-bound exit.",
                "priority": "Medium",
                "category": "Police",
                "status": "Assigned",
                "address": "FDR Drive & E 34th St, New York, NY 10016",
                "city": "New York", "state": "NY", "country": "United States", "postal_code": "10016",
                "lat": 40.7431, "lng": -73.9712
            }
        ]

        for incdata in incidents_seed:
            inc = db.query(Incident).filter(Incident.title == incdata["title"]).first()
            if not inc:
                inc = Incident(
                    title=incdata["title"],
                    description=incdata["description"],
                    priority=incdata["priority"],
                    category=incdata["category"],
                    status=incdata["status"],
                    address=incdata["address"],
                    city=incdata["city"],
                    state=incdata["state"],
                    country=incdata["country"],
                    postal_code=incdata["postal_code"],
                    latitude=incdata["lat"],
                    longitude=incdata["lng"],
                    organization_id=org_fire.id
                )
                db.add(inc)
        db.commit()

        # 9. Geofences
        geo_harbor = db.query(Geofence).filter(Geofence.name == "Midtown Emergency Sector").first()
        if not geo_harbor:
            coords = json.dumps([
                [40.7600, -73.9900],
                [40.7600, -73.9750],
                [40.7450, -73.9750],
                [40.7450, -73.9900]
            ])
            geo_harbor = Geofence(
                name="Midtown Emergency Sector",
                boundary_type="Polygon",
                coordinates=coords,
                organization_id=org_fire.id,
                is_active=True,
                alert_on_entry=True,
                alert_on_exit=True
            )
            db.add(geo_harbor)
            db.commit()

        print("Database successfully re-seeded with real geographic coordinates and addresses!")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
