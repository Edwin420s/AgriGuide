import pytest
from app.services.domain_reasoners import MultiDomainAgriculturalEngine


@pytest.fixture
def engine():
    return MultiDomainAgriculturalEngine()


def test_evaluate_planting_dry_soil(engine):
    state = {"soil_moisture": 12.0, "rain_probability_24h": 10.0}
    decision = engine.evaluate_planting(state)
    assert decision.domain == "planting"
    assert decision.recommendation == "DELAY_PLANTING"
    assert "R-SEEDBED-TOO-DRY" in decision.rules


def test_evaluate_planting_optimal(engine):
    state = {"soil_moisture": 24.0, "rain_probability_24h": 45.0}
    decision = engine.evaluate_planting(state)
    assert decision.recommendation == "PLANT"
    assert decision.confidence >= 0.85


def test_evaluate_fertilization_high_rain(engine):
    state = {"rain_probability_24h": 85.0, "growth_stage": "vegetative"}
    decision = engine.evaluate_fertilization(state)
    assert decision.domain == "fertilization"
    assert decision.recommendation == "DELAY_FERTILIZER"
    assert "R-NITROGEN-LEACHING-RISK" in decision.rules


def test_evaluate_harvest_physiological_immature(engine):
    state = {"days_planted": 40, "maturity_days": 120, "growth_stage": "flowering"}
    decision = engine.evaluate_harvest(state)
    assert decision.domain == "harvest"
    assert decision.recommendation == "DELAY_HARVEST"


def test_evaluate_holistic(engine):
    state = {
        "crop": "maize",
        "growth_stage": "flowering",
        "soil_moisture": 18.0,
        "rain_probability_24h": 70.0,
        "temperature_c": 26.0,
        "humidity_pct": 65.0
    }
    holistic = engine.evaluate_holistic(state)
    assert "planting" in holistic
    assert "fertilization" in holistic
    assert "crop_health" in holistic
    assert "weather_risk" in holistic
    assert "harvest" in holistic
