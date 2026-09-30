import pytest
from app.services.safety_policies import SafetyPolicyEngine


@pytest.fixture
def policy_engine():
    return SafetyPolicyEngine()


def test_irrigation_duration_clamping(policy_engine):
    field_state = {"water_availability": "ADEQUATE", "wind_speed_kmh": 10.0, "rain_probability_24h": 20.0}
    proposed = {"duration_minutes": 75, "volume_liters": 2500}
    result = policy_engine.verify_action("IRRIGATE", proposed, field_state)
    assert result.allowed is True
    assert result.status == "MODIFIED"
    assert result.clamped_params["duration_minutes"] == 30


def test_irrigation_high_rain_lockout(policy_engine):
    field_state = {"water_availability": "ADEQUATE", "wind_speed_kmh": 8.0, "rain_probability_24h": 85.0}
    proposed = {"duration_minutes": 20}
    result = policy_engine.verify_action("IRRIGATE", proposed, field_state)
    assert result.allowed is False
    assert result.status == "REJECTED"
    assert any("Precipitation lock-out" in v for v in result.violations)


def test_fertilizer_high_rain_rejection(policy_engine):
    field_state = {"rain_probability_24h": 75.0}
    proposed = {"fertilizer_type": "CAN", "rate_kg": 50}
    result = policy_engine.verify_action("APPLY_FERTILIZER", proposed, field_state)
    assert result.allowed is False
    assert result.status == "REJECTED"
    assert any("runoff" in v.lower() for v in result.violations)


def test_routine_scouting_allowed(policy_engine):
    field_state = {"water_availability": "LIMITED"}
    proposed = {"quadrants": 4}
    result = policy_engine.verify_action("SCOUT_PEST", proposed, field_state)
    assert result.allowed is True
    assert result.status == "APPROVED"
