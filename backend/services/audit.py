from sqlalchemy.orm import Session
from backend.models.models import AuditLog, ActivityTimeline
import datetime

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        action: str,
        user_id=None,
        user_email=None,
        affected_record=None,
        ip_address=None,
        browser=None
    ):
        try:
            log = AuditLog(
                user_id=user_id,
                user_email=user_email,
                action=action,
                affected_record=affected_record,
                ip_address=ip_address,
                browser=browser,
                timestamp=datetime.datetime.utcnow()
            )
            db.add(log)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[Audit Log Error] Failed to write audit log: {e}")

    @staticmethod
    def log_activity(
        db: Session,
        entity_type: str,
        entity_id,
        action: str,
        description: str = None,
        performed_by_id = None,
        performed_by_name: str = None
    ):
        try:
            activity = ActivityTimeline(
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                description=description,
                performed_by_id=performed_by_id,
                performed_by_name=performed_by_name,
                timestamp=datetime.datetime.utcnow()
            )
            db.add(activity)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[Activity Timeline Error] Failed to write timeline: {e}")
