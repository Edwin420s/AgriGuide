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
