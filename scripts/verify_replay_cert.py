#!/usr/bin/env python3
"""CLI utility to verify cryptographic SHA-256 Replay Certificates."""
import hashlib
import json
import sys

def verify_certificate(payload: dict, expected_hash: str) -> bool:
    canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    digest = hashlib.sha256(canonical.encode('utf-8')).hexdigest()
    return digest.lower() == expected_hash.lower()

if __name__ == "__main__":
    sample_payload = {
        "crop": "maize",
        "soil_moisture": 16.5,
        "rain_probability": 82.0,
        "water_availability": "LIMITED",
        "action": "WAIT"
    }
    canonical = json.dumps(sample_payload, sort_keys=True, separators=(',', ':'))
    sample_hash = hashlib.sha256(canonical.encode('utf-8')).hexdigest()
    assert verify_certificate(sample_payload, sample_hash)
    print(f"SHA-256 Replay Certificate verified successfully: {sample_hash}")
