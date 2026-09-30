# Deterministic Safety Policy & Actuation Guardrails

## Philosophy
In mission-critical agricultural environments, AI recommendations must never directly actuate pumps, valves, or machinery without deterministic guardrails. AgriGuide establishes a strict four-stage execution pipeline:

```text
Cognitive Reasoning (AI / MeTTa)
              │
              ▼
       Action Proposal
              │
              ▼
   Deterministic Policy Check
              │
              ▼
     Physical Actuation
```

## Enforced Policy Rules

### 1. Maximum Duration Clamping
- **Ceiling**: 30 minutes continuous irrigation per zone.
- **Behavior**: If an AI proposal requests > 30 minutes (e.g. 60 or 90 minutes), the `SafetyPolicyEngine` clamps the parameter down to 30 minutes, marks the action as `MODIFIED`, and issues an audit warning.

### 2. Imminent Precipitation Lock-Out
- **Threshold**: Rain forecast probability $\ge 80\%$ or active precipitation detected.
- **Behavior**: Physical irrigation is rejected outright (`REJECTED`) to avoid water logging and financial waste.

### 3. Wind Velocity Limit
- **Threshold**: Wind speed $> 35\text{ km/h}$.
- **Behavior**: Overhead sprinklers and chemical sprays are blocked to avoid pesticide drift and evaporative loss.

### 4. Water Quota Gate
- **Condition**: Farm water reservoir marked `UNAVAILABLE`.
- **Behavior**: Complete shutdown of irrigation commands until reservoir replenishment.
