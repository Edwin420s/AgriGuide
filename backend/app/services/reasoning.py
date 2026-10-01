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
            )
        except Exception as e:
            # Fallback to deterministic rules if unexpected exception
            return self._fallback_decide(state, steps, str(e))

    def _fallback_decide(self, state: dict[str, Any], steps: list[dict[str, Any]], error_msg: str) -> ReasoningResult:
        soil = state.get("soil_moisture")
        rain = state.get("rain_probability_24h")
        water = state.get("water_availability", "LIMITED")
        current_rain = state.get("current_rainfall", False)
        weather_conf = state.get("weather_confidence", 0.7)
        soil_conf = state.get("soil_confidence", 0.7)

        if soil is None or rain is None:
            return ReasoningResult(
                "REASSESS", 0.45, "Required field evidence is missing.",
                ["R-REASSESS-MISSING"],
                steps + [{"sequence": len(steps)+1, "type": "CONFLICT", "output": "missing required evidence"}],
                "fallback"
            )

        if current_rain:
            rec = "WAIT"; rules = ["R-CURRENT-RAIN"]
            reason = "Rain is currently observed, so immediate irrigation is not recommended."
        elif rain >= 70 and water == "LIMITED":
            rec = "WAIT"; rules = ["R-HIGH-RAIN-WATER-CONSERVATION"]
            reason = "Expected rainfall is high and water is limited; delaying irrigation."
        elif soil <= 18 and rain < 35 and water != "UNAVAILABLE":
            rec = "IRRIGATE"; rules = ["R-LOW-MOISTURE-LOW-RAIN"]
            reason = "Soil moisture is critically low and rain is unlikely."
        else:
            rec = "REASSESS"; rules = ["R-UNCERTAIN-OR-BALANCED"]
            reason = "Evidence is balanced; monitor conditions and reassess."

        confidence = round(max(0.5, min(0.95, 0.45 * weather_conf + 0.45 * soil_conf + 0.10)), 2)
        steps.append({
            "sequence": len(steps) + 1,
            "type": "DECISION",
            "rule_id": rules[0],
            "input": {"fallback_reason": error_msg},
            "output": rec,
            "confidence": confidence
        })
        cf = metta_service.evaluate_counterfactuals(soil or 20.0, rain or 20.0, water, current_rain, rec)
        return ReasoningResult(rec, confidence, reason, rules, steps, "fallback", counterfactuals=cf)
