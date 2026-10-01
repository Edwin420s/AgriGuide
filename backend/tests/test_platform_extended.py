"""Tests for AgriGuide Agricultural Intelligence Platform Extensions.

Verifies:
1. Agricultural Knowledge Graph & Causal Paths
2. Multi-Domain Decision Engines (Planting, Fertilizer, Health, Risk, Harvest)
3. Sensor Anomaly Detection (Spikes, Flatlines, Out-of-Bounds)
4. Agronomic Analytics & FAO-56 Evapotranspiration
5. Deterministic Safety Policies & Action Proposals
6. Historical Decision Replay Verification
7. Model Task Router across 5 ASI Cloud models
8. Scientific 10-Point Simulation Benchmark
9. Extended Platform REST Endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.domain import Farm, Field, User, Evidence, Decision, DecisionReasoning
from app.services.world_model import WorldModelService, AgriculturalKnowledgeGraph
from app.services.domain_reasoners import MultiDomainAgriculturalEngine
from app.services.ml_analytics import AgriculturalMLService, SensorAnomalyDetector
from app.services.safety_policies import SafetyPolicyEngine
from app.services.decision_replay import DecisionReplayEngine
from app.services.model_router import task_router
from app.services.benchmark import benchmark_suite

client = TestClient(app)


def test_knowledge_graph_construction():
    db = SessionLocal()
    try:
        field = db.query(Field).first()
        if not field:
            pytest.skip("No seed field available")

        wm = WorldModelService()
        kg = wm.build_knowledge_graph(db, field)
        data = kg.to_dict()

        assert "entities" in data
        assert "relations" in data
        assert "causal_chains" in data
        assert "metta_atoms" in data

        entity_types = {e["type"] for e in data["entities"]}
        assert "Field" in entity_types
        assert "Crop" in entity_types
        assert "SoilType" in entity_types

        # Verify causal chains
        assert len(data["causal_chains"]) >= 3
        assert any("Nutrient_Leaching" in chain["path"] for chain in data["causal_chains"])

        # Verify MeTTa atom generation
        atoms = data["metta_atoms"]
        assert any("grows" in a for a in atoms)
        assert any("has_soil" in a for a in atoms)
    finally:
        db.close()


def test_multi_domain_reasoning():
    engine = MultiDomainAgriculturalEngine()

    # 1. Planting window: optimal vs too dry
    plant_optimal = engine.evaluate_planting({"soil_moisture": 22.0, "rain_probability_24h": 50.0, "temperature_c": 24.0, "season_onset": True})
    assert plant_optimal.recommendation == "PLANT"
    assert "OPTIMAL" in plant_optimal.rules[0]

    plant_dry = engine.evaluate_planting({"soil_moisture": 14.0, "rain_probability_24h": 10.0, "temperature_c": 24.0, "season_onset": True})
    assert plant_dry.recommendation == "DELAY_PLANTING"
    assert "DRY" in plant_dry.rules[0]

    # 2. Fertilization: heavy rain leaching hazard
    fert_leach = engine.evaluate_fertilization({"growth_stage": "vegetative", "soil_moisture": 20.0, "rain_probability_24h": 75.0, "wind_speed_kmh": 10.0})
    assert fert_leach.recommendation == "DELAY_FERTILIZER"
    assert "LEACHING" in fert_leach.rules[0]

    # 3. Crop Health: severe drought stress
    health_stress = engine.evaluate_crop_health({"consecutive_dry_days": 8, "temperature_c": 34.0, "canopy_anomaly": False})
    assert health_stress.recommendation == "SEVERE_WATER_STRESS"

    # 4. Weather Risk: severe storm
    risk_storm = engine.evaluate_weather_risk({"rain_probability_24h": 90.0, "wind_speed_kmh": 50.0, "consecutive_dry_days": 1})
    assert risk_storm.recommendation == "SEVERE_STORM_LODGING_RISK"

    # 5. Harvest: mature & dry window
    harvest_ready = engine.evaluate_harvest({"growth_stage": "maturity", "days_since_planting": 125, "maturity_days": 120, "grain_moisture": 13.5, "rain_probability_24h": 10.0})
    assert harvest_ready.recommendation == "HARVEST"


def test_sensor_anomaly_detector():
    detector = SensorAnomalyDetector()

    # Sudden spike: 18 -> 92
    anom_spike = detector.detect([18.0, 18.5, 17.9], 92.0, "soil_moisture")
    assert anom_spike.is_anomalous is True
    assert anom_spike.anomaly_type == "SUDDEN_SPIKE"
    assert anom_spike.confidence_penalty > 0.3

    # Flatline / frozen sensor
    anom_stuck = detector.detect([22.0, 22.0, 22.0, 22.0, 22.0], 22.0, "soil_moisture")
    assert anom_stuck.is_anomalous is True
    assert anom_stuck.anomaly_type == "STUCK_SENSOR"

    # Out of bounds: 115% moisture
    anom_bounds = detector.detect([50.0], 115.0, "soil_moisture")
    assert anom_bounds.is_anomalous is True
    assert anom_bounds.anomaly_type == "OUT_OF_BOUNDS"

    # Normal reading
    anom_ok = detector.detect([18.0, 19.0, 18.2], 18.6, "soil_moisture")
    assert anom_ok.is_anomalous is False


def test_ml_analytics_evapotranspiration():
    ml = AgriculturalMLService()

    # Reference ET0 estimation
    et0 = ml.estimate_et0(temp_c=28.0, humidity_pct=50.0, wind_kmh=15.0)
    assert 3.0 <= et0 <= 8.0

    # Crop water demand for Maize flowering
    demand = ml.calculate_crop_water_demand("maize", "flowering", et0)
    assert demand["crop_coefficient_kc"] >= 1.1
    assert demand["crop_demand_etc_mm_day"] > 0

    # Soil depletion forecast
    depletion = ml.forecast_soil_depletion(current_moisture=22.0, etc_mm=demand["crop_demand_etc_mm_day"], soil_type="loam")
    assert depletion["projected_moisture_24h"] < 22.0
    assert depletion["projected_moisture_48h"] < depletion["projected_moisture_24h"]


def test_safety_policy_enforcement():
    safety = SafetyPolicyEngine()

    # Request 50 minutes irrigation -> must clamp to 30
    res_clamp = safety.verify_action("IRRIGATE", {"duration_minutes": 50}, {"water_availability": "LIMITED", "wind_speed_kmh": 10.0, "rain_probability_24h": 10.0})
    assert res_clamp.allowed is True
    assert res_clamp.clamped_params["duration_minutes"] == 30
    assert res_clamp.status == "MODIFIED"

    # Request irrigation when water is depleted -> must reject
    res_depleted = safety.verify_action("IRRIGATE", {"duration_minutes": 20}, {"water_availability": "UNAVAILABLE"})
    assert res_depleted.allowed is False
    assert res_depleted.status == "REJECTED"

    # High wind lockout
    res_wind = safety.verify_action("IRRIGATE", {"duration_minutes": 20}, {"water_availability": "LIMITED", "wind_speed_kmh": 40.0})
    assert res_wind.allowed is False
    assert "wind" in res_wind.violations[0].lower()


def test_model_task_router():
    # Verify task-to-model routing mappings
    assert task_router.resolve_model("perception") == "asi1-mini"
    assert task_router.resolve_model("extraction") == "google/gemma-3-27b-it"
    assert task_router.resolve_model("reasoning") == "minimax/minimax-m3"
    assert task_router.resolve_model("counterfactual_audit") == "meta-llama/llama-3.3-70b-instruct"
    assert task_router.resolve_model("consultation") == "qwen/qwen3-32b"

    # User override takes precedence
    assert task_router.resolve_model("perception", user_override="qwen/qwen3-32b") == "qwen/qwen3-32b"


def test_scientific_benchmark_suite():
    scorecard = benchmark_suite.run_all()
    assert scorecard.total_tests == 10
    assert scorecard.passed_tests == 10
    assert scorecard.overall_score_pct == 100.0


def test_decision_replay_engine():
    db = SessionLocal()
    try:
        dec = db.query(Decision).first()
        if not dec:
            pytest.skip("No seed decision available for replay")

        replay_eng = DecisionReplayEngine()
        cert = replay_eng.replay_decision(db, dec.id)

        assert cert.decision_id == dec.id
        assert cert.status in {"VERIFIED_DETERMINISTIC", "DIVERGENCE_DETECTED"}
        assert len(cert.replayed_steps) > 0
    finally:
        db.close()


def test_extended_api_endpoints():
    db = SessionLocal()
    try:
        field = db.query(Field).first()
        if not field:
            pytest.skip("No seed field available")
        field_id = field.id

        # 1. Knowledge Graph
        r_graph = client.get(f"/api/fields/{field_id}/graph")
        assert r_graph.status_code == 200
        data_graph = r_graph.json()
        assert "entities" in data_graph
        assert "causal_chains" in data_graph

        # 2. Multi-Domain evaluation
        r_plant = client.post(f"/api/fields/{field_id}/domain/planting", json={"params": {"soil_moisture": 22.0, "rain_probability_24h": 45.0}})
        assert r_plant.status_code == 200
        assert r_plant.json()["recommendation"] == "PLANT"

        r_fert = client.post(f"/api/fields/{field_id}/domain/fertilizer", json={"params": {"rain_probability_24h": 85.0}})
        assert r_fert.status_code == 200
        assert r_fert.json()["recommendation"] == "DELAY_FERTILIZER"

        # 3. Holistic farm status
        r_holistic = client.get(f"/api/fields/{field_id}/holistic")
        assert r_holistic.status_code == 200
        assert "domains" in r_holistic.json()
        assert "planting" in r_holistic.json()["domains"]

        # 4. Action proposal
        r_prop = client.post(f"/api/fields/{field_id}/actions/propose", json={"action_type": "IRRIGATE", "proposed_params": {"duration_minutes": 45}})
        assert r_prop.status_code == 200
        assert r_prop.json()["clamped_params"]["duration_minutes"] == 30

        # 5. Agricultural Analytics
        r_ana = client.get(f"/api/fields/{field_id}/analytics")
        assert r_ana.status_code == 200
        assert "evapotranspiration" in r_ana.json()
        assert "soil_moisture_depletion" in r_ana.json()

        # 6. Sensor Anomaly Check
        r_anom = client.post(f"/api/fields/{field_id}/analytics/anomaly-check", json={"history": [18.0, 18.2, 17.9], "current_value": 95.0, "sensor_type": "soil_moisture"})
        assert r_anom.status_code == 200
        assert r_anom.json()["is_anomalous"] is True

        # 7. Model Routes
        r_routes = client.get("/api/llm/routes")
        assert r_routes.status_code == 200
        assert len(r_routes.json()["routes"]) >= 5

        # 8. Benchmark runner
        r_bench = client.post("/api/benchmark/run")
        assert r_bench.status_code == 200
        assert r_bench.json()["passed_tests"] == 10

        # 9. Decision Replay
        dec = db.query(Decision).filter(Decision.field_id == field_id).first()
        if dec:
            r_rep = client.get(f"/api/decisions/{dec.id}/replay")
            assert r_rep.status_code == 200
            assert "is_exact_match" in r_rep.json()
    finally:
        db.close()


def test_farm_and_field_lifecycle():
    # 1. Location Resolve
    r_loc = client.get("/api/locations/resolve?query=Nanyuki")
    assert r_loc.status_code == 200
    data_loc = r_loc.json()
    assert "latitude" in data_loc
    assert "longitude" in data_loc
    assert "preview_weather" in data_loc
    assert data_loc["preview_weather"]["temperature_c"] is not None

    # 2. Create Farm with Auto-Geocoding
    r_farm = client.post("/api/farms", json={
        "name": "Laikipia Plateau Ranch",
        "location_name": "Nanyuki",
        "water_availability": "LIMITED",
        "area": 4.5
    })
    assert r_farm.status_code == 200
    data_farm = r_farm.json()
    assert "id" in data_farm
    farm_id = data_farm["id"]

    # 3. Create Field and verify digital twin initialized
    r_field = client.post("/api/fields", json={
        "farm_id": farm_id,
        "name": "North Meadow - Barley",
        "crop": "barley",
        "growth_stage": "vegetative",
        "soil_type": "loam",
        "irrigation_method": "sprinkler",
        "area_ha": 2.0
    })
    assert r_field.status_code == 200
    data_field = r_field.json()
    assert "id" in data_field
    field_id = data_field["id"]

    # 4. Verify initial decision created automatically
    r_dec = client.get(f"/api/fields/{field_id}/decisions")
    assert r_dec.status_code == 200
    assert len(r_dec.json()) >= 1
    assert r_dec.json()[0]["recommendation"] in ["IRRIGATE", "WAIT", "REASSESS"]

    # 5. Verify initial evidence context populated
    r_ev = client.get(f"/api/fields/{field_id}/evidence")
    assert r_ev.status_code == 200
    assert len(r_ev.json()) >= 2

    # 6. Verify field deletion and cleanup
    r_del = client.delete(f"/api/fields/{field_id}")
    assert r_del.status_code == 200
    assert r_del.json()["deleted"] is True

