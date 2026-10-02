import pytest
from app.services.domain_reasoners import MultiDomainAgriculturalEngine

def test_planting_optimal_window():
    """Verify planting evaluation approves planting when soil moisture >= 20% and rain forecast >= 35%."""
    engine = MultiDomainAgriculturalEngine()
    state = {
        "soil_moisture": 22.0,
        "temperature_c": 24.0,
        "rain_probability_24h": 45.0,
        "season_onset": True
    }
    decision = engine.evaluate_planting(state)
    assert decision.recommendation == "PLANT"
    assert "R-OPTIMAL-PLANTING-WINDOW" in decision.rules

def test_planting_seedbed_dry_lockout():
    """Verify planting is delayed when seedbed moisture is below 18%."""
    engine = MultiDomainAgriculturalEngine()
    state = {
        "soil_moisture": 14.0,
        "temperature_c": 24.0,
        "rain_probability_24h": 10.0,
        "season_onset": True
    }
    decision = engine.evaluate_planting(state)
    assert decision.recommendation == "DELAY_PLANTING"
    assert "R-SEEDBED-TOO-DRY" in decision.rules

def test_fertilization_leaching_risk():
    """Verify fertilizer application is delayed when imminent heavy rain threatens nitrate leaching."""
    engine = MultiDomainAgriculturalEngine()
    state = {
        "rain_probability_24h": 85.0,
        "soil_moisture": 25.0,
        "wind_speed_kmh": 10.0,
        "crop_stage": "vegetative"
    }
    decision = engine.evaluate_fertilization(state)
    assert decision.recommendation == "DELAY_FERTILIZER"
    assert "R-NITROGEN-LEACHING-RISK" in decision.rules

def test_harvest_readiness():
    """Verify harvest is delayed if crop is physiologically immature."""
    engine = MultiDomainAgriculturalEngine()
    state = {
        "growth_stage": "flowering",
        "soil_moisture": 20.0,
        "rain_probability_24h": 10.0
    }
    decision = engine.evaluate_harvest(state)
    assert decision.recommendation == "DELAY_HARVEST"
    assert "R-PHYSIOLOGICAL-IMMATURE" in decision.rules
