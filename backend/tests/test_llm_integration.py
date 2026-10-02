import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.llm import LLMService, ParsedObservation
from app.db.session import SessionLocal
from app.models.domain import Field

client = TestClient(app)

def test_llm_service_status():
    service = LLMService()
    status = service.check_status()
    assert status["provider"] == "asi_cloud"
    assert "minimax/minimax-m3" in status["available_models"]
    assert "asi1-mini" in status["available_models"]
    assert "google/gemma-3-27b-it" in status["available_models"]
    assert "status" in status
    assert "api_configured" in status

def test_heuristic_observation_parsing():
    service = LLMService()
    # Test moisture parsing
    obs_moisture = service.extract_observation("Soil moisture is currently 17.5% in the upper furrow")
    assert obs_moisture.predicate == "soil_moisture"
    assert obs_moisture.value["value"] == 17.5
    assert obs_moisture.confidence >= 0.8

    # Test rain parsing
    obs_rain = service.extract_observation("Heavy rain started pouring over the field")
    assert obs_rain.predicate == "current_rainfall"
    assert obs_rain.value["value"] is True
    assert obs_rain.value["intensity"] == "heavy"

    # Test weather forecast clouds
    obs_clouds = service.extract_observation("Dark rain clouds gathering on the horizon, rain expected tomorrow")
    assert obs_clouds.predicate == "weather_forecast"
    assert obs_clouds.value["rain_expected"] is True

def test_explain_decision_synthesis():
    service = LLMService()
    explanation = service.explain_decision(
        recommendation="WAIT",
        confidence=0.88,
        reason="Expected rainfall within 24 hours makes irrigation wasteful.",
        counterfactuals={
            "if_wait": {"efficiency": "HIGH", "risk": "LOW"},
            "if_irrigate": {"efficiency": "POOR", "risk": "HIGH_RUNOFF_RISK"}
        },
        supersedes_diff={
            "previous_recommendation": "IRRIGATE"
        },
        crop="Maize",
        soil_moisture=18.0,
        rain_prob=75.0,
        water_avail="LIMITED"
    )
    assert "agriguide advises wait" in explanation.lower()
    assert "supersedes previous advice" in explanation.lower()
    assert "runoff" in explanation.lower()

def test_grounded_consultation():
    service = LLMService()
    context = {
        "crop": "Maize",
        "soil_moisture": 18.0,
        "rain_probability_24h": 75.0,
        "water_availability": "LIMITED",
        "latest_decision": "WAIT",
        "latest_reason": "Rain expected tomorrow."
    }
    consult_res = service.consult("Should I turn on irrigation today?", context)
    assert consult_res["grounded"] is True
    ans_lower = consult_res["answer"].lower()
    assert "maize" in ans_lower
    assert "wait" in ans_lower or "hold off" in ans_lower or "delay" in ans_lower

def test_remote_asi_cloud_parsing_simulation():
    # Simulate valid JSON response from SingularityNET ASI Cloud chat completion
    simulated_json = '{"predicate": "soil_moisture", "value": {"value": 15.2, "qualitative": "dry"}, "confidence": 0.94, "explanation": "Farmer notes topsoil is very dry."}'
    service = LLMService(api_key="test-asi-key")

    with patch.object(service, "_call_chat_completion", return_value=simulated_json):
        obs = service.extract_observation("The soil is parched and 15% dry")
        assert obs.predicate == "soil_moisture"
        assert obs.value["value"] == 15.2
        assert obs.confidence == 0.94
        assert "Farmer notes topsoil" in obs.explanation

def test_remote_asi_cloud_error_fallback():
    # Simulate network exception from remote ASI Cloud endpoint
    service = LLMService(api_key="test-asi-key")

    with patch.object(service, "_call_chat_completion", side_effect=Exception("Connection timed out")):
        obs = service.extract_observation("Heavy rain falling now")
        # Should gracefully degrade to deterministic heuristic without crashing
        assert obs.predicate == "current_rainfall"
        assert obs.value["value"] is True

