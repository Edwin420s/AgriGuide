import pytest
from scripts.verify_replay_cert import verify_certificate
import json
import hashlib

def test_verify_certificate_integrity():
    payload = {"crop": "maize", "action": "WAIT", "moisture": 18.0}
    canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    correct_hash = hashlib.sha256(canonical.encode('utf-8')).hexdigest()
    
    assert verify_certificate(payload, correct_hash) is True
    assert verify_certificate(payload, "invalid_hash_string") is False
