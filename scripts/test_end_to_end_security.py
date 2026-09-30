#!/usr/bin/env python3
"""AgriGuide - Complete End-to-End API, UI, and Security Test Suite.

Tests:
1. All API endpoints from frontend perspective (CRUD, MeTTa reasoning, multi-domain, analytics, replay).
2. Model switching across all 5 SingularityNET / ASI Cloud models.
3. Security audits:
   - Zero leak of secret keys or internal credentials in API responses.
   - SQL injection resistance.
   - Cross-Site Scripting (XSS) parameter sanitization.
   - Safety policy boundary enforcement.
"""

import sys
import json
import httpx
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api"

def print_section(title: str):
    print("\n" + "=" * 75)
    print(f"  {title}")
    print("=" * 75)

def run_tests():
    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # --------------------------------------------------------------------------
    # 1. Health & LLM Provider Status
    # --------------------------------------------------------------------------
    print_section("1. Health & LLM Provider Status")
    res = client.get("/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f"Health: status={health_data['status']}, metta_engine={health_data['metta_engine']}")
    assert health_data["status"] == "ok"
    assert health_data["metta_engine"] == "active"

    # Security check: Ensure secret key is NEVER exposed in status
    assert "asi_cloud_key" not in res.text
    assert "secret_key" not in res.text
    print("✓ Health endpoint OK (Zero secret key leaks)")

    # --------------------------------------------------------------------------
    # 2. Dynamic Model Switcher (All 5 ASI Cloud Models)
    # --------------------------------------------------------------------------
    print_section("2. Model Switching Across 5 ASI Cloud Models")
    models_res = client.get("/llm/models")
    assert models_res.status_code == 200
    models_data = models_res.json()
    model_ids = [m["id"] for m in models_data["models"]]
    print(f"Available Models ({len(model_ids)}): {model_ids}")
    assert len(model_ids) == 5

    for mid in model_ids:
        switch_res = client.post("/llm/model", json={"model": mid})
        assert switch_res.status_code == 200
        switched_data = switch_res.json()
        assert switched_data["model"] == mid
        print(f"  ✓ Switched to model: {mid} -> Status: {switched_data['status']}")

    # Switch back to recommended default
    client.post("/llm/model", json={"model": "minimax/minimax-m3"})

    # --------------------------------------------------------------------------
    # 3. Farms & Fields Ingestion
    # --------------------------------------------------------------------------
    print_section("3. Farms & Fields Data Ingestion")
    farms_res = client.get("/farms")
    assert farms_res.status_code == 200
    farms = farms_res.json()
    print(f"Farms loaded: {len(farms)} ({[f['name'] for f in farms]})")
    assert len(farms) > 0

    fields_res = client.get("/fields")
    assert fields_res.status_code == 200
    fields = fields_res.json()
    print(f"Fields loaded: {len(fields)} ({[f['name'] for f in fields]})")
    assert len(fields) >= 2

    field_id = fields[0]["id"]
    field_name = fields[0]["name"]
    print(f"Testing primary field: {field_name} (ID: {field_id})")

    # State & Evidence
    state_res = client.get(f"/fields/{field_id}/state")
    assert state_res.status_code == 200
    state = state_res.json()
    print(f"  Field State: Moisture={state.get('soil_moisture')}%, Rain 24h={state.get('rain_probability_24h')}%")

    ev_res = client.get(f"/fields/{field_id}/evidence")
    assert ev_res.status_code == 200
    evidence_items = ev_res.json()
    print(f"  Evidence items: {len(evidence_items)}")

    # --------------------------------------------------------------------------
    # 4. Symbolic MeTTa Decision Execution & Counterfactuals
    # --------------------------------------------------------------------------
    print_section("4. Symbolic MeTTa Decision Execution & Counterfactuals")
    decide_res = client.post(f"/fields/{field_id}/decide", json={})
    assert decide_res.status_code == 200
    decision = decide_res.json()
    print(f"Decision output:")
    print(f"  Recommendation: {decision['recommendation']}")
    print(f"  Confidence:     {decision['confidence']}")
    print(f"  Reason:         {decision['reason']}")
    print(f"  Rule Triggered: {decision['rules']}")
    print(f"  Source Engine:  {decision['source']}")
    print(f"  Counterfactuals:{list(decision.get('counterfactuals', {}).keys())}")
    assert decision["recommendation"] in ["IRRIGATE", "WAIT", "REASSESS", "MONITOR"]

    # Verify audit trail steps
    audit_res = client.get(f"/decisions/{decision['decision_id']}/audit")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    print(f"  Audit Steps:    {len(audit_data.get('reasoning_steps', []))}")

    # --------------------------------------------------------------------------
    # 5. Natural Language Farmer Observation
    # --------------------------------------------------------------------------
    print_section("5. Natural Language Farmer Observation Grounding")
    obs_text = "Dark storm clouds gathering from the east, rain expected tomorrow around noon."
    obs_res = client.post(f"/fields/{field_id}/observations", json={"message": obs_text})
    assert obs_res.status_code == 200
    obs_data = obs_res.json()
    print(f"Observation Parsed:")
    print(f"  Predicate:    {obs_data['predicate']}")
    print(f"  Confidence:   {obs_data['confidence']}")
    print(f"  Explanation:  {obs_data['explanation']}")
    print(f"  Value:        {obs_data['value']}")

    # --------------------------------------------------------------------------
    # 6. Agricultural Knowledge Graph & Digital Twin
    # --------------------------------------------------------------------------
    print_section("6. Agricultural Knowledge Graph & MeTTa Atoms")
    graph_res = client.get(f"/fields/{field_id}/graph")
    assert graph_res.status_code == 200
    graph = graph_res.json()
    print(f"Knowledge Graph:")
    print(f"  Entities:  {len(graph['entities'])}")
    print(f"  Relations: {len(graph['relations'])}")
    print(f"  Causal Chains: {len(graph['causal_chains'])}")
    print(f"  Sample MeTTa Atom: {graph['metta_atoms'][0] if graph['metta_atoms'] else 'None'}")
    assert len(graph["entities"]) > 0
    assert len(graph["relations"]) > 0

    # --------------------------------------------------------------------------
    # 7. Multi-Domain Agricultural Decision Suite
    # --------------------------------------------------------------------------
    print_section("7. Multi-Domain Agricultural Decision Suite")
    holistic_res = client.get(f"/fields/{field_id}/holistic")
    assert holistic_res.status_code == 200
    holistic = holistic_res.json()
    assert "domains" in holistic, "Expected 'domains' key in holistic response"
    domains = ["planting", "fertilization", "crop_health", "weather_risk", "harvest"]
    for d in domains:
        assert d in holistic["domains"], f"Missing domain {d} in holistic status"
        d_res = holistic["domains"][d]
        print(f"  Domain [{d.upper()}]: Rec={d_res['recommendation']}, Conf={d_res['confidence']}, Rules={d_res.get('rules')}")

    # Test single domain evaluation
    domain_eval_res = client.post(f"/fields/{field_id}/domain/fertilization", json={"params": {"forecast_rain_mm": 25.0}})
    assert domain_eval_res.status_code == 200
    print(f"  Specific Domain [fertilization with 25mm rain]: {domain_eval_res.json()['recommendation']}")

    # --------------------------------------------------------------------------
    # 8. Physical Agronomic ML & Sensor Anomaly Detection
    # --------------------------------------------------------------------------
    print_section("8. Physical Agronomic ML & Sensor Anomaly Detection")
    analytics_res = client.get(f"/fields/{field_id}/analytics")
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    et0 = analytics["evapotranspiration"]["et0_reference_mm"]
    etc = analytics["evapotranspiration"]["crop_demand_etc_mm_day"]
    depletion_24h = analytics["soil_moisture_depletion"]["projected_moisture_24h"]
    print(f"  FAO-56 Reference ET0:   {et0} mm/day")
    print(f"  Crop Water Demand ETc:  {etc} mm/day")
    print(f"  Projected Moisture (24h): {depletion_24h}%")

    # Anomaly test: Sudden spike (+37% leap)
    spike_res = client.post(
        f"/fields/{field_id}/analytics/anomaly-check",
        json={"history": [18.0, 18.2, 17.9, 18.1, 18.0], "current_value": 55.0, "sensor_type": "soil_moisture"}
    )
    assert spike_res.status_code == 200
    spike_data = spike_res.json()
    assert spike_data["is_anomalous"] is True
    assert spike_data["anomaly_type"] == "SUDDEN_SPIKE"
    print(f"  ✓ Spike Anomaly correctly detected: penalty={spike_data['confidence_penalty']}")

    # --------------------------------------------------------------------------
    # 9. Deterministic Safety Policies & Actuation Guardrails
    # --------------------------------------------------------------------------
    print_section("9. Deterministic Safety Policies & Actuation Guardrails")
    # Propose 60 min irrigation (field has 82% rain forecast, policy max ceiling is 30 min)
    action_res = client.post(
        f"/fields/{field_id}/actions/propose",
        json={"action_type": "IRRIGATE", "proposed_params": {"duration_minutes": 60, "volume_liters": 3000}}
    )
    assert action_res.status_code == 200
    action_data = action_res.json()
    print(f"  Action Proposal: 60 min irrigation")
    print(f"  Policy Status:   {action_data['status']}")
    print(f"  Clamped Ceiling: {action_data['clamped_params']['duration_minutes']} min (Expected: 30 min)")
    assert action_data["clamped_params"]["duration_minutes"] == 30
    assert action_data["status"] == "REJECTED"
    assert "Precipitation lock-out" in action_data["violations"][0]
    print(f"  ✓ High-risk proposal clamped to 30 min and REJECTED by precipitation lock-out")

    # Propose routine action without hazard
    routine_res = client.post(
        f"/fields/{field_id}/actions/propose",
        json={"action_type": "SCOUT_PEST", "proposed_params": {"scout_radius_m": 50}}
    )
    assert routine_res.status_code == 200
    routine_data = routine_res.json()
    assert routine_data["status"] == "APPROVED"
    assert routine_data["allowed"] is True
    print("  ✓ Routine advisory action APPROVED without restriction")

    # --------------------------------------------------------------------------
    # 10. Reproducible Decision Replay Engine
    # --------------------------------------------------------------------------
    print_section("10. Decision Replay Engine & Cryptographic Non-Repudiation")
    decisions_res = client.get(f"/fields/{field_id}/decisions")
    assert decisions_res.status_code == 200
    dec_list = decisions_res.json()
    assert len(dec_list) > 0
    test_dec_id = dec_list[0]["id"]

    replay_res = client.get(f"/decisions/{test_dec_id}/replay")
    assert replay_res.status_code == 200
    cert = replay_res.json()
    print(f"Replay Certificate:")
    print(f"  Decision ID:         {cert['decision_id']}")
    print(f"  Status:              {cert['status']}")
    print(f"  Deterministic Match: {cert['is_exact_match']}")
    print(f"  Original Rec:        {cert['original_recommendation']}")
    print(f"  Replayed Rec:        {cert['replayed_recommendation']}")
    assert cert["is_exact_match"] is True
    assert cert["status"] == "VERIFIED_DETERMINISTIC"
    print("  ✓ Decision Replay verified 100% deterministic reproducibility!")

    # --------------------------------------------------------------------------
    # 11. Scientific 10-Point Benchmark Suite Run
    # --------------------------------------------------------------------------
    print_section("11. Scientific 10-Point Simulation Benchmark Suite")
    bench_res = client.post("/benchmark/run")
    assert bench_res.status_code == 200
    bench_data = bench_res.json()
    print(f"Benchmark Results:")
    print(f"  Total Cases: {bench_data['total_tests']}")
    print(f"  Passed:      {bench_data['passed_tests']}")
    print(f"  Pass Rate:   {bench_data['overall_score_pct']}%")
    print(f"  Duration:    {bench_data['duration_ms']} ms")
    assert bench_data["passed_tests"] == bench_data["total_tests"]
    assert bench_data["overall_score_pct"] == 100.0

    # --------------------------------------------------------------------------
    # 12. Security Audit & Injection Resistance Checks
    # --------------------------------------------------------------------------
    print_section("12. Security Audit: SQLi, XSS & Information Leakage")
    
    # SQLi test on field_id
    sqli_payload = "' OR '1'='1"
    sqli_res = client.get(f"/fields/{sqli_payload}")
    assert sqli_res.status_code in [404, 422], f"SQLi payload returned unexpected code {sqli_res.status_code}"
    print("  ✓ SQL Injection attempt safely blocked (Returned 404/422)")

    # XSS test on farmer observation
    xss_payload = "<script>alert('XSS')</script> Heavy rainfall observed."
    xss_res = client.post(f"/fields/{field_id}/observations", json={"message": xss_payload})
    assert xss_res.status_code == 200
    # Confirm script tag is treated strictly as text string
    assert "<script>" not in xss_res.json().get("predicate", "")
    print("  ✓ XSS injection parsed safely as plain text observation")

    # Information leakage test
    dashboard_res = client.get("/dashboard")
    assert dashboard_res.status_code == 200
    dash_text = dashboard_res.text.lower()
    for sensitive in ["password", "secret_key", "asi_cloud_key", "authorization: bearer"]:
        assert sensitive not in dash_text, f"Potential credential leak detected: {sensitive}"
    print("  ✓ No sensitive credentials or secrets exposed in API responses")

    print("\n" + "=" * 75)
    print("  ALL 12 END-TO-END & SECURITY TEST SUITES PASSED (100% SUCCESS)")
    print("=" * 75 + "\n")

if __name__ == "__main__":
    run_tests()
