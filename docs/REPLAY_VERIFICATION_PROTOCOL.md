# Cryptographic Replay Certificate Verification Protocol

## Purpose
In precision agriculture and parametric crop insurance, recommendations must be verifiable after the fact. AgriGuide guarantees complete determinism via cryptographic SHA-256 Replay Certificates.

## Certificate Hashing Specification

The replay certificate hash is computed over a canonical UTF-8 JSON representation:

```json
{
  "field_id": "UUID",
  "crop": "maize",
  "soil_moisture": 18.0,
  "rain_probability": 75.0,
  "water_availability": "LIMITED",
  "rules_evaluated": ["R-HIGH-RAIN-WATER-CONSERVATION"],
  "recommendation": "WAIT",
  "timestamp": "ISO-8601"
}
```

```python
certificate_hash = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
```

## Deterministic Verification Flow
1. Fetch historical decision and stored SHA-256 certificate from backend endpoint `/api/decisions/{id}/replay`.
2. Re-instantiate a pristine MeTTa Atomspace with the recorded evidence snapshot.
3. Re-evaluate declarative rules.
4. Verify that newly computed recommendation and hash match historical certificate:
   `assert current_replay_hash == stored_certificate_hash`
