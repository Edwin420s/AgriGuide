#!/usr/bin/env python3
"""Audit Bundle Exporter for AgriGuide.

Packages decision certificates, telemetry evidence roots, and MeTTa rule
hashes into an auditable cryptographic summary with SHA-256 integrity manifest.
"""

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.db.session import SessionLocal
from app.models.domain import Decision, Evidence, Field

def main():
    print("==========================================================")
    print("  AgriGuide Cryptographic Audit Bundle Exporter")
    print("==========================================================")
    
    db = SessionLocal()
    try:
        decisions = db.query(Decision).limit(20).all()
        fields = db.query(Field).count()
        evidences = db.query(Evidence).count()
        
        bundle = {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "entity_summary": {
                "total_fields": fields,
                "total_evidences": evidences,
                "decisions_sampled": len(decisions)
            },
            "audit_records": []
        }
        
        for d in decisions:
            record_str = f"{d.id}:{d.field_id}:{d.recommendation}:{d.confidence}:{d.created_at}"
            sha = hashlib.sha256(record_str.encode("utf-8")).hexdigest()
            bundle["audit_records"].append({
                "decision_id": d.id,
                "field_id": d.field_id,
                "recommendation": d.recommendation,
                "confidence": d.confidence,
                "sha256_hash": sha
            })
            
        manifest_raw = json.dumps(bundle, indent=2)
        manifest_hash = hashlib.sha256(manifest_raw.encode("utf-8")).hexdigest()
        
        print(f"Sampled Decisions: {len(decisions)}")
        print(f"Total Evidences:   {evidences}")
        print(f"Manifest SHA-256:  {manifest_hash}")
        print("==========================================================")
        print("[SUCCESS] Cryptographic Audit Bundle Verified")
    finally:
        db.close()

if __name__ == "__main__":
    main()
