# 10-Point Scientific Benchmark Specification

## Suite Objectives
The benchmark suite evaluates AgriGuide against real-world agricultural edge cases and safety constraints.

## Test Cases Summary
1. Critically Dry Field + Low Rain: Soil 14%, Rain 10% -> Decision must be IRRIGATE.
2. Divergent Sensor vs Satellite: Soil sensor 18%, forecast 80% -> Conflict detected.
3. Telemetry Spike: Soil jumps 18% -> 91% in 60s -> Anomaly detected and rejected.
4. Frozen Telemetry: 5 consecutive identical readings -> Stale telemetry flagged.
5. Counterfactual Analysis: Evaluate trade-offs between IF_IRRIGATE and IF_WAIT.
6. Irrigation Duration Clamp: Requested 60 min clamped to safe 30 min maximum.
7. Water Exhaustion Lockout: Water unavailable -> Immediate valve lockout.
8. Fertilizer Runoff Guard: Pre-storm fertilizer lockout enforced.
9. Seedbed Moisture Guard: Prevent planting into bone-dry seedbeds (<18%).
10. Harvest Window Selection: Select dry-down interval during physiological maturity.
