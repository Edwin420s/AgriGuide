# AgriGuide API Reference

The AgriGuide backend provides a RESTful API powering the 10-stage cognitive loop, symbolic MeTTa reasoning, multi-source evidence conflict detection, decision diffing, custom farmer rule adaptation, and closed-loop calibration.

Base URL: `http://localhost:8000/api`

---

## 1. System & Dashboard

### `GET /api/health`
Returns the operational status of the service and symbolic MeTTa engine.
- **Response**: `{"status": "ok", "service": "agriguide", "metta_engine": "active"}`

### `GET /api/dashboard`
Returns high-level platform summary counts.
- **Response**:
```json
{
  "farms": 1,
  "fields": 2,
  "evidence": 6,
  "decisions": 3,
  "outcomes": 1,
  "rules": 1,
  "calibrated_sources": 4
}
```

---

## 2. Farms & Fields

### `GET /api/farms`
List all registered demonstration farms.

### `GET /api/fields`
List all fields across farms with metadata, soil type, crop stage, and active rule count.

### `GET /api/fields/{field_id}`
Get detailed profile for a specific field.

### `GET /api/fields/{field_id}/state`
Reconstruct the dynamic **World State** for a field:
- Resolves latest soil moisture, forecast rain probability, water availability, crop water demand, and qualitative observations.
- Identifies any multi-source conflicts and applies confidence penalties.

---

## 3. Evidence & Qualitative Observations

### `GET /api/fields/{field_id}/evidence`
Retrieve chronological evidence items ingested for a field (sensors, weather forecasts, qualitative farmer notes).

### `POST /api/fields/{field_id}/evidence`
Ingest new sensory or weather telemetry.
- **Body**:
```json
{
  "source_type": "WEATHER_API",
  "source_id": "open-meteo-v2",
  "predicate": "rain_probability_24h",
  "value": {"value": 82.0},
  "confidence": 0.85
}
```

### `POST /api/fields/{field_id}/observations`
Record structured qualitative observations submitted by farmers (e.g. soil appearance, physical rain status).
- **Body**:
```json
{
  "author": "Edwin (Nexora AI)",
  "note": "Dark rain clouds gathering overhead, light drizzle starting.",
  "soil_appearance": "dry_crust",
  "rain_falling_now": true
}
```

---

## 4. Beliefs & Cognitive Decisions

### `GET /api/fields/{field_id}/beliefs`
Inspect active beliefs derived from evidence synthesis.

### `POST /api/fields/{field_id}/decide`
Execute the **Cognitive Loop** through the Omega adapter and symbolic MeTTa reasoning engine.
- Ingests world state & active evidence.
- Matches declarative S-expressions from `metta/irrigation/rules.metta` and field-specific custom rules.
- Detects if an existing decision is superseded.
- Generates an auditable decision record with step-by-step symbolic derivation proofs.
- **Body**:
```json
{
  "force_refresh": true,
  "notes": "Triggered after morning weather forecast update"
}
```
- **Response**:
```json
{
  "id": "dec_8f12a...",
  "recommendation": "WAIT",
  "confidence": 0.85,
  "reason": "Rain expected (82.0% probability) within 24h + limited water availability. Conserve reservoir water.",
  "rules": ["R-HIGH-RAIN-WATER-CONSERVATION"],
  "supersedes_id": "dec_1a04b...",
  "created_at": "2026-09-30T14:27:00Z"
}
```

### `GET /api/fields/{field_id}/decisions`
List decision history for a field.

---

## 5. Auditing & Decision Supersession Diff

### `GET /api/decisions/{decision_id}/audit`
Fetch complete auditable evidence, symbolic S-expression derivation steps, triggered rules, and linked ground truth outcomes.

### `GET /api/decisions/{decision_id}/diff`
Visual **"What Changed?"** diff viewer comparing a revised decision against its superseded predecessor:
- Compares prior vs revised recommendation.
- Compares evidence shifts (e.g. rain probability jump from 18% to 82%).
- Highlights symbolic rule changes and rationale shift.

---

## 6. The Agent That Grows Up (Dynamic Farmer Rules)

### `GET /api/fields/{field_id}/rules`
List all custom field rules authored by the farmer.

### `POST /api/fields/{field_id}/rules`
Register a new custom field rule that will be dynamically injected into the MeTTa space during reasoning.
- **Body**:
```json
{
  "name": "Kirinyaga Sandy Loam flowering buffer",
  "crop": "maize",
  "growth_stage": "flowering",
  "condition": {
    "rain_threshold_min": 65
  },
  "action": "WAIT",
  "explanation": "Sandy loam holds moisture poorly, but if rain is over 65%, hold irrigation to avoid root leaching."
}
```

### `PUT /api/fields/{field_id}/rules/{rule_id}/toggle`
Toggle a rule active or inactive to test agent behavior with/without farmer domain guidance.

### `DELETE /api/fields/{field_id}/rules/{rule_id}`
Permanently remove a custom rule.

---

## 7. Interactive What-If Simulation

### `POST /api/fields/{field_id}/simulate`
Run hypothetical parameter permutations through the symbolic MeTTa runtime without mutating persistent database state.
- **Body**:
```json
{
  "soil_moisture": 14.5,
  "rain_probability_24h": 78.0,
  "water_availability": "LIMITED",
  "current_rainfall": false,
  "crop_water_demand": "HIGH",
  "custom_rule_action": "WAIT",
  "custom_rule_rain_min": 60
}
```
- **Response**:
```json
{
  "simulated_state": { ... },
  "recommendation": "WAIT",
  "confidence": 0.88,
  "reason": "Rain expected (78.0%) within 24h + limited water availability. Conserve reservoir water.",
  "rules": ["R-HIGH-RAIN-WATER-CONSERVATION"],
  "steps": [ ... ],
  "source": "metta-embedded"
}
```

---

## 8. Outcomes & Closed-Loop Learning

### `POST /api/decisions/{decision_id}/outcomes`
Record physical ground truth measurements (e.g., actual rainfall gauge reading) to close the learning loop.
- **Body**:
```json
{
  "type": "ACTUAL_RAINFALL",
  "observed_value": 9.4,
  "unit": "mm",
  "notes": "Rain gauge measured 9.4mm rainfall during storm"
}
```

### `GET /api/fields/{field_id}/learning`
Inspect learning events triggered by ground truth outcomes.

### `GET /api/sources/reliability`
Retrieve calibrated Bayesian reliability scores across telemetry sources (Sensors, Weather Forecast APIs, Farmer Observations).
- **Response**:
```json
[
  {
    "id": "rel_open_meteo",
    "source_id": "open-meteo",
    "source_type": "WEATHER_API",
    "score": 0.88,
    "samples": 14,
    "updated_at": "2026-09-30T14:27:00Z"
  }
]
```

### `GET /api/fields/{field_id}/timeline`
Retrieve a unified chronological timeline interweaving evidence, decisions, outcomes, and state revisions.
