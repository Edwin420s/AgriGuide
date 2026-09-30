# Omega Integration & Cognitive Architecture

**Hackathon Track**: Solo Track $\rightarrow$ Omega: *One Agent Producing an Auditable Decision*

AgriGuide uses **Omega** as its persistent cognitive layer. As defined by the SingularityNET / BASIX curriculum, Omega provides neural-symbolic agent architecture on Hyperon with stateful cognition, auditable inference, long-term memory, and tool/skill extensibility.

---

## 1. Hackathon Goal: "One Agent Producing an Auditable Decision"

In accordance with the hackathon brief:
- **Sharp Feature Focus**: Rather than attempting an unfocused multi-agent sprawl, AgriGuide implements one razor-sharp cognitive agent: the **Explainable Agricultural Decision Agent**.
- **Stateful Memory**: The agent remembers past decisions per field. When new observations arrive, it links and supersedes prior decisions rather than hallucinating or wiping history.
- **Auditable Symbolic Derivations**: Decisions are derived from MeTTa S-expressions (`metta/irrigation/rules.metta` and `omega/skills/agriguide.metta`), producing transparent logical derivation proofs.
- **Continuous Calibration**: Closed-loop ground truth evaluation refines the agent's belief system over time.

---

## 2. The Cognitive Contract

AgriGuide's cognitive adapter (`backend/app/services/omega.py`) dispatches a structured goal contract:

### Input Payload (Dispatched to Cognitive Reasoner)
```json
{
  "goal": "irrigation_decision",
  "field_id": "fld_north_maize",
  "world_state": {
    "field_id": "fld_north_maize",
    "crop": "maize",
    "growth_stage": "flowering",
    "soil_moisture": 16.5,
    "rain_probability_24h": 82.0,
    "water_availability": "LIMITED",
    "current_rainfall": false,
    "crop_water_demand": "HIGH",
    "has_conflicts": false
  },
  "custom_rules": [
    {
      "name": "Kirinyaga Sandy Loam flowering buffer",
      "action": "WAIT",
      "condition": {"rain_threshold_min": 65},
      "is_active": true
    }
  ],
  "recent_decision_history": [
    {
      "id": "dec_early_01",
      "recommendation": "IRRIGATE",
      "confidence": 0.87,
      "rules": ["R-LOW-MOISTURE-LOW-RAIN"]
    }
  ]
}
```

### Cognitive Response (Returned from MeTTa / Omega)
```json
{
  "recommendation": "WAIT",
  "confidence": 0.88,
  "reason": "Rain expected (82.0% probability) within 24h + limited water availability. Conserve reservoir water.",
  "rules": ["R-HIGH-RAIN-WATER-CONSERVATION"],
  "steps": [
    {
      "sequence": 1,
      "type": "EVIDENCE_SYNTHESIS",
      "input": "soil_moisture=16.5%, rain_prob=82.0%",
      "output": "dry_soil_high_rain_conflict"
    },
    {
      "sequence": 2,
      "type": "METTA_RULE_EVALUATION",
      "input": "(irrigation-decision 16.5 82.0 limited false)",
      "output": "WAIT"
    },
    {
      "sequence": 3,
      "type": "DECISION_SUPERSEDED",
      "input": "previous=IRRIGATE",
      "output": "supersedes=dec_early_01"
    }
  ],
  "source": "metta-embedded"
}
```

---

## 3. Two Runtime Modes

### A. Local Mode (`OMEGA_MODE=local`)
Default mode for self-contained execution and evaluation.
- Leverages the embedded symbolic MeTTa runner (`backend/app/services/metta_runner.py`).
- Parses `.metta` code files faithfully using an S-expression evaluator with pattern matching, logical reduction, and operator evaluation.
- Runs without requiring external daemons or network dependencies.
- Will automatically execute the native `metta` binary if present on `$PATH`.

### B. External Omega Gateway Mode (`OMEGA_MODE=external`)
Connects to an external SingularityNET Omega daemon or microservice over HTTP.
- Set in environment:
  ```env
  OMEGA_MODE=external
  OMEGA_URL=http://localhost:9000/cognitive/run
  ```
- AgriGuide posts the cognitive goal and integrates the returned recommendation and derivation steps into the audit trail.

---

## 4. The MeTTa Skill Definition (`omega/skills/agriguide.metta`)

```lisp
(= (agriguide-decision $soil $rain $water $current-rain)
  (if $current-rain
      WAIT
      (if (and (< $soil 18) (>= $rain 70) (== $water limited))
          WAIT
          (if (and (< $soil 18) (< $rain 35) (not (== $water unavailable)))
              IRRIGATE
              REASSESS))))

(= (agriguide-rule IRRIGATE) R-LOW-MOISTURE-LOW-RAIN)
(= (agriguide-rule WAIT) R-HIGH-RAIN-WATER-CONSERVATION)
(= (agriguide-rule REASSESS) R-UNCERTAIN-OR-BALANCED)
```
