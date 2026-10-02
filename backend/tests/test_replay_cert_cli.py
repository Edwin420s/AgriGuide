import pytest
import sys
from pathlib import Path
import json
import hashlib

root_dir = Path(__file__).resolve().parents[2]
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from scripts.verify_replay_cert import verify_certificate

def test_verify_certificate_integrity():
    payload = {"crop": "maize", "action": "WAIT", "moisture": 18.0}
    canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    correct_hash = hashlib.sha256(canonical.encode('utf-8')).hexdigest()
    
    assert verify_certificate(payload, correct_hash) is True
    assert verify_certificate(payload, "invalid_hash_string") is False
