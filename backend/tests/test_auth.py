from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "guardian-backend"}

def test_register_duplicate():
    # Simple check for register router inclusion
    response = client.post("/api/v1/auth/register", json={
        "email": "test@guardian.org",
        "full_name": "Test User",
        "password": "securepassword123"
    })
    assert response.status_code in [200, 400] # Either works or already exists
