# AgriGuide: Auditable Neural-Symbolic Farm Decision Intelligence

**Track**: Solo Track -> Omega Track: One Agent Producing an Auditable Decision  
**Builder**: Edwin Mwiti (Nexora AI)  
**Affiliation**: BASIX Omniversity Incubator / SingularityNET Hackathon  

---

## Live Deployments and Access

| Service | Platform | URL | Operational Status |
| :--- | :--- | :--- | :--- |
| Frontend Web Application | Vercel | https://agriguide-zeta.vercel.app | Active (Production) |
| Backend API & Interactive Swagger | Render | https://agriguide-backend-1rtz.onrender.com/docs | Active (Production) |
| Backend Health Check Endpoint | Render | https://agriguide-backend-1rtz.onrender.com/ | HTTP 200 OK |
| Source Code Repository | GitHub | https://github.com/Edwin420s/AgriGuide | Public (MIT License) |

### Demonstration Credentials

| Role | Username / Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| Administrator | eduedywn5@gmail.com | AdminPassword123! | Multi-farm fleet management, farmer accounts, sensor telemetry health, and audit inspection |
| Demo Farmer | demo.farmer@agriguide.io | DemoPassword123! | Kirinyaga demonstration shamba, live weather, MeTTa decision execution, and custom rule learning |

Visitors can also use the one-click quick login buttons ("Admin Quick Login" or "Demo Farmer Quick Login") on the login interface to authenticate immediately.

---

## Executive Overview

### The Real-World Challenge

Smallholder farmers across emerging agricultural economies face increasingly volatile weather patterns, localized micro-climates, and scarce irrigation water. While modern weather forecasts, satellite observations, and soil moisture sensors provide raw data, farmers consistently struggle with a critical operational bottleneck: translating fragmented, uncertain, and conflicting information into timely field actions.

Common real-world dilemma:
- A maize farmer notes that root-zone soil moisture has fallen to 17% (below the 20% stress threshold).
- A commercial weather service forecasts a 75% probability of rain within the next 24 hours.
- Reservoir water reserves are limited.
- An irreversible physical decision must be made: Should irrigation be turned on today?

If the farmer irrigates and heavy rain falls hours later, expensive pumped water is wasted, soil nutrients leach beyond the root zone, and waterlogging risks crop failure. Conversely, if the farmer withholds irrigation and the rain fails to materialize, the crop suffers irreversible moisture stress during the vulnerable flowering stage.

### Why Generative AI Chatbots Are Insufficient

When presented with this problem, standard large language models (LLMs) generate plausible-sounding text, but they suffer from fatal weaknesses in physical environments:
1. Non-Deterministic Reasoning: The same prompt can produce different recommendations across turns.
2. Inability to Guarantee Physical Safety Constraints: LLMs cannot enforce hard duration ceilings or valve shutoff boundaries independently of prompt context.
3. Lack of Verifiable Auditability: An LLM cannot produce a mathematical proof of its internal reasoning chain. If a crop dies, neither the farmer nor an agricultural insurance provider can determine why the system gave that advice.
4. Memory Amnesia: Stateless chatbots do not maintain an auditable lineage of why a decision changed when a new forecast arrived two hours later.

### The AgriGuide Solution

AgriGuide is an adaptive agricultural decision agent that separates neural perception from deterministic symbolic reasoning:
- SingularityNET / ASI Cloud neural models are restricted to perception, qualitative information extraction from farmer voice/text, and natural-language explanation.
- MeTTa (Meta Type Talk) symbolic rules execute the actual agronomic decision logic deterministically within an Atomspace knowledge graph.
- Omega Cognitive Architecture maintains the agent's persistent memory, field state, and decision lineage across time.
- SHA-256 Replay Certificates generate cryptographic verification proofs for every agricultural recommendation.

---

## The Cognitive Loop

AgriGuide operates continuously over an empirical cognitive loop rather than a one-shot query cycle:

```
Evidence -> Belief Reconciliation -> World State -> Omega Memory -> MeTTa Reasoning -> Auditable Decision -> Outcome Verification -> Closed-Loop Learning
```

### 1. Evidence Ingestion and Provenance
AgriGuide ingests data from four distinct sources, tracking timestamp, attribution, and confidence for every fact:
- Physical sensor telemetry (capacitive soil moisture, ambient temperature, relative humidity).
- Regional meteorological forecasts (Open-Meteo precipitation probability and millimeter quantity).
- Qualitative farmer observations (natural language text or voice notes parsed into structured predicates).
- Static agronomic context (soil taxonomy, crop variety, vegetative/flowering growth stages, and reservoir levels).

### 2. Conflict Detection and Belief Reconciliation
When sensory sources diverge (for example, satellite forecasts predict rain while local barometric and ground observations indicate dry skies), AgriGuide does not overwrite data. It registers an evidence conflict, applies a Bayesian confidence penalty, and flags the uncertainty to the operator.

