"""Intelligent Model Router for ASI Cloud Models.

Routes agricultural cognitive tasks to the optimal neural model:
- Fast perception (SMS/telemetry parsing) -> asi1-mini
- Schema extraction (structured predicates) -> google/gemma-3-27b-it
- General agentic reasoning & derivation -> minimax/minimax-m3
- Complex logical counterfactual proofs & audits -> meta-llama/llama-3.3-70b-instruct
- Multilingual farmer consultation (Swahili/English) -> qwen/qwen3-32b
"""

from dataclasses import dataclass
from typing import Any


@dataclass
class TaskRouteConfig:
    task: str
    default_model: str
    rationale: str
    fallback_model: str = "minimax/minimax-m3"


class ModelTaskRouter:
    """Dispatches cognitive workloads across the 5 ASI Cloud models based on operational characteristics."""

    ROUTES: dict[str, TaskRouteConfig] = {
        "perception": TaskRouteConfig(
            task="perception",
            default_model="asi1-mini",
            rationale="Ultra-low latency extraction of unstructured field telemetry and raw SMS."
        ),
        "extraction": TaskRouteConfig(
            task="extraction",
            default_model="google/gemma-3-27b-it",
            rationale="High-precision JSON schema alignment and typed predicate conversion."
        ),
        "reasoning": TaskRouteConfig(
            task="reasoning",
            default_model="minimax/minimax-m3",
            rationale="Large 128k context and stateful agentic cognitive synthesis."
        ),
        "counterfactual_audit": TaskRouteConfig(
            task="counterfactual_audit",
            default_model="meta-llama/llama-3.3-70b-instruct",
            rationale="Deep 70B parameter logical deduction and counterfactual branch auditing."
        ),
        "consultation": TaskRouteConfig(
            task="consultation",
            default_model="qwen/qwen3-32b",
            rationale="Superior multilingual performance in Swahili, regional dialects, and English."
        ),
    }

    def resolve_model(self, task: str, user_override: str | None = None) -> str:
        """Selects the model for a task, respecting explicit user overrides if provided."""
        if user_override:
            return user_override

        task_key = task.lower().strip()
        config = self.ROUTES.get(task_key)
        if config:
            return config.default_model

        # Default fallback
        return "minimax/minimax-m3"

    def get_routing_table(self) -> list[dict[str, Any]]:
        return [
            {
                "task": cfg.task,
                "default_model": cfg.default_model,
                "rationale": cfg.rationale,
                "fallback_model": cfg.fallback_model,
            }
            for cfg in self.ROUTES.values()
        ]


task_router = ModelTaskRouter()
