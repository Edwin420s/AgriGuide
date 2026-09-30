# AgriGuide — Explainable Agricultural Decision Agent

**Track**: Solo Track $\rightarrow$ Omega Track: *One Agent Producing an Auditable Decision*  
**Builder**: Nexora AI (Edwin)  
**Hackathon**: SingularityNET / BASIX Omniversity Hackathon (2026)  

AgriGuide is an adaptive agricultural decision-intelligence agent built around a persistent **neural-symbolic cognitive loop**. It solves a vital problem for smallholder farmers: **"How can an AI system make a critical farming recommendation that a farmer can actually understand, question, verify, and teach?"**

---

## 🌾 The Cognitive Loop

```
Evidence → Belief → World State → Omega Memory → MeTTa Reasoning → Decision → Audit → Outcome → Learning → State Revision
```

1. **Evidence**: Ingests sensor moisture telemetry, multi-provider weather forecasts (Open-Meteo), and qualitative farmer observations.
2. **Belief & Conflict Detection**: Identifies sensory discrepancies between sources (e.g. weather forecast divergence) and applies confidence penalties.
3. **World State**: Constructs a coherent real-time snapshot of the field, crop water demand, and reservoir constraints.
4. **Omega Memory**: Tracks past decisions, maintains cognitive run context, and links decision supersessions.
5. **MeTTa Reasoning Engine**: Evaluates declarative S-expressions from `metta/irrigation/rules.metta` and farmer custom rules.
6. **Auditable Decision**: Produces recommendations (`IRRIGATE`, `WAIT`, `REASSESS`) with a full step-by-step symbolic proof.
7. **What Changed? (Decision Diff)**: Visually compares superseded decisions side-by-side when new evidence triggers a revision.
8. **The Agent That Grows Up**: Allows farmers to teach the agent custom field rules that override or extend baseline policies.
9. **Closed-Loop Learning**: Compares ground truth outcomes (actual rainfall measured) to prior decisions, calibrating data source reliability over time.

---

## 🎓 BASIX MeTTa Omniversity Training Lineage

AgriGuide directly scales the foundational concepts and programming challenges taught during the **BASIX MeTTa Curriculum (`mettatraining`)**:

| Curriculum Module | Core Concepts & Challenges | Direct Application in AgriGuide |
| :--- | :--- | :--- |
| **Module 1: Foundations** | • Syntax, Types & S-Expressions<br>• Pattern Matching Logic (`match &self`)<br>• Challenges 1–3: Accumulators (`sumIf`) | • Typed ontology in `metta/knowledge/agriculture.metta`<br>• Pattern matching over dynamic field states<br>• `sum-active-water-demand` higher-order accumulation |
| **Module 2: Advanced Logic** | • Relational KBs (Challenge 4)<br>• Python Interop `py-atom` (Challenge 5)<br>• Range Guards & Transformers (Challenges 7–9) | • Digital twin knowledge graph (`world_model.py`)<br>• `hyperon.MeTTa()` runner integration (`metta_runner.py`)<br>• Agronomic safe root-zone moisture stress envelopes |
| **Module 3: Non-Determinism** | • Space manipulation (`add-atom`, `remove-atom`)<br>• Missing lead investigation (Challenge 15)<br>• Non-deterministic `superpose` (Challenge 16) | • Testing temporary hypothesis leads in Atomspace<br>• Counterfactual reasoning branches (`if_irrigate` vs `if_wait`)<br>• Recursive hydrological runoff path tracing |
| **Module 4: Integration & MORK** | • Self-rewriting rules & Unification (Lesson 21)<br>• Query Parsing (`metta-demo` / `movie-recommender`)<br>• End-to-end question answering pipeline | • "The Agent That Grows Up": Dynamic farmer custom rules<br>• Structured evidence extraction from natural language<br>• SingularityNET ASI Cloud OpenAI-compatible task routing |

---

## 🚀 Key Features

- **Symbolic MeTTa Runtime**: Parses and evaluates `.metta` code files faithfully via an embedded symbolic S-expression engine, with native CLI subprocess fallback. Implements Atomspace pattern matching (`match &self`), unification, and typed declarative predicates directly aligned with the BASIX MeTTa training curriculum.
- **MeTTa Counterfactual Trade-off Analysis**: Instead of just producing an isolated recommendation, the agent evaluates both candidate branches (`IRRIGATE` vs `WAIT`) in MeTTa, providing explicit comparative efficiency, risk ratings, and water-loss assessments.
- **The Agent That Grows Up**: Interactive custom rule builder where farmers register field-specific rules (e.g., *"In sandy loam during flowering, pause irrigation if rain $\ge$ 65%"*).
- **What Changed? (Decision Diff)**: Dedicated side-by-side inspection showing exactly why the agent changed its recommendation from `IRRIGATE` to `WAIT`.
- **What-If Scenario Sandbox**: Interactive simulation sliders for soil moisture, forecast rain, and water reserves—deducing MeTTa results instantly without database mutation.
- **Closed-Loop Learning & Calibration**: Tracks ground truth outcomes and adjusts Bayesian reliability scores across sensors, weather APIs, and farmer inputs.
- **Multi-Field Support**: Pre-seeded with **Field A (Maize Flowering, Loam)** and **Field B (French Beans Vegetative, Sandy Loam)**.

