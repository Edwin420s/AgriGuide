import pytest
from app.services.llm import LLMService

def test_heuristic_rainfall_extraction():
    """Verify that natural language reports of active rain extract current_rainfall predicate."""
    service = LLMService()
    obs = service._extract_heuristic("Heavy rain started 15 minutes ago on the south plot")
    assert obs.predicate == "current_rainfall"
    assert obs.value["value"] is True
    assert obs.value["intensity"] == "heavy"
    assert obs.confidence >= 0.85

def test_heuristic_temperature_extraction():
    """Verify that temperature reports extract temperature_c with numeric precision."""
    service = LLMService()
    obs = service._extract_heuristic("Field temperature reading is 28.5 degrees C today")
    assert obs.predicate == "temperature_c"
    assert obs.value["value"] == 28.5
    assert obs.confidence >= 0.90

def test_heuristic_soil_dryness_extraction():
    """Verify that descriptions of parched, cracked soil map to low moisture estimates."""
    service = LLMService()
    obs = service._extract_heuristic("The soil is parched and cracked under the midday sun")
    assert obs.predicate == "soil_moisture"
    assert obs.value["value"] <= 18.0
    assert obs.value["qualitative"] == "dry"

def test_heuristic_rain_clouds_forecast():
    """Verify that sightings of dark clouds extract a forward weather forecast."""
    service = LLMService()
    obs = service._extract_heuristic("Heavy dark clouds gathering over the horizon, rain later")
    assert obs.predicate == "weather_forecast"
    assert obs.value["rain_expected"] is True
    assert obs.value["probability"] >= 70.0
