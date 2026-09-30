"""Multi-Domain Agricultural Decision Engine.

Expands AgriGuide beyond irrigation into comprehensive farm intelligence:
1. Irrigation (Water conservation, timing, duration)
2. Planting (Seedbed moisture, temperature, seasonal onset window)
3. Fertilization (Side-dressing timing, leaching prevention, wind limits)
4. Crop Health & Stress (Drought stress, heat stress, canopy anomaly)
5. Weather Risk (Heavy storm alert, lodging hazard, dry-spell contingency)
6. Harvest Readiness (Maturity days, grain desiccation, mold risk prevention)
"""

from dataclasses import dataclass, field
from typing import Any
from app.services.reasoning import ReasoningResult


@dataclass
class DomainDecision:
    domain: str
    recommendation: str
    confidence: float
    reason: str
    rules: list[str]
    steps: list[dict[str, Any]]
    action_params: dict[str, Any] = field(default_factory=dict)
    counterfactuals: dict[str, Any] = field(default_factory=dict)


class MultiDomainAgriculturalEngine:
    """Unified cognitive decision engine for all farm operations."""

    def evaluate_planting(self, state: dict[str, Any]) -> DomainDecision:
        soil_moisture = state.get("soil_moisture") or 15.0
        temp = state.get("temperature_c") or 24.0
        forecast_rain = state.get("rain_probability_24h") or 20.0
        season_onset = state.get("season_onset", True)

        steps = [
            {"sequence": 1, "type": "OBSERVATION", "input": {"soil_moisture": soil_moisture, "temp": temp}, "output": "Seedbed conditions assessed", "confidence": 0.90},
            {"sequence": 2, "type": "METTA_EVAL", "rule_id": "R-PLANTING-WINDOW-CHECK", "input": {"season_onset": season_onset}, "output": "Evaluating germination envelope", "confidence": 0.92}
        ]

        if not season_onset:
            rec = "DELAY_PLANTING"
            rule = "R-SEASON-NOT-OPEN"
            reason = "Official regional seasonal onset criteria have not been satisfied."
            conf = 0.92
        elif soil_moisture < 18.0:
            rec = "DELAY_PLANTING"
            rule = "R-SEEDBED-TOO-DRY"
            reason = f"Soil moisture ({soil_moisture}%) is below minimum 18% required for reliable seed germination."
            conf = 0.89
        elif temp > 35.0:
            rec = "DELAY_PLANTING"
            rule = "R-HEAT-STRESS-EMERGENCE"
            reason = f"Soil surface temperature ({temp}°C) exceeds safe emergence limits."
            conf = 0.86
        elif soil_moisture >= 20.0 and forecast_rain >= 35.0:
            rec = "PLANT"
            rule = "R-OPTIMAL-PLANTING-WINDOW"
            reason = "Soil moisture, temperature, and 7-day rainfall outlook provide an optimal planting window."
            conf = 0.95
        else:
            rec = "MONITOR"
            rule = "R-MARGINAL-PLANTING-CONDITIONS"
            reason = "Conditions are marginal; monitor seedbed moisture over next 48 hours."
            conf = 0.72

        steps.append({"sequence": 3, "type": "DECISION", "rule_id": rule, "input": {"rec": rec}, "output": rec, "confidence": conf})
        return DomainDecision(
            domain="planting",
            recommendation=rec,
            confidence=conf,
            reason=reason,
            rules=[rule],
            steps=steps,
            action_params={"target_depth_cm": 5.0, "seed_variety": "H614"},
            counterfactuals={"if_plant_now": "High seedling vigor if rain arrives", "if_delay": "Avoid premature germination failure"}
        )

    def evaluate_fertilization(self, state: dict[str, Any]) -> DomainDecision:
        stage = (state.get("growth_stage") or "vegetative").lower()
        soil_moisture = state.get("soil_moisture") or 18.0
        rain_24h = state.get("rain_probability_24h") or 15.0
        wind = state.get("wind_speed_kmh") or 10.0

        steps = [
            {"sequence": 1, "type": "OBSERVATION", "input": {"stage": stage, "soil_moisture": soil_moisture, "rain_24h": rain_24h, "wind": wind}, "output": "Nutrient uptake context evaluated", "confidence": 0.92}
        ]

        if rain_24h >= 70.0:
            rec = "DELAY_FERTILIZER"
            rule = "R-NITROGEN-LEACHING-RISK"
            reason = f"High rain probability ({rain_24h}%) presents severe nitrate leaching and runoff hazard."
            conf = 0.94
        elif wind > 25.0:
            rec = "DELAY_FERTILIZER"
            rule = "R-WIND-DRIFT-HAZARD"
            reason = f"Wind speed ({wind} km/h) exceeds safe threshold for uniform application."
            conf = 0.90
        elif soil_moisture < 14.0:
            rec = "DELAY_FERTILIZER"
            rule = "R-SOIL-TOO-DRY-FOR-UPTAKE"
            reason = "Soil is too dry for granule dissolution; risk of root osmotic burn."
            conf = 0.88
        elif stage in {"vegetative", "flowering", "knee-high"} and soil_moisture >= 18.0 and rain_24h < 40.0:
            rec = "APPLY_FERTILIZER"
            rule = "R-OPTIMAL-SIDE-DRESSING"
            reason = f"Crop stage ({stage}) actively requires nitrogen side-dressing with adequate soil moisture and low leaching risk."
            conf = 0.92
        else:
            rec = "MONITOR"
            rule = "R-SUBOPTIMAL-FERTILIZATION"
            reason = "Nutrient application conditions are neutral; postpone."
            conf = 0.70

        steps.append({"sequence": 2, "type": "DECISION", "rule_id": rule, "input": {"rec": rec}, "output": rec, "confidence": conf})
        return DomainDecision(
            domain="fertilization",
            recommendation=rec,
            confidence=conf,
            reason=reason,
            rules=[rule],
            steps=steps,
            action_params={"fertilizer_type": "CAN / Urea", "rate_kg_per_ha": 50.0},
            counterfactuals={"if_apply_now": "Immediate root absorption", "if_rain_washes": "80% fertilizer financial loss"}
        )

    def evaluate_crop_health(self, state: dict[str, Any]) -> DomainDecision:
        dry_days = state.get("consecutive_dry_days") or 2
        max_temp = state.get("temperature_c") or 26.0
        canopy_anomaly = state.get("canopy_anomaly", False)

        steps = [
            {"sequence": 1, "type": "OBSERVATION", "input": {"dry_days": dry_days, "max_temp": max_temp, "anomaly": canopy_anomaly}, "output": "Crop stress telemetry checked", "confidence": 0.88}
        ]

        if dry_days >= 7 and max_temp >= 32.0:
            rec = "SEVERE_WATER_STRESS"
            rule = "R-PROLONGED-DROUGHT-HEAT"
            reason = f"Field has experienced {dry_days} consecutive rainless days at {max_temp}°C; permanent wilting risk."
            conf = 0.93
        elif canopy_anomaly:
            rec = "PATHOGEN_OR_DEFICIENCY"
            rule = "R-CANOPY-ANOMALY"
            reason = "Canopy optical sensors or farmer images detect localized chlorophyll deficit."
            conf = 0.85
        elif dry_days >= 4:
            rec = "MILD_MOISTURE_DEFICIT"
            rule = "R-EARLY-WILTING-WATCH"
            reason = f"{dry_days} days without rain; monitor for leaf curling during midday peak sun."
            conf = 0.78
        else:
            rec = "HEALTHY"
            rule = "R-CROP-VIGOR-GOOD"
            reason = "Vegetation index and hydration indicators are within nominal parameters."
            conf = 0.92

        steps.append({"sequence": 2, "type": "DECISION", "rule_id": rule, "input": {"rec": rec}, "output": rec, "confidence": conf})
        return DomainDecision(
            domain="crop_health",
            recommendation=rec,
            confidence=conf,
            reason=reason,
            rules=[rule],
            steps=steps,
            action_params={"inspection_urgency": "HIGH" if "STRESS" in rec else "ROUTINE"}
        )

    def evaluate_weather_risk(self, state: dict[str, Any]) -> DomainDecision:
        rain_prob = state.get("rain_probability_24h") or 15.0
        wind = state.get("wind_speed_kmh") or 12.0
        dry_days = state.get("consecutive_dry_days") or 2

        steps = [
            {"sequence": 1, "type": "OBSERVATION", "input": {"rain_prob": rain_prob, "wind": wind, "dry_days": dry_days}, "output": "Meteorological threat analysis", "confidence": 0.91}
        ]

        if rain_prob >= 85.0 and wind >= 45.0:
            rec = "SEVERE_STORM_LODGING_RISK"
            rule = "R-STORM-WATCH"
            reason = "Imminent severe convective storm with wind gusts exceeding 45 km/h; lodging hazard for tall crops."
            conf = 0.94
        elif dry_days >= 14:
            rec = "DROUGHT_HAZARD"
            rule = "R-DROUGHT-WATCH"
            reason = "14-day dry spell active; activate community water rotation contingency."
            conf = 0.90
        else:
            rec = "LOW_RISK"
            rule = "R-WEATHER-NOMINAL"
            reason = "Weather metrics indicate no acute microclimate hazards."
            conf = 0.88

        steps.append({"sequence": 2, "type": "DECISION", "rule_id": rule, "input": {"rec": rec}, "output": rec, "confidence": conf})
        return DomainDecision(
            domain="weather_risk",
            recommendation=rec,
            confidence=conf,
            reason=reason,
            rules=[rule],
            steps=steps
        )

    def evaluate_harvest(self, state: dict[str, Any]) -> DomainDecision:
        stage = (state.get("growth_stage") or "").lower()
        days_planted = state.get("days_since_planting") or 90
        maturity_days = state.get("maturity_days") or 120
        rain_3d = state.get("rain_probability_24h") or 20.0
        grain_moisture = state.get("grain_moisture") or 18.0

        steps = [
            {"sequence": 1, "type": "OBSERVATION", "input": {"days_planted": days_planted, "maturity_days": maturity_days, "grain_moisture": grain_moisture}, "output": "Physiological maturity evaluated", "confidence": 0.95}
        ]

        if days_planted < maturity_days and stage != "maturity":
            rec = "DELAY_HARVEST"
            rule = "R-PHYSIOLOGICAL-IMMATURE"
            reason = f"Crop has only reached day {days_planted} of {maturity_days}; grain fill in progress."
            conf = 0.95
        elif rain_3d >= 60.0:
            rec = "DELAY_HARVEST"
            rule = "R-AWAIT-DRY-HARVEST-WINDOW"
            reason = "Upcoming rainfall creates severe aflatoxin/mold infection risk; delay harvest until dry spell."
            conf = 0.89
        elif grain_moisture <= 15.0 and rain_3d < 30.0:
            rec = "HARVEST"
            rule = "R-OPTIMAL-HARVEST-WINDOW"
            reason = f"Crop is fully mature, grain moisture is safe ({grain_moisture}%), and dry weather window confirmed."
            conf = 0.96
        else:
            rec = "MONITOR"
            rule = "R-DRYING-IN-PROGRESS"
            reason = f"Crop is mature but grain moisture ({grain_moisture}%) requires further in-field dry-down."
            conf = 0.78

        steps.append({"sequence": 2, "type": "DECISION", "rule_id": rule, "input": {"rec": rec}, "output": rec, "confidence": conf})
        return DomainDecision(
            domain="harvest",
            recommendation=rec,
            confidence=conf,
            reason=reason,
            rules=[rule],
            steps=steps,
            action_params={"safe_storage_moisture_target": 13.5}
        )

    def evaluate_holistic(self, state: dict[str, Any]) -> dict[str, DomainDecision]:
        """Evaluates all agricultural domains simultaneously for complete farm intelligence."""
        return {
            "planting": self.evaluate_planting(state),
            "fertilization": self.evaluate_fertilization(state),
            "crop_health": self.evaluate_crop_health(state),
            "weather_risk": self.evaluate_weather_risk(state),
            "harvest": self.evaluate_harvest(state),
        }
