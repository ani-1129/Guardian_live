import os
from backend.websocket.broadcast import broadcast_to_room, broadcast_to_all

class NotificationService:
    @staticmethod
    def send_email(to_address: str, subject: str, body: str) -> bool:
        """
        Sends an email alert.
        """
        print(f"[SMTP Alert] Sending email to {to_address}. Subject: {subject}")
        # In production: integration with SendGrid / SMTP relay
        return True

    @staticmethod
    def send_sms(phone_number: str, message: str) -> bool:
        """
        Sends SMS text notifications.
        """
        print(f"[SMS Alert] Sending text to {phone_number}: {message}")
        # In production: integration with Twilio Client
        return True

    @staticmethod
    def send_push_notification(device_token: str, title: str, body: str) -> bool:
        """
        Sends native mobile push message via FCM/APNS.
        """
        print(f"[FCM Push Alert] Sending notification to token {device_token}: {title} - {body}")
        # In production: firebase-admin messaging dispatch
        return True

    @staticmethod
    async def broadcast_alert(org_id: str, alert_type: str, message: str):
        """
        Broadcasts live alerts to active dispatcher and responder sockets.
        """
        payload = {
            "event": "sos_alert" if alert_type == "SOS" else "incident_alert",
            "alert_type": alert_type,
            "message": message
        }
        if org_id:
            await broadcast_to_room(f"org_{org_id}", payload)
        else:
            await broadcast_to_all(payload)
        print(f"[Socket Alert] Broadcasted {alert_type} to org {org_id}: {message}")
