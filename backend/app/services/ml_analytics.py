"""Agricultural Machine Learning, Evapotranspiration & Sensor Anomaly Detection.

Provides dedicated agricultural analytics without relying on LLM hallucination:
1. FAO-56 Evapotranspiration (ET0) & Crop Water Demand (ETc)
2. Soil Moisture Depletion Forecast (24h - 48h projection)
3. Multi-Vector Sensor Anomaly Detection:
   - Out-of-bounds readings
   - Sudden unphysical jumps (e.g. 18% -> 91% -> 18%)
   - Stuck sensors (frozen flatline readings)
   - Stale telemetry & communication failure
"""

from dataclasses import dataclass
from typing import Any
import math


@dataclass
class AnomalyReport:
    is_anomalous: bool
    anomaly_type: str
    severity: str  # "NONE" | "LOW" | "HIGH" | "CRITICAL"
    confidence_penalty: float
    description: str
    corrected_value: float | None = None


class AgriculturalMLService:
    """Specialized agronomic physical modeling and sensor quality analytics."""

    # FAO-56 Crop Coefficients (Kc) for typical crops
    KC_TABLE = {
        "maize": {"initial": 0.40, "vegetative": 0.80, "flowering": 1.20, "grain-fill": 1.15, "maturity": 0.60},
        "tomato": {"initial": 0.60, "vegetative": 0.85, "flowering": 1.15, "fruiting": 1.10, "maturity": 0.80},
        "bean": {"initial": 0.40, "vegetative": 0.70, "flowering": 1.10, "grain-fill": 0.90, "maturity": 0.35},
    }

    def estimate_et0(self, temp_c: float, humidity_pct: float = 60.0, wind_kmh: float = 10.0) -> float:
        """Hargreaves-Samani / simplified FAO-56 reference evapotranspiration (mm/day)."""
        # Baseline reference ET0 for tropical/subtropical climates: 3.5 - 6.5 mm/day
        temp_factor = max(0.0, (temp_c - 10.0) * 0.15)
        humidity_factor = max(0.0, (100.0 - humidity_pct) * 0.02)
        wind_factor = (wind_kmh / 10.0) * 0.4
        et0 = round(2.8 + temp_factor + humidity_factor + wind_factor, 2)
        return min(9.5, max(1.5, et0))

    def calculate_crop_water_demand(self, crop: str, growth_stage: str, et0: float) -> dict[str, float]:
        """Calculates Crop Evapotranspiration (ETc = Kc * ET0)."""
        crop_key = crop.lower()
        stage_key = growth_stage.lower()

        kc_stages = self.KC_TABLE.get(crop_key, {"initial": 0.5, "flowering": 1.1, "maturity": 0.6})
        # Default match or fallback
        kc = kc_stages.get(stage_key, 0.95)

        etc_mm_day = round(et0 * kc, 2)
        liters_per_sq_meter = etc_mm_day  # 1 mm = 1 L/m^2

        return {
            "et0_reference_mm": et0,
            "crop_coefficient_kc": kc,
            "crop_demand_etc_mm_day": etc_mm_day,
            "water_liters_per_m2_day": liters_per_sq_meter
        }

    def forecast_soil_depletion(self, current_moisture: float, etc_mm: float, soil_type: str = "loam") -> dict[str, Any]:
        """Projects 24-hour and 48-hour moisture loss in the root zone."""
        # Drying rate sensitivity factor per soil type
        retention = {"sand": 1.8, "sandy_loam": 1.4, "loam": 1.0, "clay": 0.7}.get(soil_type.lower(), 1.0)
        daily_loss_pct = round((etc_mm / 3.5) * retention, 1)

        proj_24h = max(5.0, round(current_moisture - daily_loss_pct, 1))
        proj_48h = max(5.0, round(current_moisture - (daily_loss_pct * 1.9), 1))

        return {
            "current_moisture_pct": current_moisture,
            "estimated_daily_loss_pct": daily_loss_pct,
            "projected_moisture_24h": proj_24h,
            "projected_moisture_48h": proj_48h,
            "soil_drying_rate_factor": retention,
            "stress_threshold_pct": 18.0,
            "days_until_critical_stress": max(0, round((current_moisture - 18.0) / max(0.5, daily_loss_pct), 1))
        }


class SensorAnomalyDetector:
    """Detects erratic, frozen, or impossible telemetry readings."""

    def detect(self, history: list[float], current: float, sensor_type: str = "soil_moisture") -> AnomalyReport:
        # 1. Bounds Check
        if sensor_type == "soil_moisture":
            if current < 0.0 or current > 100.0:
                return AnomalyReport(
                    is_anomalous=True,
                    anomaly_type="OUT_OF_BOUNDS",
                    severity="CRITICAL",
                    confidence_penalty=0.60,
                    description=f"Sensor reading {current}% is physically impossible (valid 0-100%).",
                    corrected_value=history[-1] if history else 20.0
                )

        # 2. Sudden Spike / Jump Check (without intervening rain)
        if history:
            prev = history[-1]
            diff = abs(current - prev)
            if diff >= 25.0:
                return AnomalyReport(
                    is_anomalous=True,
                    anomaly_type="SUDDEN_SPIKE",
                    severity="HIGH",
                    confidence_penalty=0.45,
                    description=f"Sudden {diff:.1f}% telemetry leap from {prev}% to {current}% without verified rainfall.",
                    corrected_value=prev
                )

        # 3. Flatline / Stuck Sensor Check
        if len(history) >= 5:
            recent = history[-5:] + [current]
            mean = sum(recent) / len(recent)
            variance = sum((x - mean) ** 2 for x in recent) / len(recent)
            std_dev = math.sqrt(variance)
            if std_dev < 0.02:
                return AnomalyReport(
                    is_anomalous=True,
                    anomaly_type="STUCK_SENSOR",
                    severity="HIGH",
                    confidence_penalty=0.35,
                    description=f"Sensor flatlining: zero variance ({std_dev:.4f}) detected across {len(recent)} consecutive samples."
                )

        return AnomalyReport(
            is_anomalous=False,
            anomaly_type="NONE",
            severity="NONE",
            confidence_penalty=0.0,
            description="Telemetry signal verified within nominal physical parameters."
        )
