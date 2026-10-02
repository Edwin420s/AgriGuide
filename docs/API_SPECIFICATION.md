# AgriGuide REST API Specification (OpenAPI 3.1)

## Base URLs
- Production: https://agriguide-backend-1rtz.onrender.com/api
- Local: http://localhost:8000/api

## Authentication
Bearer JWT Token transmitted via Authorization header:
`Authorization: Bearer <access_token>`

## Core Endpoints Summary

### Authentication
- POST /auth/register: Create a farmer account.
- POST /auth/login: Authenticate existing farmer or admin.
- POST /auth/demo-login: One-click demo farmer session generation.
- POST /auth/admin-login: One-click administrator session generation.
- GET /auth/me: Retrieve currently authenticated user context.

### Farms and Fields
- GET /farms: List all farms accessible by current user.
- POST /farms: Register a new farm.
- GET /fields: List all fields under the current farm.
- POST /fields: Register a new agricultural field twin.
- GET /fields/{id}: Get detailed field record with crop and soil taxonomy.
- PUT /fields/{id}: Update field characteristics (crop stage, soil type, irrigation type).
- DELETE /fields/{id}: Remove a field twin.

### Cognitive Reasoning and Decisions
- GET /fields/{id}/state: Retrieve current farm world model snapshot.
- GET /fields/{id}/evidence: Retrieve chronological evidence items with source provenance.
- GET /fields/{id}/decisions: List all decisions recorded for this field.
- POST /fields/{id}/decide: Trigger MeTTa symbolic reasoning cycle over latest field beliefs.
- POST /fields/{id}/observations: Ingest qualitative farmer observation into Atomspace.
- GET /decisions/{id}/audit: Retrieve full step-by-step symbolic proof derivation.
- GET /decisions/{id}/diff: Retrieve 'What Changed?' supersession diff against prior recommendation.
- GET /decisions/{id}/replay: Verify SHA-256 Replay Certificate for deterministic proof replay.

### Dynamic Learning
- GET /fields/{id}/rules: List active MeTTa rules (baseline + custom farmer rules).
- POST /fields/{id}/rules: Compile a new farmer custom rule into MeTTa syntax.
- PUT /fields/{id}/rules/{rule_id}/toggle: Enable or disable a custom rule.
- DELETE /fields/{id}/rules/{rule_id}: Permanently delete a custom rule.
- POST /decisions/{id}/outcomes: Record ground-truth rainfall or moisture outcomes.
- GET /sources/reliability: Retrieve Bayesian source reliability ratings.

### Environmental Intelligence
- POST /fields/{id}/weather/sync: Force refresh from Open-Meteo weather service.
- POST /fields/{id}/simulate: Run What-If sandbox evaluation without database mutation.
- POST /simulate/public: Public sandbox simulation for landing page.
- GET /fields/{id}/analytics: Retrieve FAO-56 Penman-Monteith ET0, ETc, and sensor anomaly diagnostics.
- GET /locations/kenya: Retrieve curated Kenyan agricultural coordinates database.
- GET /crops: Retrieve multi-lingual crop catalog with threshold envelopes.
