# Enterprise API and Webhook Integration Guide

This guide details how agricultural cooperatives, commercial aggregators, and micro-finance institutions integrate with AgriGuide to access automated agronomic recommendations and field telemetry.

---

## 1. Authentication

Enterprise integrations authenticate via Bearer JWT tokens in HTTP Authorization headers:

```http
Authorization: Bearer <API_ACCESS_TOKEN>
```

Tokens are obtained via the `/api/auth/token` endpoint using RSA-256 client credentials.

---

## 2. Real-Time Field Ingestion

### Endpoint: `POST /api/fields/{id}/evidence`
Allows ingestion of high-frequency sensor readings, satellite NDVI estimates, or agronomist field visit notes.

#### Request Payload Example:
```json
{
  "predicate": "soil_moisture",
  "source": "iot_lora_station_04",
  "value": {
    "value": 17.5,
    "unit": "percentage",
    "depth_cm": 20
  },
  "confidence": 0.95
}
```

#### Response:
```json
{
  "id": "evi_89dfa12b",
  "status": "INGESTED",
  "knowledge_graph_synced": true
}
```

---

## 3. Webhook Notifications

AgriGuide delivers outbound webhooks on key agricultural events:
- `decision.created`: Fired when a new decision recommendation is derived.
- `sensor.anomaly`: Fired when erratic readings or stuck sensors are detected.
- `policy.lockout`: Fired when an action proposal is rejected by environmental guardrails.

All webhook payloads include an `X-AgriGuide-Signature` HMAC-SHA256 signature for verification.
