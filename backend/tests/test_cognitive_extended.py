from app.services.metta_runner import metta_service
from app.services.reasoning import IrrigationReasoner
from app.services.world_model import WorldModelService
from app.services.cognitive import CognitiveService
from app.db.session import SessionLocal
from app.models.domain import Field, Decision, Evidence

def test_metta_symbolic_queries():
    # Test reference cases from metta/tests/irrigation.metta
    res_irrigate = metta_service.execute_query(soil=17, rain=18, water="limited", current_rain=False)
    assert res_irrigate.recommendation == "IRRIGATE"
    assert "R-LOW-MOISTURE-LOW-RAIN" in res_irrigate.rules
    assert res_irrigate.source == "metta-embedded"

    res_wait_rain = metta_service.execute_query(soil=17, rain=81, water="limited", current_rain=False)
    assert res_wait_rain.recommendation == "WAIT"
    assert "R-HIGH-RAIN-WATER-CONSERVATION" in res_wait_rain.rules

    res_current_rain = metta_service.execute_query(soil=17, rain=81, water="limited", current_rain=True)
    assert res_current_rain.recommendation == "WAIT"

def test_metta_counterfactual_reasoning():
    cf_high = metta_service.evaluate_counterfactuals(soil=17, rain=80, water="limited")
    assert cf_high["if_irrigate"]["recommendation"] == "AVOID"
    assert cf_high["if_irrigate"]["efficiency"] == "POOR"
    assert cf_high["if_wait"]["recommendation"] == "PROCEED"
    assert cf_high["if_wait"]["efficiency"] == "HIGH"

    cf_low = metta_service.evaluate_counterfactuals(soil=17, rain=15, water="limited")
    assert cf_low["if_irrigate"]["recommendation"] == "PROCEED"
    assert cf_low["if_irrigate"]["efficiency"] == "OPTIMAL"
    assert cf_low["if_wait"]["recommendation"] == "AVOID"
    assert cf_low["if_wait"]["efficiency"] == "NEUTRAL"

def test_custom_farmer_rule_adaptation():
