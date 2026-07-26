from celery import Celery
import time

from backend.services.notification import NotificationService
from backend.services.reporting import ReportingService

# Initialize Celery app
celery_app = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery_app.task
def generate_report_pdf(report_id: str, incidents: list):
    """
    Asynchronously generates a compiled report summary and saves locally.
    """
    summary = ReportingService.generate_incident_summary_json(incidents)
    csv_data = ReportingService.generate_incidents_csv(incidents)
    # Simulate saving report file output
    time.sleep(2)
    return {
        "status": "completed",
        "report_id": report_id,
        "summary": summary,
        "csv_size_chars": len(csv_data)
    }

@celery_app.task
def send_email_notification(email: str, subject: str, body: str):
    """
    Dispatches asynchronous notification alerts.
    """
    success = NotificationService.send_email(email, subject, body)
    return {"status": "sent" if success else "failed", "recipient": email}

@celery_app.task
def archive_old_locations():
    """
    Simulates scheduled database cleanup task
    """
    return {"status": "success", "archived_records": 1250}
