import csv
import io
from typing import List

class ReportingService:
    @staticmethod
    def generate_incidents_csv(incidents: List[dict]) -> str:
        """
        Generates a formatted CSV string containing incident details.
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Incident ID", "Title", "Priority", "Category", "Status", "Latitude", "Longitude", "Created At"])
        
        # Rows
        for inc in incidents:
            writer.writerow([
                inc.get("id"),
                inc.get("title"),
                inc.get("priority"),
                inc.get("category"),
                inc.get("status"),
                inc.get("latitude"),
                inc.get("longitude"),
                inc.get("created_at")
            ])
            
        return output.getvalue()

    @staticmethod
    def generate_incident_summary_json(incidents: List[dict]) -> dict:
        """
        Generates structured summary KPIs.
        """
        total = len(incidents)
        by_priority = {}
        by_status = {}
        
        for inc in incidents:
            priority = inc.get("priority", "Unknown")
            status = inc.get("status", "Unknown")
            
            by_priority[priority] = by_priority.get(priority, 0) + 1
            by_status[status] = by_status.get(status, 0) + 1
            
        return {
            "total_incidents": total,
            "breakdown_by_priority": by_priority,
            "breakdown_by_status": by_status
        }
