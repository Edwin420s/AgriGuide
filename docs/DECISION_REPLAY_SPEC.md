# Reproducible Decision Replay & Cryptographic Auditability

## Problem Statement
Standard LLM-based agricultural agents suffer from non-reproducibility: given identical input conditions, an LLM might recommend irrigation on Monday and withholding water on Tuesday. In regulated or commercially sensitive agriculture, this creates unacceptable liability.

## The AgriGuide Solution: Deterministic Proof Replay
AgriGuide persists all evidence, rules, world-state snapshots, and reasoning steps into an append-only ledger. When a decision is queried for replay:

1. **Snapshot Reconstruction**: The exact world state valid at timestamp $T_0$ is reconstructed from historical evidence.
2. **Deterministic Re-derivation**: The symbolic MeTTa engine re-executes the exact rules active at $T_0$.
3. **Equivalence Verification**: The newly derived recommendation, confidence score, and rules are matched against the historical record.
4. **Certificate Generation**: A cryptographic `ReplayCertificate` is issued with status:
   - `VERIFIED_DETERMINISTIC` if derivation is an exact match.
   - `DIVERGENCE_DETECTED` if any rule change or drift occurred.

## Replay Certificate Schema

```json
{
  "decision_id": "c29a5163-91e8-4dca-b56c-1c054fd93183",
  "status": "VERIFIED_DETERMINISTIC",
  "is_exact_match": true,
  "original_recommendation": "WAIT",
  "replayed_recommendation": "WAIT",
  "original_confidence": 0.89,
  "replayed_confidence": 0.89,
  "original_rules": ["Kirinyaga Flowering Rain Buffer"],
  "replayed_rules": ["Kirinyaga Flowering Rain Buffer"],
  "timestamp": "2026-10-01T02:15:44.120Z"
}
```