### 3. The Farm World Model
AgriGuide maintains a dynamic digital twin representing the verified state of each plot. This digital twin combines FAO-56 Penman-Monteith reference evapotranspiration (ET0) with crop coefficients (Kc) to determine net crop water requirements.

### 4. Deterministic MeTTa Deduction
The field state is mapped into MeTTa S-expression atoms. Declarative rules evaluate threshold guards, root-zone safety envelopes, and resource constraints:
- Low soil moisture + low rain probability -> Recommendation: IRRIGATE.
- Low soil moisture + imminent high rain + limited reservoir -> Recommendation: WAIT.
- Active rainfall observed -> Recommendation: WAIT (with waterlogging avoidance guarantee).
- Depleted reservoir -> Recommendation: MONITOR / WATER_UNAVAILABLE (hard physical lockout).

### 5. "What Changed?" (Decision Supersession Lineage)
When weather forecasts update or new farmer observations arrive, AgriGuide does not overwrite history. It issues a new decision linked to the previous one via a parent pointer (`supersedes_id`) and displays a structured diff showing:
- Which evidence changed.
- Which symbolic rules triggered the revision.
- Why the recommendation shifted from IRRIGATE to WAIT.

### 6. "The Agent That Grows Up" (Farmer Rule Learning)
Smallholder farmers possess vital generational and hyper-local knowledge that centralized algorithms overlook (for example, *"In our sandy loam plot during flowering, delay irrigation if rain probability exceeds 65%"*). AgriGuide allows farmers to register local rules in natural language or structured forms, which the system dynamically compiles into active MeTTa rewrite rules.

### 7. Closed-Loop Learning
When actual rainfall occurs or dry weather persists, the ground-truth outcome is recorded. AgriGuide compares the forecast to measured reality and calibrates data source reliability weights over time.

---

## Business Value and Market Applications

AgriGuide provides concrete economic value across three major agricultural stakeholders:

### 1. Smallholder and Commercial Farmers
- Input Cost Reduction: Eliminates wasted pumping fuel, grid electricity, and reservoir water by holding off on irrigation when natural rain is imminent.
- Yield Protection: Prevents root-zone drought stress during critical flowering stages while mitigating root rot from excessive water application.
- Operational Transparency: Builds farmer trust because recommendations are accompanied by inspectable justifications rather than black-box pronouncements.

### 2. Micro-Insurance Providers and Parametric Risk Assessors
- Parametric Insurance Verification: In agricultural index insurance, disputes often arise regarding whether a crop failure was due to drought or improper farmer management. AgriGuide's tamper-proof SHA-256 Replay Certificates provide an unalterable, chronological log of recommendations and observed field telemetry.
- Reduced Moral Hazard: Verifiable records demonstrate that the operator adhered to approved water-management protocols throughout the season.

### 3. Agricultural Cooperatives and Extension Services
- Fleet-Wide Field Visibility: Aggregated dashboards enable agronomists and cooperative managers to monitor hundreds of plots across diverse micro-climates simultaneously.
- Knowledge Democratization: Extension officers can codify proven agronomic rules once and distribute them immediately across member farms.

---

## Alignment with the BASIX MeTTa Curriculum

AgriGuide directly scales the foundational concepts and programming challenges taught during the BASIX MeTTa Omniversity curriculum:

| Curriculum Module | Core Concepts and Challenges | Implementation in AgriGuide |
| :--- | :--- | :--- |
| Module 1: Foundations | Syntax, types, S-expressions, pattern matching logic (`match &self`), accumulators (`sumIf`) | Typed ontology in `metta/knowledge/agriculture.metta`, pattern matching over dynamic field states, `sum-active-water-demand` higher-order accumulation |
| Module 2: Advanced Logic | Relational knowledge bases, Python interop (`py-atom`), range guards, and transformers | Digital twin knowledge graph (`world_model.py`), `hyperon.MeTTa()` runner integration (`metta_runner.py`), agronomic safe root-zone moisture stress envelopes |
| Module 3: Non-Determinism | Space manipulation (`add-atom`, `remove-atom`), missing lead investigation, non-deterministic `superpose` | Evaluating temporary hypothesis leads in Atomspace, counterfactual reasoning branches (`if_irrigate` vs `if_wait`), recursive hydrological runoff path tracing |
| Module 4: Integration and MORK | Self-rewriting rules, unification, query parsing, and end-to-end question answering | "The Agent That Grows Up": Dynamic farmer custom rules, structured evidence extraction from natural language, SingularityNET ASI Cloud OpenAI-compatible task routing |

---

## System Architecture