---

## 🛠 Tech Stack

- **Backend**: Python 3.12+ / FastAPI, SQLAlchemy, Pydantic, SQLite / PostgreSQL
- **Symbolic AI**: MeTTa / Hyperon knowledge files under `metta/`, embedded symbolic S-expression interpreter
- **Cognitive Orchestration**: Omega Agent adapter (`backend/app/services/omega.py`)
- **Frontend**: React 18, Vite, TypeScript, Lucide Icons, clean CSS
- **Testing**: Pytest with automated symbolic deduction, conflict, rule adaptation, and diff tests

---

## 💻 Quickstart (Run Locally)

### 1. Backend Setup & Seed
```bash
# From repository root:
python3 scripts/seed_demo.py

# Start FastAPI backend:
cd backend
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

### 2. Frontend Setup
```bash
# In another terminal:
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Test Suite & Curriculum Verification
```bash
# Run full unit and integration tests (28/28 tests passing):
pytest backend/tests/ -v

# Run the BASIX MeTTa Curriculum & 10-Point Scientific Benchmark Verification:
python3 scripts/verify_metta_curriculum.py
```

---

## 🧪 Demo Walkthrough (3-Minute Tour)

1. **Inspect Field A (Maize Flowering)**: Observe initial low soil moisture (16.5%) and how the agent initially recommended `IRRIGATE`.
2. **Simulate Rain / Weather Alert**: Click **"Simulate Storm Forecast (82%)"** or enter a qualitative farmer observation.
3. **Inspect "What Changed? (Diff)"**: Navigate to the **What Changed?** tab to view the side-by-side transition from `IRRIGATE` $\rightarrow$ `WAIT` as expected rain makes irrigation inefficient.
4. **The Agent That Grows Up**: Navigate to the **Rules** tab, create a custom farmer rule, and observe the agent adopting your local farming knowledge!
5. **Interactive Sandbox**: Go to **What-If Sandbox** to test arbitrary moisture and rain combinations against the MeTTa engine.
6. **Explainable Audit**: View the exact derivation proof steps under **Explainable Audit**.
7. **Close the Loop**: Log ground truth rainfall under **Closed-Loop Learning** to watch source reliability update.

---

## 📄 Submission Deliverables & Documentation

- **AI Disclosure Statement**: [AI_DISCLOSURE.md](AI_DISCLOSURE.md) *(Mandatory declaration of AI tooling & architectural integrity)*
- **Sample Reasoning Transcript & Memory Record**: [docs/sample_reasoning_transcript.md](docs/sample_reasoning_transcript.md) *(Full step-by-step derivation proof & Omega episodic memory trace)*
- **Architecture Deep Dive**: [docs/architecture.md](docs/architecture.md)
- **Demo Walkthrough Guide**: [docs/demo.md](docs/demo.md)
- **Omega Integration Spec**: [docs/omega-integration.md](docs/omega-integration.md)
- **API Reference**: [docs/api.md](docs/api.md)
- **Build Status**: [docs/build-status.md](docs/build-status.md)

---

## 🔮 What We Would Build Next

For the Solo Track assignment, we proved the single critical feature: **One Agent Producing an Auditable Decision with Stateful Memory and Counterfactual Trade-off Analysis**.

Here is what we would build next for the subsequent BASIX / SingularityNET phase:

1. **Hardware IoT Edge Deployment (ESP32 / AgriVerde)**:
   - Connect physical ESP32 soil capacitive sensors and micro-weather stations directly to AgriGuide via MQTT / LoRaWAN, transforming raw physical telemetry directly into active Atomspace facts.
2. **Multi-Source Bayesian Forecast Calibration**:
   - Rather than simple weight shifts, deploy continuous Kalman / Bayesian filtering to compare real hyper-local rain gauge readings against regional forecast grids, producing a locally calibrated precipitation probability.
3. **Multi-Decision Farming Spectrum**:
   - Extend the declarative MeTTa rule base beyond irrigation to fertilizer application timing (preventing nitrate leaching before storms), pest risk mitigation, and optimal harvesting windows.
4. **BGI / NuNet Decentralized Compute Integration**:
   - Deploy the Omega agent cognitive cycle onto the NuNet decentralized compute framework and publish auditable agricultural recommendations onto the SingularityNET Marketplace.

---

## ⚖️ AI Disclosure Statement (Summary)

> In strict adherence to the BASIX Omniversity Hackathon Solo Track rules:
>
> - **Google Antigravity Agentic Assistant** was utilized for code scaffolding, type definitions, test suite generation, and frontend component modularization.
> - **Human Author & Domain Engineering**: All domain knowledge models, agricultural decision heuristics (loam soil moisture thresholds, flowering stage water demand, reservoir constraints), MeTTa S-expression syntax design, and database schema architectures were authored, verified, and directed by Edwin (Nexora AI).
> - **Zero Black-Box LLM Hallucinations in Reasoning**: The core decision boundaries and counterfactual derivations are evaluated deterministically using MeTTa S-expression rewrite rules (`(= (agriguide-decision ...) ...)`) and the Omega agent runtime, rather than presenting ungrounded LLM completions as the decision engine.
>
> *For the full detailed disclosure, see [AI_DISCLOSURE.md](AI_DISCLOSURE.md).*

