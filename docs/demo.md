# AgriGuide — 3-Minute Hackathon Demo Script

This script walks through the complete end-to-end demonstration for the SingularityNET / BASIX Omniversity Hackathon (Solo Track: Omega — *One Agent Producing an Auditable Decision*).

---

## Live Deployment Access (Instant 1-Click Evaluation)

Judges can evaluate the demonstration immediately on the live cloud deployment with zero setup:
- **Live Frontend**: https://agriguide-zeta.vercel.app/
- **Live Backend & OpenAPI**: https://agriguide-backend-1rtz.onrender.com/docs
- **1-Click Evaluation**: Click **"Try a Shamba (1-Click Demo)"** on the landing page for instant authenticated access to pre-loaded Kenyan field states.

---

## Local Development Pre-Flight (Alternative)

```bash
# 1. Seed demo database with pre-loaded fields, decisions, and history:
python3 scripts/seed_demo.py

# 2. Start Backend:
python3 -m uvicorn app.main:app --app-dir backend --port 8000

# 3. Start Frontend (in a second terminal):
cd frontend && npm run dev

# 4. Open in browser:
http://localhost:5173
```

---

## Demo Script (180 Seconds)

### Minute 0:00 - 0:30 — The Pitch & The Problem
- **Narrative**:
  > *"Smallholder farmers make high-stakes irrigation decisions every day with fragmented, contradictory data: sensors say one thing, weather forecasts say another, and water in the reservoir is scarce. Ordinary LLMs hallucinate or provide generic answers with no memory. AgriGuide is an explainable agricultural decision agent that grounds every recommendation in symbolic MeTTa rules, tracks decisions statefully through Omega, and explains not just what it recommends, but why its decision changed when the world changed."*

---

### Minute 0:30 - 1:00 — Multi-Field Comparison & Initial Decision
- **Action**: Look at the top navigation bar. Click between **Field A (North Plot - Maize Flowering)** and **Field B (South Terrace - French Beans Vegetative)**.
- **Showcase**:
  - In **Field A**, soil moisture was dry (16.5%), rain forecast was initially low (18%), and water availability was limited.
  - Show how the agent initially deduced `IRRIGATE` under symbolic rule `R-LOW-MOISTURE-LOW-RAIN`.
  - In **Field B**, show critical soil moisture (11.2%) for shallow-rooted French beans requiring immediate irrigation.

---

### Minute 1:00 - 1:30 — The "What Changed?" Decision Diff
- **Action**: Click on **What Changed? (Diff)** in the sidebar.
- **Showcase**:
  - Show the side-by-side transition when weather service updated its forecast to 82% rain probability with approaching storm clouds.
  - The agent did not erase its past recommendation; it **superseded** it!
  - Point to the side-by-side comparison:
    - **Prior Decision**: `IRRIGATE` (Rule: `R-LOW-MOISTURE-LOW-RAIN`)
    - **Revised Decision**: `WAIT` (Rule: `R-HIGH-RAIN-WATER-CONSERVATION`)
    - **Evidence Delta**: Rain forecast jumped by +64% (from 18% to 82%).
    - **Auditable Rationale**: *"Field is dry, but 82% rain probability within 24h + limited reservoir water makes immediate irrigation wasteful."*

---

### Minute 1:30 - 2:00 — "The Agent That Grows Up" (Farmer Rule Adaptation)
- **Action**: Click on **The Agent That Grows Up (Rules)** tab.
- **Showcase**:
  - Highlight the pre-loaded farmer rule: *"Kirinyaga Sandy Loam flowering buffer"*.
  - Explain: *"Every farm is different. Soil drainage and local topography require local knowledge. AgriGuide lets farmers teach the agent custom rules."*
  - Toggle the rule or add a new custom rule: e.g. Action: `WAIT`, Condition: Rain threshold $\ge 60\%$.
  - Explain how the rule is compiled directly into MeTTa S-expressions and dynamically evaluated during reasoning!

---

### Minute 2:00 - 2:30 — What-If Interactive Simulation Sandbox
- **Action**: Click on **What-If Sandbox** in the sidebar.
- **Showcase**:
  - Drag the **Soil Moisture** slider (e.g. down to 12%).
  - Drag the **Rain Forecast** slider (e.g. up to 85%).
  - Toggle **Rain Falling Now** checkbox.
  - Click **"Run MeTTa Simulation"**.
  - Show instant symbolic deduction directly from the embedded MeTTa engine without altering database state.
  - Inspect the returned derivation trace and matched symbolic rule.

---

### Minute 2:30 - 3:00 — Explainable Audit & Closed-Loop Learning
- **Action**:
  1. Open **Explainable Audit**: Walk through the step-by-step symbolic derivation proof:
     - `OBSERVATION` $\rightarrow$ `BELIEF` $\rightarrow$ `METTA_EVALUATION` $\rightarrow$ `FINAL_RECOMMENDATION`.
  2. Open **Closed-Loop Learning**:
     - Point to the recorded ground truth outcome: Rain gauge measured **9.4mm actual rainfall**.
     - Point to the **Source Reliability Calibration Table**: Notice how the Open-Meteo API reliability score was calibrated to **0.88** based on Bayesian updating after matching actual rainfall.

---

### Concluding Remark
> *"AgriGuide does not erase its old decisions. It explains why its decision changed when the world changed, learns from ground truth outcomes, and grows with the farmer."*
