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
    # Test "The Agent That Grows Up": custom farmer rule overrides default
    custom_rule = {
        "name": "Dry River Buffer",
        "action": "WAIT",
        "condition": {"rain_threshold_min": 50},
        "is_active": True
    }
    # Normally 55% rain with 16% soil might be borderline, but custom rule triggers WAIT
    res = metta_service.execute_query(
        soil=16,
        rain=55,
        water="limited",
        current_rain=False,
        custom_rules=[custom_rule]
    )
    assert res.recommendation == "WAIT"
    assert "Dry River Buffer" in res.rules

def test_conflict_detection():
    reasoner = IrrigationReasoner()
    state_with_conflict = {
        "soil_moisture": 17,
        "rain_probability_24h": 80,
        "water_availability": "LIMITED",
        "current_rainfall": False,
        "crop_water_demand": "HIGH",
        "weather_confidence": 0.8,
        "soil_confidence": 0.9,
        "conflicts": [
            {
                "predicate": "rain_probability_24h",
                "sources": ["PROVIDER_A", "PROVIDER_B"],
                "values": [80, 20],
                "description": "Severe weather forecast conflict"
            }
        ]
    }
    result = reasoner.decide(state_with_conflict)
    # Check that conflict detection is logged in reasoning steps
    conflict_steps = [s for s in result.steps if s.get("type") == "CONFLICT_DETECTION"]
    assert len(conflict_steps) > 0
    # Confidence should be penalized due to conflicting inputs
    assert result.confidence <= 0.85

def test_decision_supersession_and_diff():
    db = SessionLocal()
    try:
        # Get Field A
        field = db.query(Field).filter(Field.name.like("%North Plot%")).first()
        assert field is not None

        cog = CognitiveService()
        latest_dec = (
            db.query(Decision)
            .filter(Decision.field_id == field.id, Decision.supersedes_id.isnot(None))
            .order_by(Decision.created_at.desc())
            .first()
        )
        assert latest_dec is not None
        assert latest_dec.supersedes_id is not None

        diff = cog.get_decision_diff(db, latest_dec.id)
        assert diff["decision_id"] == latest_dec.id
        assert diff["superseded_id"] == latest_dec.supersedes_id
        assert diff["recommendation"] == "WAIT"
        assert diff["previous_recommendation"] == "IRRIGATE"
        assert len(diff["rule_changes"]) > 0
    finally:
        db.close()

def test_outcome_recording_and_calibration():
    db = SessionLocal()
    try:
        cog = CognitiveService()
        dec = db.query(Decision).first()
        assert dec is not None

        # Test numeric outcome
        out = cog.record_outcome(db, dec, {
            "type": "ACTUAL_RAINFALL",
            "observed_value": 8.5,
            "unit": "mm"
        })
        assert out.id is not None
        assert out.observed_value.get("value") == 8.5

        # Test dict outcome
        out_dict = cog.record_outcome(db, dec, {
            "type": "ACTUAL_RAINFALL",
            "observed_value": {"millimeters": 12.0, "rained": True},
            "unit": "mm"
        })
        assert out_dict.id is not None
        assert out_dict.observed_value.get("millimeters") == 12.0
    finally:
        db.close()

def test_omega_stateful_agent_cycle():
    from app.services.omega import OmegaAgent
    agent = OmegaAgent()
    assert agent.skill_contract == "omega/skills/agriguide.metta"

    # Episode 1: Dry state
    state_1 = {
        "soil_moisture": 16.5,
        "rain_probability_24h": 18.0,
        "water_availability": "LIMITED",
        "current_rainfall": False,
        "crop_water_demand": "HIGH"
    }
    res_1 = agent.run("irrigation_decision", state_1, [])
    assert res_1.reasoning.recommendation == "IRRIGATE"
    assert res_1.mode == "omega-native-metta"
    assert res_1.reasoning.source == "omega-native-metta"
    assert len(res_1.memory) == 1
    assert any(s.get("type") == "OMEGA_AGENT_INIT" for s in res_1.reasoning.steps)

    # Episode 2: High rain telemetry arrives
    state_2 = {
        "soil_moisture": 16.5,
        "rain_probability_24h": 82.0,
        "water_availability": "LIMITED",
        "current_rainfall": False,
        "crop_water_demand": "HIGH"
    }
    res_2 = agent.run("reassess_irrigation", state_2, res_1.memory)
    assert res_2.reasoning.recommendation == "WAIT"
    assert len(res_2.memory) == 2
    # Verify Omega memory reconciliation step was emitted
    reconciliation_steps = [s for s in res_2.reasoning.steps if s.get("type") == "OMEGA_MEMORY_RECONCILIATION"]
    assert len(reconciliation_steps) == 1
    assert reconciliation_steps[0]["input"]["prior_recommendation"] == "IRRIGATE"
    assert reconciliation_steps[0]["rule_id"] == "OMEGA-REVISE-PRIOR-DECISION"


