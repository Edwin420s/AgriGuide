from dataclasses import dataclass
from typing import Any
from app.services.metta_runner import metta_service

@dataclass
class ReasoningResult:
    recommendation: str
    confidence: float
    reason: str
    rules: list[str]
    steps: list[dict[str, Any]]
    source: str = "metta"
    counterfactuals: dict[str, Any] = None

class IrrigationReasoner:
    """Combines MeTTa symbolic policy evaluation with explainable audit tracing."""

    def decide(self, state: dict[str, Any]) -> ReasoningResult:
        soil = state.get("soil_moisture")
        rain = state.get("rain_probability_24h")
        water = state.get("water_availability", "LIMITED")
        current_rain = state.get("current_rainfall", False)
        crop_demand = state.get("crop_water_demand", "HIGH")
        weather_conf = state.get("weather_confidence", 0.7)
        soil_conf = state.get("soil_confidence", 0.7)
        custom_rules = state.get("custom_rules", [])
        conflicts = state.get("conflicts", [])

        steps: list[dict[str, Any]] = [
            {
                "sequence": 1,
                "type": "OBSERVATION",
                "input": {
                    "soil_moisture": soil,
                    "rain_probability_24h": rain,
                    "current_rainfall": current_rain,
                    "water_availability": water
                },
                "output": "structured evidence ingested into cognitive context",
                "confidence": round((weather_conf + soil_conf) / 2, 2)
            },
            {
                "sequence": 2,
                "type": "BELIEF",
                "input": {"crop_water_demand": crop_demand},
                "output": f"field stage requires {crop_demand} water support",
                "confidence": 0.95
            }
        ]

