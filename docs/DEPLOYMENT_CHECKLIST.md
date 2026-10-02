# Production Deployment Verification Checklist

This operational checklist is used by site reliability engineers and evaluators to certify AgriGuide deployments.

## Pre-Flight Verification
1. Environment Configuration: Ensure `ENVIRONMENT=production`, `SECRET_KEY` is at least 32 characters, and `CORS_ORIGINS` includes the target frontend domain.
2. Database Readiness: SQLite auto-migration verified; default demonstration farm and fields seeded.
3. Neural Perception Gateway: SingularityNET / ASI Cloud OpenAI-compatible endpoint verified at `https://llm.c.singularitynet.io/v1`.

## Post-Deployment Sanity Tests
- Health Check: `GET /` returns HTTP 200 with `status: running`.
- Interactive Swagger: `GET /docs` renders interactive OpenAPI schema.
- Demo Authentication: `POST /api/auth/demo-login` issues valid JWT token with 30-day expiration.
- Field State Retrieval: `GET /api/fields/{id}/state` returns verified crop, soil moisture, and rain forecast.
- Deterministic Decision: `POST /api/fields/{id}/decide` outputs structured recommendation (`WAIT` or `IRRIGATE`).
- Cryptographic Proof: `GET /api/decisions/{id}/replay` confirms identical SHA-256 certificate hash.
