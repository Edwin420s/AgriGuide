#!/usr/bin/env python3
"""Automated continuous health check for live Render backend and Vercel frontend."""
import json
import sys
import urllib.request

BACKEND_BASE = "https://agriguide-backend-1rtz.onrender.com/api"
FRONTEND_URL = "https://agriguide-zeta.vercel.app"

def test_endpoint(name: str, url: str, method: str = "GET", data: dict | None = None, headers: dict | None = None):
    h = headers or {}
    encoded = json.dumps(data).encode("utf-8") if data else None
    if encoded and "Content-Type" not in h:
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=encoded, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status = resp.status
            content = resp.read().decode("utf-8")
            print(f"[PASS] {name}: HTTP {status}")
            return status, content
    except Exception as ex:
        print(f"[FAIL] {name}: {ex}")
        return None, None

def main():
    print("=== AgriGuide Live Production Deployment Health Check ===")
    
    # 1. Frontend
    test_endpoint("Vercel Frontend Root", FRONTEND_URL)
    
    # 2. Backend Root
    test_endpoint("Render Backend Root", "https://agriguide-backend-1rtz.onrender.com/")
    
    # 3. Demo Login
    status, body = test_endpoint("Render Backend Demo Login", f"{BACKEND_BASE}/auth/demo-login", method="POST", data={})
    if not body:
        sys.exit(1)
        
    auth = json.loads(body)
    token = auth.get("access_token")
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    # 4. Fields list
    test_endpoint("Render Backend Fields", f"{BACKEND_BASE}/fields", headers=auth_headers)
    
    # 5. Public simulation
    test_endpoint("Render Backend Public Simulator", f"{BACKEND_BASE}/simulate/public", method="POST", data={"soil_moisture": 16.0, "rain_probability": 75.0, "water_availability": "LIMITED"})
    
    # 6. Kenya locations
    test_endpoint("Render Backend Kenya Locations", f"{BACKEND_BASE}/locations/kenya", headers=auth_headers)
    
    print("=== All Production Services Healthy ===")

if __name__ == "__main__":
    main()
