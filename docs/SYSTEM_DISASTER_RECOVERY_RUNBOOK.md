# System Disaster Recovery and High Availability Runbook

This operational guide provides step-by-step procedures for disaster recovery, point-in-time database restoration, edge offline synchronization failovers, and service resilience.

---

## 1. System Recovery Objectives (RTO / RPO)

- **Recovery Time Objective (RTO)**: < 15 minutes for cloud REST API and MeTTa cognitive engine.
- **Recovery Point Objective (RPO)**: < 5 minutes for evidence, farmer observations, and decision audit logs.

---

## 2. Cloud Service Failover Procedures

### 2.1 Backend API Recovery (Render)
If the primary backend instance on Render fails or experiences unrecoverable state:
1. Navigate to the Render Dashboard -> `agriguide-backend-1rtz`.
2. Inspect runtime logs for OOM or database connection pool exhaustion.
3. Trigger a manual zero-downtime redeploy from `origin/main`:
   ```bash
   git push origin main
   ```
4. Verify root health check via curl:
   ```bash
   curl -I https://agriguide-backend-1rtz.onrender.com/
   ```

### 2.2 Frontend CDN Recovery (Vercel)
If edge routing issues occur on Vercel:
1. Verify edge build artifacts locally:
   ```bash
   npm --prefix frontend run build
   ```
2. Trigger an immediate redeployment from Git via the Vercel CLI or Git webhook.
3. Confirm HTTP 200 on index asset:
   ```bash
   curl -I https://agriguide-zeta.vercel.app/
   ```

---

## 3. Database Disaster Recovery (SQLite / PostgreSQL)

1. **Snapshot Location**: Production database snapshots are stored under encrypted WAL backups.
2. **Restoration Command**:
   ```bash
   sqlite3 agriguide.db ".restore /backups/agriguide_snapshot_latest.db"
   ```
3. **Data Integrity Check**:
   ```bash
   python3 scripts/verify_replay_cert.py
   ```
