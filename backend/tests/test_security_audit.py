import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_no_secrets_in_health_response():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert "api_key" not in data
    assert "token" not in data
    assert "secret" not in data


def test_no_secrets_in_llm_status():
    res = client.get("/api/llm/status")
    assert res.status_code == 200
    data = res.json()
    assert "api_key" not in data
    assert isinstance(data.get("api_configured"), bool)


def test_sqli_attack_resilience():
    # Attempt SQL injection via field_id path parameter
    sqli_payload = "1' OR '1'='1"
    res = client.get(f"/api/fields/{sqli_payload}")
    assert res.status_code in [404, 422]


def test_xss_observation_sanitization():
    # Attempt script injection in natural language observation
    xss_payload = "<script>alert('pwned')</script> Heavy rain seen today"
    fields = client.get("/api/fields").json()
    if not fields:
        pytest.skip("No fields available")
    field_id = fields[0]["id"]

    res = client.post(f"/api/fields/{field_id}/observations", json={"message": xss_payload})
    assert res.status_code == 200
    data = res.json()
    assert "<script>" not in data.get("predicate", "")
