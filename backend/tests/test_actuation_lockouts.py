import pytest
from app.services.safety_policies import SafetyPolicyEngine

def test_water_unavailable_lockout():
    """Verify that irrigation is strictly rejected if water availability is UNAVAILABLE."""
    engine = SafetyPolicyEngine()
    state = {"water_availability": "UNAVAILABLE", "rain_probability_24h": 10.0, "wind_speed_kmh": 10.0}
    res = engine.verify_action("IRRIGATE", {"duration_minutes": 20}, state)
    assert res.allowed is False
    assert res.status == "REJECTED"
    assert any("depleted" in v.lower() for v in res.violations)

def test_excessive_wind_lockout():
    """Verify that high winds (> 35 km/h) trigger spray/drip hazard lockout."""
    engine = SafetyPolicyEngine()
    state = {"water_availability": "SUFFICIENT", "rain_probability_24h": 10.0, "wind_speed_kmh": 42.0}
    res = engine.verify_action("IRRIGATE", {"duration_minutes": 15}, state)
    assert res.allowed is False
    assert res.status == "REJECTED"
    assert any("wind" in v.lower() for v in res.violations)

def test_imminent_rain_irrigation_lockout():
    """Verify that rain probability >= 80% suppresses irrigation."""
    engine = SafetyPolicyEngine()
    state = {"water_availability": "SUFFICIENT", "rain_probability_24h": 85.0, "wind_speed_kmh": 8.0}
    res = engine.verify_action("IRRIGATE", {"duration_minutes": 20}, state)
    assert res.allowed is False
    assert res.status == "REJECTED"
    assert any("precipitation" in v.lower() for v in res.violations)

def test_duration_ceiling_clamping():
    """Verify that irrigation duration is clamped to MAX_IRRIGATION_DURATION_MIN (30m)."""
    engine = SafetyPolicyEngine()
    state = {"water_availability": "SUFFICIENT", "rain_probability_24h": 15.0, "wind_speed_kmh": 10.0}
    res = engine.verify_action("IRRIGATE", {"duration_minutes": 90}, state)
    assert res.allowed is True
    assert res.status == "MODIFIED"
    assert res.clamped_params["duration_minutes"] == 30

def test_fertilizer_runoff_lockout():
    """Verify that fertilizer application is rejected if heavy rain (>= 70%) is imminent."""
    engine = SafetyPolicyEngine()
    state = {"rain_probability_24h": 75.0}
    res = engine.verify_action("APPLY_FERTILIZER", {"amount_kg": 50}, state)
    assert res.allowed is False
    assert res.status == "REJECTED"
    assert any("nitrogen runoff" in v.lower() for v in res.violations)
