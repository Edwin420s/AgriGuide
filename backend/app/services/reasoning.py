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

        if conflicts:
            for c in conflicts:
                steps.append({
                    "sequence": len(steps) + 1,
                    "type": "CONFLICT_DETECTION",
                    "rule_id": "R-CONFLICT-PENALTY",
                    "input": {"sources": c["sources"], "values": c["values"]},
                    "output": c["description"],
                    "confidence": 0.50
                })

        # Run MeTTa symbolic engine
        try:
            metta_res = metta_service.execute_query(
                soil=soil,
                rain=rain,
                water=water,
                current_rain=current_rain,
                crop_demand=crop_demand,
                custom_rules=custom_rules
            )
            rec = metta_res.recommendation
            rules = metta_res.rules
            reason = metta_res.reason
            source = metta_res.source

            # Incorporate MeTTa execution steps
            for s in metta_res.steps:
                steps.append({
                    "sequence": len(steps) + 1,
                    "type": s.get("type", "METTA_EVAL"),
                    "rule_id": s.get("rule_id", rules[0] if rules else "METTA_RULE"),
                    "input": s.get("input", {}),
                    "output": s.get("output", rec),
                    "confidence": s.get("confidence", 0.90)
                })

            # Calculate calibrated confidence
            base_conf = metta_res.confidence
            if conflicts:
                base_conf = max(0.40, base_conf - 0.20)
            confidence = round(max(0.40, min(0.98, 0.4 * weather_conf + 0.4 * soil_conf + 0.2 * base_conf)), 2)

            steps.append({
                "sequence": len(steps) + 1,
                "type": "DECISION",
                "rule_id": rules[0] if rules else "FINAL_DECISION",
                "input": {"rules_fired": rules, "engine": source},
                "output": rec,
                "confidence": confidence
            })

            return ReasoningResult(
                recommendation=rec,
                confidence=confidence,
                reason=reason,
                rules=rules,
                steps=steps,
                source=source,
                counterfactuals=metta_res.counterfactuals
