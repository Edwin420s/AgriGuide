"""Omega Agent Architecture for AgriGuide.

Implements a stateful cognitive agent built on MeTTa symbolic skills.
Maintains persistent episodic memory across runs, reconciles changing evidence
against prior decisions to trigger auditable supersessions, and executes
declarative skills defined in `omega/skills/agriguide.metta`.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
import httpx
from app.core.config import settings
from app.services.reasoning import IrrigationReasoner, ReasoningResult

@dataclass
class OmegaEpisode:
    """An episodic memory record stored in the agent's persistent state."""
    goal: str
    recommendation: str
    confidence: float
    reason: str
    rules: list[str]
    timestamp: str
    state_snapshot: dict[str, Any] = field(default_factory=dict)
    supersedes_prior: bool = False

@dataclass
class OmegaResult:
    reasoning: ReasoningResult
    memory: list[dict[str, Any]]
    mode: str
    agent_id: str = "omega-agriguide-agent-01"
    skill_contract: str = "omega/skills/agriguide.metta"

class OmegaAgent:
    """Stateful Omega Cognitive Decision Agent.

    Encapsulates:
    1. Identity & Skill Contract: Invokes `omega/skills/agriguide.metta`.
    2. Persistent Memory: Retains episodic traces across runs.
    3. Memory Reconciliation: Detects when new sensory telemetry invalidates
       prior decision assumptions, generating explicit cognitive diff steps.
    """
    def __init__(self):
        self.agent_id = "omega-agriguide-agent-01"
        self.skill_contract = "omega/skills/agriguide.metta"
        self.reasoner = IrrigationReasoner()
        self.episodes: list[OmegaEpisode] = []

    def run(self, goal: str, state: dict[str, Any], memory: list[dict[str, Any]]) -> OmegaResult:
        # 1. External Gateway Option (if active in production cluster)
        if settings.omega_mode == "external" and settings.omega_url:
            try:
                r = httpx.post(
                    settings.omega_url,
                    json={"agent_id": self.agent_id, "goal": goal, "state": state, "memory": memory},
                    timeout=20
                )
                r.raise_for_status()
                payload = r.json()
                rr = ReasoningResult(
                    recommendation=payload["recommendation"],
                    confidence=payload["confidence"],
                    reason=payload["reason"],
                    rules=payload.get("rules", []),
                    steps=payload.get("steps", []),
                    source="omega-gateway",
                    counterfactuals=payload.get("counterfactuals", {})
                )
                updated_mem = memory + [{
                    "goal": goal,
                    "recommendation": rr.recommendation,
                    "confidence": rr.confidence,
                    "reason": rr.reason,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }]
                return OmegaResult(rr, updated_mem[-20:], "omega-gateway")
            except Exception:
                pass  # Fall back gracefully to native local Omega-MeTTa engine

        # 2. Native Omega-MeTTa Cognitive Cycle
        # Step A: Reconcile with persistent episodic memory
        reconciliation_step = self._reconcile_memory(state, memory)

        # Step B: Execute MeTTa skill contract reasoning
        reasoning_res = self.reasoner.decide(state)

        # Step C: Prepend Omega Cognitive Memory & Ingestion Steps to reasoning trace
        omega_steps: list[dict[str, Any]] = [
            {
                "sequence": 1,
                "type": "OMEGA_AGENT_INIT",
                "rule_id": "OMEGA-CORE-CYCLE",
                "input": {"agent_id": self.agent_id, "goal": goal, "skill": self.skill_contract},
                "output": f"Omega agent activated goal: '{goal}'",
                "confidence": 0.99
            }
        ]

        if reconciliation_step:
            omega_steps.append(reconciliation_step)

        # Shift existing reasoning steps sequence numbers
        start_idx = len(omega_steps) + 1
        for i, s in enumerate(reasoning_res.steps, start_idx):
            s["sequence"] = i
            omega_steps.append(s)

        reasoning_res.steps = omega_steps
        reasoning_res.source = "omega-native-metta"

        # Step D: Update Omega Persistent Memory Buffer
        is_supersession = bool(reconciliation_step and reconciliation_step.get("supersedes_prior"))
        new_episode = {
            "agent_id": self.agent_id,
            "goal": goal,
            "recommendation": reasoning_res.recommendation,
            "confidence": reasoning_res.confidence,
            "reason": reasoning_res.reason,
            "rules": reasoning_res.rules,
            "supersedes_prior": is_supersession,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "state_snapshot": {
                "soil_moisture": state.get("soil_moisture"),
                "rain_probability_24h": state.get("rain_probability_24h"),
                "current_rainfall": state.get("current_rainfall", False),
                "water_availability": state.get("water_availability", "LIMITED")
            }
        }
        updated_memory = memory + [new_episode]

        return OmegaResult(
            reasoning=reasoning_res,
            memory=updated_memory[-20:],
            mode="omega-native-metta",
            agent_id=self.agent_id,
            skill_contract=self.skill_contract
        )

    def _reconcile_memory(self, current_state: dict[str, Any], memory: list[dict[str, Any]]) -> dict[str, Any] | None:
        """Inspects past decisions in Omega memory to identify state revisions and supersessions."""
        if not memory:
            return None

        # Retrieve most recent decision episode from Omega memory
        prior = memory[-1]
        prior_rec = prior.get("decision") or prior.get("recommendation")
        if not prior_rec:
            return None

        rain = current_state.get("rain_probability_24h", 0)
        c_rain = current_state.get("current_rainfall", False)

        # Check if rain telemetry invalidates an earlier IRRIGATE decision
        if prior_rec == "IRRIGATE" and (rain >= 70 or c_rain):
            return {
                "sequence": 2,
                "type": "OMEGA_MEMORY_RECONCILIATION",
                "rule_id": "OMEGA-REVISE-PRIOR-DECISION",
                "input": {
                    "prior_recommendation": prior_rec,
                    "new_telemetry": {"rain_probability_24h": rain, "current_rainfall": c_rain}
                },
                "output": "Memory conflict detected: New rainfall telemetry invalidates prior dry assumption; triggering state supersession.",
                "confidence": 0.95,
                "supersedes_prior": True
            }

        return {
            "sequence": 2,
            "type": "OMEGA_MEMORY_RECALL",
            "rule_id": "OMEGA-RECALL-PRIOR",
            "input": {"prior_recommendation": prior_rec},
            "output": f"Recalled prior decision from Omega memory: {prior_rec}",
            "confidence": 0.92,
            "supersedes_prior": False
        }

