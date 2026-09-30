# BASIX MeTTa Omniversity Curriculum Implementation Guide

AgriGuide is designed as a direct demonstration of the **BASIX MeTTa Omniversity Incubator Curriculum**, incorporating all six foundational modules:

## Module Mapping

### Module 1: Types & Ontology (`(: ... Type)`)
- Definitions of `Crop`, `SoilTexture`, `PestThreat`, `WeatherHazard`, `EvidenceType`.
- Subtype hierarchy and type signatures enforcing strict type safety on agricultural variables.

### Module 2: Rules & Pattern Matching (`(= (rule $in) $out)`)
- Agronomic threshold guards (e.g. moisture < 20% && rain < 50%).
- Declarative pattern matching evaluating state atoms against field operational conditions.

### Module 3: Knowledge Graphs & Recursive Evaluation
- Recursive graph path traversal linking:
  $$\text{Farm} \longrightarrow \text{Field} \longrightarrow \text{Sensors} \longrightarrow \text{Evidence} \longrightarrow \text{Beliefs}$$
- Causal chain resolution for trace-back explainability.

### Module 4: Non-Deterministic Superposition (`superpose`)
- Counterfactual reasoning exploring multiple hypothetical realities:
  - Branch 1: `if_irrigate`
  - Branch 2: `if_wait`
  - Branch 3: `if_rain_fails`
- Exploration of possible future worlds without destructive side-effects.

### Module 5: Dynamic State Adaptation (`add-atom`, `remove-atom`)
- Dynamic AtomSpace modification reflecting fresh sensor evidence and farmer observations.
- Superseding previous beliefs when new contradictory evidence arrives.

### Module 6: Meta-Reasoning & Custom Rule Injections
- User-injected contextual rules (e.g. *Kirinyaga Flowering Rain Buffer*).
- Higher-order priority evaluation overriding generalized baselines with local agronomic knowledge.

## Verification
Run the automated curriculum verification test:
```bash
python3 scripts/verify_metta_curriculum.py
```
Outputs 10/10 verified benchmarks in sub-25 millisecond native execution.
