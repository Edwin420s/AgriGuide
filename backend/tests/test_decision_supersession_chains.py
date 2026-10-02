import pytest
from app.services.reasoning import IrrigationReasoner

def test_reasoning_deterministic_repeatability():
    """Verify that identical input state produces identical decision and rule trace."""
    reasoner = IrrigationReasoner()
    state = {
        "soil_moisture": 15.0,
        "rain_probability_24h": 10.0,
        "water_availability": "SUFFICIENT",
        "crop_water_demand": "HIGH",
        "weather_confidence": 0.85,
        "soil_confidence": 0.90,
    }
    
    res1 = reasoner.decide(state)
    res2 = reasoner.decide(state)
    
    assert res1.recommendation == res2.recommendation
    assert res1.confidence == res2.confidence
    assert res1.rules == res2.rules
    assert len(res1.steps) == len(res2.steps)

def test_step_sequence_order_monotonicity():
    """Verify that reasoning audit steps are strictly ordered by sequence number."""
    reasoner = IrrigationReasoner()
    state = {
        "soil_moisture": 16.0,
        "rain_probability_24h": 75.0,
        "water_availability": "LIMITED",
    }
    res = reasoner.decide(state)
    sequences = [s["sequence"] for s in res.steps]
    assert sequences == sorted(sequences), "Reasoning step sequences must be strictly ascending"
    assert len(sequences) >= 2, "Expected at least observation and policy evaluation steps"
