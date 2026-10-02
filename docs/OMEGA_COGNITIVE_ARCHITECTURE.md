# Omega Stateful Cognitive Architecture Specification

## Architectural Role
Omega coordinates the lifecycle of agricultural intelligence:
1. Episodic Run Tracking: Every recommendation execution generates a persistent Cognitive Run.
2. State Versioning: Field states advance monotonically upon receiving new sensory evidence.
3. Decision Lineage: Superseded recommendations maintain parent pointers to build an auditable lineage.
4. Memory Retention: Historical outcomes update Bayesian source reliability weights across seasons.

## Cognitive State Machine
```
[Uninitialized]
       |
       v (Register Field)
   [Active] <------------------------------------------+
       |                                               |
       v (Ingest Telemetry / Weather)                  |
[Belief Revision]                                      |
       |                                               |
       v (Trigger MeTTa Execution)                     |
[Symbolic Derivation]                                  |
       |                                               |
       v (Emit Decision & SHA-256 Certificate)         |
  [Decided]                                            |
       |                                               |
       v (Observe Ground Truth Outcome)                |
[Closed-Loop Learning] --------------------------------+
```

## Memory State Schema
Each cognitive run stores:
- field_id: UUID of targeted agricultural plot.
- state_version: Monotonically increasing revision counter.
- evidence_snapshot: Immutable dictionary of all active sensory atoms at decision time.
- derivation_proof: Ordered list of symbolic inference steps evaluated.
- certificate_hash: SHA-256 digest of input facts, rule identifiers, and recommendation.
