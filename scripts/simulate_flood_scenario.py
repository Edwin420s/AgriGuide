#!/usr/bin/env python3
"""Flood and Storm Runoff Scenario Simulator for AgriGuide.

Simulates a high-intensity 100mm convective rainfall event to test
environmental leaching lockout, waterlogging alerts, and drainage recommendations.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.safety_policies import SafetyPolicyEngine
from app.services.domain_reasoners import MultiDomainAgriculturalEngine

def main():
    print("==========================================================")
    print("  AgriGuide Flood & Storm Runoff Scenario Simulator")
    print("==========================================================")
    
    safety = SafetyPolicyEngine()
    domains = MultiDomainAgriculturalEngine()
    
    # Severe storm state
    state = {
        "soil_moisture": 38.0,  # Saturated vertisol
        "rain_probability_24h": 95.0,
        "current_rainfall": True,
        "wind_speed_kmh": 40.0,
        "crop_stage": "vegetative"
    }
    
    # 1. Test irrigation lockout
    irrigation_check = safety.verify_action("IRRIGATE", {"duration_minutes": 20}, state)
    print(f"Irrigation Action Proposal: Status={irrigation_check.status} (Allowed={irrigation_check.allowed})")
    for v in irrigation_check.violations:
        print(f"  -> Violation: {v}")
        
    # 2. Test fertilizer runoff lockout
    fert_check = safety.verify_action("APPLY_FERTILIZER", {"amount_kg": 50}, state)
    print(f"Fertilizer Action Proposal: Status={fert_check.status} (Allowed={fert_check.allowed})")
    for v in fert_check.violations:
        print(f"  -> Violation: {v}")
        
    # 3. Domain fertilization evaluation
    fert_domain = domains.evaluate_fertilization(state)
    print(f"Domain Fertilization Recommendation: {fert_domain.recommendation} ({fert_domain.confidence*100:.0f}%)")
    print(f"  -> Rule: {fert_domain.rules}")
    print(f"  -> Reason: {fert_domain.reason}")
    
    print("==========================================================")
    if not irrigation_check.allowed and not fert_check.allowed:
        print("[SUCCESS] All Storm Runoff Safety Lockouts Enforced")
        sys.exit(0)
    else:
        print("[FAIL] Safety Violation Detected")
        sys.exit(1)

if __name__ == "__main__":
    main()
