"""Deterministic Safety Policy and Action Proposal Layer.

Enforces physical and administrative guardrails on AI-generated recommendations.
Strictly separates:
  Recommendation (Cognitive output) -> Action Proposal -> Policy Check -> Authorized Execution
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class PolicyCheckResult:
    allowed: bool
    status: str  # "APPROVED" | "MODIFIED" | "REJECTED"
    clamped_params: dict[str, Any]
    violations: list[str]
    audit_notes: list[str]


class SafetyPolicyEngine:
    """Deterministic policy gatekeeper.

    LLM outputs and autonomous cognitive decisions MUST pass through this layer
    before being proposed or executed on physical valves, pumps, or tractors.
    """

    MAX_IRRIGATION_DURATION_MIN = 30
    MAX_WIND_SPEED_KMH = 35.0
    MIN_RAIN_LOCKOUT_PROB = 80.0

    def verify_action(self, action_type: str, proposed_params: dict[str, Any], field_state: dict[str, Any]) -> PolicyCheckResult:
        clamped = dict(proposed_params)
        violations = []
        notes = []

        if action_type.upper() == "IRRIGATE":
            # 1. Water quota check
            water_avail = field_state.get("water_availability", "LIMITED").upper()
            if water_avail == "UNAVAILABLE":
                violations.append("CRITICAL: Farm water reserves are depleted. Physical irrigation blocked.")
                return PolicyCheckResult(
                    allowed=False,
                    status="REJECTED",
                    clamped_params=clamped,
                    violations=violations,
                    audit_notes=["Policy rejection: water_availability == UNAVAILABLE"]
                )

            # 2. Duration clamping policy
            duration = proposed_params.get("duration_minutes", 20)
            if duration > self.MAX_IRRIGATION_DURATION_MIN:
                clamped["duration_minutes"] = self.MAX_IRRIGATION_DURATION_MIN
                notes.append(f"Clamped duration from {duration}m to safety ceiling {self.MAX_IRRIGATION_DURATION_MIN}m.")

            # 3. Wind speed lock-out
            wind = field_state.get("wind_speed_kmh", 10.0)
            if wind > self.MAX_WIND_SPEED_KMH:
                violations.append(f"High wind hazard: {wind} km/h exceeds maximum 35 km/h spray/drip threshold.")
                return PolicyCheckResult(
                    allowed=False,
                    status="REJECTED",
                    clamped_params=clamped,
                    violations=violations,
                    audit_notes=["Policy rejection: excessive wind velocity"]
                )

            # 4. Imminent precipitation lock-out
            rain_prob = field_state.get("rain_probability_24h", 0.0)
            cur_rain = field_state.get("current_rainfall", False)
            if cur_rain or rain_prob >= self.MIN_RAIN_LOCKOUT_PROB:
                violations.append(f"Precipitation lock-out: Rain probability is {rain_prob}% (or currently raining). Irrigation suppressed.")
                return PolicyCheckResult(
                    allowed=False,
                    status="REJECTED",
                    clamped_params=clamped,
                    violations=violations,
                    audit_notes=["Policy rejection: natural precipitation override"]
                )

        elif action_type.upper() == "APPLY_FERTILIZER":
            rain_prob = field_state.get("rain_probability_24h", 0.0)
            if rain_prob >= 70.0:
                violations.append("Environmental protection: Imminent rain risks acute nitrogen runoff.")
                return PolicyCheckResult(
                    allowed=False,
                    status="REJECTED",
                    clamped_params=clamped,
                    violations=violations,
                    audit_notes=["Policy rejection: nitrate leaching hazard"]
                )

        status = "MODIFIED" if notes else "APPROVED"
        return PolicyCheckResult(
            allowed=True,
            status=status,
            clamped_params=clamped,
            violations=violations,
            audit_notes=notes or ["All deterministic safety policies satisfied."]
        )
