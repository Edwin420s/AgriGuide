# SingularityNET ASI Cloud Multi-Model Routing Guide

AgriGuide dynamically routes cognitive workloads across 5 supported models on SingularityNET's ASI Cloud infrastructure (`https://llm.c.singularitynet.io/v1`).

## Model Catalog & Specializations

| Model ID | Provider / Heritage | Primary Workload in AgriGuide | Context Window |
| :--- | :--- | :--- | :---: |
| `minimax/minimax-m3` | MiniMax | **Default Cognitive Agent**: Complex reasoning, world state synthesis, and planning. | 128k |
| `asi1-mini` | SingularityNET | **Perception & Telemetry**: Ultra-fast parsing of raw SMS and sensor payloads. | 32k |
| `google/gemma-3-27b-it` | Google DeepMind | **Typed Extraction**: High-precision JSON schema alignment and typed predicate conversion. | 8k |
| `meta-llama/llama-3.3-70b-instruct` | Meta AI | **Counterfactual Audits**: Deep 70B parameter formal verification and conflict resolution. | 128k |
| `qwen/qwen3-32b` | Alibaba Cloud | **Multilingual Consultation**: Superior dialect comprehension in Swahili and East African vernacular. | 32k |

## Operational Router Architecture

Workloads are dispatched via `ModelTaskRouter`:

```python
from app.services.model_router import task_router

# Automatic routing based on operation type
selected_model = task_router.resolve_model("perception")  # returns 'asi1-mini'
selected_model = task_router.resolve_model("consultation")  # returns 'qwen/qwen3-32b'
```

If the remote API endpoint is unreachable or in offline demonstration mode, the runtime falls back gracefully to deterministic rule-based mock generators without interruption.