def test_api_routes_llm_endpoints():
    # Test GET /api/llm/status
    res = client.get("/api/llm/status")
    assert res.status_code == 200
    data = res.json()
    assert data["provider"] == "asi_cloud"
    assert "model" in data

    # Create an isolated temporary test field so seed data is not mutated
    from app.models.domain import User, Farm, Evidence, Decision, CognitiveRun
    db = SessionLocal()
    user = db.query(User).first()
    farm = Farm(owner_id=user.id, name="LLM Test Farm", water_availability="LIMITED")
    db.add(farm)
    db.commit()
    db.refresh(farm)

    farm_id = farm.id
    test_field = Field(farm_id=farm_id, name="LLM Temp Field", crop="Maize", soil_type="loam")
    db.add(test_field)
    db.commit()
    db.refresh(test_field)
    field_id = test_field.id
    db.close()

    try:
        # Test POST /api/fields/{id}/observations
        obs_res = client.post(f"/api/fields/{field_id}/observations", json={"message": "Soil moisture measured at 19%"})
        assert obs_res.status_code == 200
        obs_data = obs_res.json()
        assert "predicate" in obs_data
        assert "explanation" in obs_data

        # Test POST /api/fields/{id}/consult
        consult_res = client.post(f"/api/fields/{field_id}/consult", json={"query": "Why should I wait to irrigate?"})
        assert consult_res.status_code == 200
        c_data = consult_res.json()
        assert c_data["grounded"] is True
        assert len(c_data["answer"]) > 10

        # Test POST /api/fields/{id}/decide returns explanation
        decide_res = client.post(f"/api/fields/{field_id}/decide", json={"trigger": "TEST", "goal": "irrigation_decision"})
        assert decide_res.status_code == 200
        d_data = decide_res.json()
        assert "explanation" in d_data
        assert len(d_data["explanation"]) > 10
    finally:
        cleanup_db = SessionLocal()
        cleanup_db.query(Evidence).filter(Evidence.field_id == field_id).delete()
        cleanup_db.query(Decision).filter(Decision.field_id == field_id).delete()
        cleanup_db.query(CognitiveRun).filter(CognitiveRun.field_id == field_id).delete()
        cleanup_db.query(Field).filter(Field.id == field_id).delete()
        cleanup_db.query(Farm).filter(Farm.id == farm_id).delete()
        cleanup_db.commit()
        cleanup_db.close()

def test_supported_models_list_and_switching():
    service = LLMService()
    models = service.get_models()
    assert len(models) == 5
    model_ids = [m["id"] for m in models]
    assert "minimax/minimax-m3" in model_ids
    assert "asi1-mini" in model_ids
    assert "google/gemma-3-27b-it" in model_ids
    assert "meta-llama/llama-3.3-70b-instruct" in model_ids
    assert "qwen/qwen3-32b" in model_ids

    # Switch to asi1-mini
    res = service.set_model("asi1-mini")
    assert service.model == "asi1-mini"
    assert res["model"] == "asi1-mini"

    # Switch to llama 3.3
    service.set_model("meta-llama/llama-3.3-70b-instruct")
    assert service.model == "meta-llama/llama-3.3-70b-instruct"

    # Invalid model throws ValueError
    with pytest.raises(ValueError):
        service.set_model("nonexistent/invalid-model")

def test_api_routes_model_switcher():
    # Test GET /api/llm/models
    res = client.get("/api/llm/models")
    assert res.status_code == 200
    data = res.json()
    assert "active_model" in data
    assert len(data["models"]) == 5

    # Test POST /api/llm/model
    switch_res = client.post("/api/llm/model", json={"model": "google/gemma-3-27b-it"})
    assert switch_res.status_code == 200
    assert switch_res.json()["model"] == "google/gemma-3-27b-it"

    # Switch back to minimax
    client.post("/api/llm/model", json={"model": "minimax/minimax-m3"})


