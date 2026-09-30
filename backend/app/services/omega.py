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
