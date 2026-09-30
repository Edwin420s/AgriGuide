# Contributing to AgriGuide

Thank you for your interest in contributing to **AgriGuide: Adaptive Neural-Symbolic Agricultural Decision Agent**!

## Development Guidelines

### 1. Code Quality & Standards
- Python backend code adheres to PEP 8, formatted with Black/Ruff, and typed where appropriate.
- Frontend code is written in strict TypeScript with React functional components and Tailwind CSS.
- Keep frontend production bundles lightweight (<100 kB gzipped).

### 2. MeTTa Rule Authoring Standards
- All symbolic knowledge bases are stored in `metta/knowledge/*.metta`.
- Every rule must specify:
  1. Strict type signatures `(: rule_name (-> InputType OutputType))`
  2. Pattern reduction equations `(= (rule_name $var) ...)`
  3. Grounding against empirical agronomic literature (e.g. FAO-56, KALRO, CGIAR).

### 3. Verification Protocol
Before submitting a pull request, run the unified verification script:
```bash
./scripts/run_all_verifications.sh
```
Ensure all 54 unit tests and curriculum benchmarks pass with 100% success.
