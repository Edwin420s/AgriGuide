"""Omega Agent Architecture for AgriGuide.

Implements a stateful cognitive agent built on MeTTa symbolic skills.
Maintains persistent episodic memory across runs, reconciles changing evidence
against prior decisions to trigger auditable supersessions, and executes
declarative skills defined in `omega/skills/agriguide.metta`.
"""

from dataclasses import dataclass, field
from datetime import datetime
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
                    "timestamp": datetime.utcnow().isoformat()
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
