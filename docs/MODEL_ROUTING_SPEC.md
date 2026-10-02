# Neural Perception Model Routing Matrix

## Purpose
AgriGuide integrates an intelligent Model Router (`app/services/model_router.py`) that matches agricultural tasks with the optimal language model based on cost, speed, and capability.

## Model Capability Profiles

| Model ID | Provider | Latency Tier | Best Suited For |
| :--- | :--- | :--- | :--- |
| `minimax/minimax-m3` | SingularityNET ASI Cloud | Fast (Balanced) | Structured observation extraction from qualitative farmer notes |
| `asi1-mini` | SingularityNET ASI Cloud | Ultra-Fast | Rapid Swahili / English translation and greeting generation |
| `google/gemma-3-27b-it` | ASI Cloud / OpenRouter | Deep Reasoning | Complex multi-sentence agronomic explanations and counterfactual analysis |

## Routing Flow
1. Incoming farmer message evaluated for task complexity and language.
2. Router selects targeted model from supported catalog.
3. Structured output schema validated against Pydantic model (`ParsedObservation`).
4. Fallback to deterministic heuristic parser if neural gateway is unreachable.