```
+-----------------------------------------------------------------------------+
|                               USER INTERFACE                                |
|  React 18 + Vite SPA, Tailwind CSS, Responsive Web Dashboard (Vercel)       |
+-----------------------------------------------------------------------------+
                                       |
                                       | HTTPS / JSON API
                                       v
+-----------------------------------------------------------------------------+
|                            FASTAPI BACKEND RUNNER                           |
|  Universal Route Handler (/api and /), CORS Middleware, JWT Authentication  |
+-----------------------------------------------------------------------------+
         |                                             |
         v                                             v
+-----------------------------+               +-------------------------------+
|    NEURAL PERCEPTION        |               |   OMEGA COGNITIVE ENGINE      |
|  SingularityNET / ASI Cloud |               |  Episodic Memory, Run History |
|  Information Extraction     |               |  Decision Supersession Lineage|
|  Multilingual Explanation   |               |  State Versioning Subsystem   |
+-----------------------------+               +-------------------------------+
                                                               |
                                                               v
                                              +-------------------------------+
                                              |     METTA SYMBOLIC CORE       |
                                              |  Atomspace Knowledge Graph    |
                                              |  FAO-56 Physical Constraints  |
                                              |  Farmer Custom Rewrite Rules  |
                                              |  Deterministic Proof Engine   |
                                              +-------------------------------+
                                                               |
                                                               v
                                              +-------------------------------+
                                              |   SHA-256 REPLAY CERTIFICATE  |
                                              |  Cryptographic Verification   |
                                              +-------------------------------+
```

---

## Automated Verification and Benchmark Suite

The implementation is verified against an extensive automated test suite and formal scientific benchmarks:

```bash
# Automated Test Suite (66 of 66 tests passing)
pytest backend/tests/ -q
# Output: 66 passed in 26.68s (100% success rate)

# BASIX MeTTa Curriculum and 10-Point Scientific Benchmark
python3 scripts/verify_metta_curriculum.py
# Output: ALL 6 MODULES VERIFIED & 10/10 SCIENTIFIC BENCHMARKS PASSED
```

### Scientific Benchmark Suite (10 of 10 Passed)
1. Critically Dry Field with Low Rain Outlook: Verifies immediate irrigation deduction when soil moisture drops below threshold.
2. Sensor vs Satellite Telemetry Divergence: Verifies conflict detection, confidence penalties, and evidence flagging.
3. Unphysical Telemetry Leap (18% to 91% in 60s): Verifies automated sensor anomaly rejection.
4. Stuck Frozen Telemetry Line: Verifies stale sensor detection and fallback to satellite weather feeds.
5. Irrigate vs Wait Trade-Off Matrix: Verifies counterfactual exploration of both candidate actions.
6. Duration Safety Ceiling Clamping (60m clamped to 30m): Verifies deterministic guardrail enforcement.
7. Physical Valve Lockout when Water Unavailable: Verifies emergency shutdown when reservoir is exhausted.
8. Leaching Prevention Under Heavy Rain: Verifies fertilizer pause before imminent storms.
9. Seedbed Moisture Guard for Germination: Verifies planting window safety constraints.
10. Physiological Maturity Harvest Window: Verifies dry-down window selection for crop harvesting.

---

## Technical Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons (Deployed on Vercel)
- Backend: Python 3.11, FastAPI, SQLAlchemy, Pydantic, Uvicorn (Deployed on Render)
- Symbolic Engine: MeTTa / Hyperon S-Expression Engine, Atomspace Metagraph
- Cognitive Framework: Omega Agent Architecture
- Perception Layer: SingularityNET / ASI Cloud OpenAI-compatible LLM Gateway
- Database: SQLite (with automated table migrations and demo data seeding)
- Deployment Infrastructure: Multi-stage Docker container with dynamic port handling

---

## Local Development Setup

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- Git

### 1. Backend Setup
```bash
# Clone repository
git clone https://github.com/Edwin420s/AgriGuide.git
cd AgriGuide

# Install dependencies
pip install -r backend/requirements.txt

# Start backend server
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
Backend API will be accessible at http://localhost:8000 with interactive OpenAPI documentation at http://localhost:8000/docs.

### 2. Frontend Setup
```bash
# In a new terminal window:
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 in your browser.

### 3. Docker Compose Execution
```bash
docker compose up --build
```
Access the application at http://localhost:5173.

---

## AI Disclosure Statement

In strict adherence to the BASIX Omniversity Hackathon Solo Track rules:

1. AI Tooling Usage: Google Antigravity Agentic Assistant was utilized for initial code scaffolding, typing definitions, unit test suite generation, and frontend component modularization.
2. Human Authorship: Domain engineering, agricultural decision heuristics, soil moisture threshold envelopes, MeTTa S-expression schemas, cognitive state transitions, and system architecture were authored, verified, and directed by Edwin Mwiti (Nexora AI).
3. Grounded Decision Making: Language models are strictly confined to sensory perception and natural-language explanation. All agricultural decisions, safety guardrails, and counterfactual evaluations are executed deterministically by MeTTa and Omega.

---

## Roadmap and Next Steps

1. Edge Hardware Integration: Direct connection of ESP32 microcontrollers and LoRaWAN soil probes to stream telemetry directly into Atomspace atoms.
2. Bayesian Forecast Calibration: Applying local Kalman filtering to continuous rain-gauge telemetry to calibrate regional satellite forecast models.
3. Decentralized Compute: Packaging the Omega cognitive cycle for deployment across the SingularityNET and NuNet decentralized compute networks.
