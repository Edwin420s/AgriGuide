# AI Disclosure & Architectural Integrity Statement

**Project**: AgriGuide — Explainable Agricultural Decision Agent  
**Builder / Team**: Nexora AI (Edwin)  
**Hackathon**: SingularityNET / BASIX Omniversity Hackathon (2026)  
**Track**: Solo Track $\rightarrow$ Omega Track: *One Agent Producing an Auditable Decision*  

---

## 1. Executive Summary

AgriGuide demonstrates an **explainable agricultural decision agent** for smallholder farming that combines **symbolic reasoning** (MeTTa rewrite rules), **persistent cognitive memory** (Omega agent state), and **real-world evidence calibration** into an auditable cognitive loop.

Rather than relying on an opaque, hallucination-prone Large Language Model (LLM) to directly recommend critical agricultural actions (e.g. irrigating vs. waiting when water is scarce), AgriGuide uses a **neural-symbolic architecture**:
- **Qualitative Input Parsing**: An interface component extracts structured entities from informal farmer speech or text (e.g. *"dark rain clouds over Mt Kenya ridge"* $\rightarrow$ `(evidence weather_condition ...)`).
- **Symbolic Policy Execution**: Core decision boundaries are evaluated deterministically using MeTTa S-expression rewrite rules (`(= (irrigation-decision ...) ...)`).
- **Persistent State & Memory**: The Omega adapter tracks historical recommendations, enables state supersession ("What Changed?"), and monitors real-world outcomes.
- **Closed-Loop Learning**: The agent adapts over time—both through farmer custom rules ("The Agent That Grows Up") and Bayesian source reliability calibration based on ground truth.

---

## 2. Tools & Assistance Disclosure

In accordance with the hackathon submission guidelines, we transparently disclose all AI assistance used during development:

### 2.1 AI Coding Assistance
- **Google Antigravity Agentic Assistant**: Assisted with code scaffolding, test generation, and frontend component modularization.
- **Human Author & Domain Engineering**: All domain knowledge models, agricultural decision heuristics (loam soil moisture thresholds, flowering stage water demand, reservoir constraints), MeTTa S-expression syntax design, and database schema architectures were authored, verified, and directed by Edwin (Nexora AI).

### 2.2 In-App AI Services
- **LLM Observation Parser (`backend/app/services/llm.py`)**: Uses a keyword and regex extractor with mock fallback that transforms unstructured natural language farmer observations into structured MeTTa predicates (`soil_moisture`, `weather_condition`, `crop_observation`).
- **MeTTa Symbolic Engine (`backend/app/services/metta_runner.py`)**: A native S-expression pattern matcher and reduction engine executing `.metta` code files (`metta/knowledge/agriculture.metta` and `metta/irrigation/rules.metta`) without external black-box LLMs.

---

## 3. Cognitive Loop Architecture

AgriGuide implements the complete 7-stage cognitive loop required by the Omega track:

```
[Evidence Collection]
   │ (Sensors, Open-Meteo, Farmer observations)
   ▼
[Belief Revision & Conflict Detection]
   │ (Detects forecast variance, computes confidence penalties)
   ▼
[World Model State Construction]
   │ (Soil moisture, 24h rain %, crop water demand, reservoir constraints)
   ▼
[Omega Cognitive Memory]
   │ (Tracks active goals, recall past decisions, checks supersession)
   ▼
[MeTTa Symbolic Deduction]
   │ (Evaluates baseline knowledge + custom farmer rules in S-expressions)
   ▼
[Auditable Decision Generation]
   │ (Emits recommendation with cryptographic trace and confidence score)
   ▼
[Closed-Loop Learning & Calibration]
     (Compares actual rainfall vs forecast; calibrates source reliability)
```

---

## 4. Key Hackathon Deliverables

1. **One Sharp Omega Feature**: An explainable decision agent that can explain *why* it made a recommendation and *what changed* when sensory evidence shifts.
2. **The Agent That Grows Up**: Farmers can add custom field rules (e.g. *"In sandy loam during flowering, pause irrigation if rain probability $\ge$ 65%"*), dynamically injected into the MeTTa space.
3. **Multi-Source Conflict Detection**: Detects discrepancies between weather providers or sensor telemetry, adjusts uncertainty bounds, and logs conflict steps into the audit trail.
4. **Transparent Audit Trail**: Every decision provides a full derivation trace (Observation $\rightarrow$ Belief $\rightarrow$ Rule Match $\rightarrow$ Decision).
5. **Verified Test Suite**: Unit and integration test suite (`backend/tests/`) verifying MeTTa reduction, rule adaptation, conflict penalties, and supersession diffs.

---

## 5. Verification & Authenticity

All code, tests, MeTTa files, and frontend assets in this repository are functional, runnable locally, and have been validated against Python 3.14 / pytest and Vite / React 18.
