from sqlalchemy.orm import Session
from typing import List
from backend.models.models import Incident
from backend.repositories.base import BaseRepository

class IncidentRepository(BaseRepository):
    def get_all(self) -> List[Incident]:
        return self.db.query(Incident).filter(Incident.is_deleted == False).all()

    def get_by_id(self, incident_id: str) -> Incident:
        return self.db.query(Incident).filter(Incident.id == incident_id, Incident.is_deleted == False).first()

    def create(self, incident: Incident) -> Incident:
        self.db.add(incident)
        self.db.commit()
        self.db.refresh(incident)
        return incident

    def update(self, incident: Incident) -> Incident:
        self.db.commit()
        self.db.refresh(incident)
        return incident
