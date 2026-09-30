# AgriGuide Architecture Specification

AgriGuide is a neural-symbolic cognitive agent built for the SingularityNET / BASIX Omniversity Hackathon (Solo Track: Omega — *One Agent Producing an Auditable Decision*).

Instead of treating AI as an opaque statistical black box, AgriGuide implements a **10-stage verifiable cognitive loop** that grounds real-world agricultural sensory inputs in symbolic knowledge and auditable reasoning rules.

---

## 1. The 10-Stage Cognitive Loop

```text
  ┌────────────────────────────────────────────────────────┐
  │                 1. EVIDENCE INGESTION                  │
  │    (IoT Sensors, Open-Meteo API, Farmer Observations)  │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │           2. BELIEF REVISION & CONFLICT CHECK          │
  │  (Detects variance, applies penalties, updates priors) │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │                 3. WORLD STATE MODEL                   │
  │    (Coherent snapshot: Soil %, Rain %, Crop Demand)    │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │            4. OMEGA AGENT COGNITIVE RUN                │
  │     (Stateful memory context, supersession tracking)   │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │              5. SYMBOLIC MeTTa REASONER                │
  │      (Declarative S-Expressions + Custom Farmer Rules) │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │            6. AUDITABLE DECISION GENERATION            │
  │        (IRRIGATE / WAIT / REASSESS + Derivation Proof) │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │         7. "WHAT CHANGED?" DECISION DIFF ENGINE        │
  │    (Side-by-side transition view: prior vs superseded) │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │             8. OUTCOME & GROUND TRUTH CAPTURE          │
  │        (Actual rainfall gauge readings, soil tests)    │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │           9. SOURCE RELIABILITY CALIBRATION            │
  │   (Bayesian score updates across sensors & forecasts)  │
  └───────────────────────────┬────────────────────────────┘
                              │
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │              10. STATE REVISION & FEEDBACK             │
  │     (Closes the cognitive loop for ongoing evolution)  │
  └────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### A. Symbolic MeTTa Runtime (`backend/app/services/metta_runner.py`)
- **Native CLI & Embedded Fallback**: Supports execution via the native `metta` binary if installed on the host, while embedding an S-expression evaluator with pattern matching, logical reduction (`and`, `or`, `not`, `if`), and arithmetic comparison operators (`<`, `<=`, `>`, `>=`, `==`).
- **Declarative Agricultural Knowledge**: Evaluates rules defined in `metta/irrigation/rules.metta` and concepts in `metta/knowledge/agriculture.metta`.
- **Trace Engine**: Produces step-by-step derivation records capturing which facts unified with which rules to produce the recommendation.

### B. "The Agent That Grows Up" — Dynamic Rule Injection
- Smallholder farmers possess crucial local domain knowledge (e.g. soil drainage characteristics, historical microclimates).
- AgriGuide enables farmers to register custom rules in natural language or structured thresholds.
- Custom rules are compiled into S-expressions and dynamically injected into the active MeTTa space during reasoning.
- When a custom rule fires, the audit trail flags the specific farmer rule that guided the agent.

### C. Multi-Source Conflict Detection & Source Calibration (`world_model.py` & `cognitive.py`)
- Real farm deployments frequently receive conflicting telemetry (e.g. diverging forecasts between weather providers, or sensor drift).
- The `WorldModelService` scans active evidence items for significant variance ($\ge 25\%$ in rain forecast, $\ge 10\%$ in soil moisture).
- Upon detecting a conflict, the system flags `has_conflicts = true`, applies a confidence penalty, and logs a `CONFLICT_DETECTION` reasoning step.
- When physical ground truth outcomes are recorded (e.g., actual rainfall of 9.4mm), the `CognitiveService` adjusts the `SourceReliability` score using Bayesian updating.

### D. Visual Decision Diff Viewer ("What Changed?")
- Unlike black-box LLMs that regenerate answers with no memory of prior state, AgriGuide links superseded decisions (`supersedes_id`).
- When a new observation (such as an incoming storm) triggers a revision from `IRRIGATE` to `WAIT`, AgriGuide does not overwrite history.
- The `get_decision_diff` engine computes:
  - **Decision Shift**: Prior recommendation vs new recommendation.
  - **Evidence Delta**: Exactly which inputs changed (e.g., rain forecast jumped from 18% to 82%).
  - **Rule Shift**: Which symbolic rule was replaced by which new rule.

### E. MeTTa Counterfactual Trade-off Analysis ("What If: Irrigate vs. Wait")
- Beyond delivering a singular recommendation, real agricultural stewardship requires understanding the *trade-offs* of alternative actions.
- AgriGuide invokes `counterfactual-analysis` rules in MeTTa for both branches (`IRRIGATE` and `WAIT`) given the current world state.
- Each branch returns:
  - **Efficiency Rating**: High, Moderate, or Poor utilization of resources.
  - **Risk Assessment**: Potential hazards (e.g. `HIGH_WATER_RUNOFF_OR_WATERLOGGING` vs `CROP_WILTING_AND_STRESS`).
  - **Water Loss Risk**: Quantified risk of squandering limited reservoir reserves.
  - **Natural-Language Rationale**: Derived directly from the declarative knowledge base.
- Both the Operations Dashboard and the Explainable Audit Trail display these comparative counterfactuals side-by-side.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Symbolic AI** | MeTTa / Hyperon S-Expressions | Verifiable rule evaluation & auditable derivation proofs |
| **Cognitive Agent** | Omega Agent Adapter (`omega.py`) | Stateful memory, cognitive runs, supersession management |
| **Backend API** | FastAPI / Python 3.12+ | High-performance async RESTful API |
| **Data Persistence** | SQLite (Default) / PostgreSQL | Relational storage for fields, evidence, runs, decisions, rules |
| **Frontend UI** | React 18, Vite, TypeScript, Lucide | Modern reactive dashboard, diff inspector, sandbox, rule editor |
| **Verification** | Pytest, Vite Build | Automated test coverage for symbolic reasoning, conflict logic, diffs |
