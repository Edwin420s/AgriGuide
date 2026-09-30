#!/usr/bin/env python3
"""Seed rich demo data for AgriGuide showcasing:
- Multi-field farming context (Maize Flowering vs Beans Vegetative)
- Evidence -> Belief -> MeTTa Reasoning -> Decision -> Audit Trail
- Decision Supersession ("What Changed?" from IRRIGATE -> WAIT when rain arrives)
- Closed-Loop Learning & Source Reliability Calibration
- The Agent That Grows Up: Custom Farmer Field Rules
"""

import sys
from pathlib import Path

# Ensure backend package is in python path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))

from datetime import datetime, timedelta
from app.db.session import Base, engine, SessionLocal
from app.models.domain import (
    User, Farm, Field, Sensor, Evidence, Belief, CognitiveRun,
    Decision, DecisionReasoning, Outcome, LearningEvent, SourceReliability,
    AuditEvent, FieldRule
)

def seed():
    # Recreate tables to ensure clean schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    now = datetime.utcnow()

    print("Seeding AgriGuide demo data...")

    # 1. User & Farm
    farmer = User(
        name="Edwin (Nexora AI)",
        email="edwin@agriguide.local",
        role="FARMER",
        language="en"
    )
    db.add(farmer)
    db.flush()

    farm = Farm(
        owner_id=farmer.id,
        name="Kilimo Bora Demonstration Farm",
        location_name="Kutus, Kirinyaga County, Kenya",
        latitude=-0.528,
        longitude=37.283,
        area=4.5,
        water_availability="LIMITED"
    )
    db.add(farm)
    db.flush()

    # 2. Field A: North Plot (Maize Flowering)
    field_a = Field(
        farm_id=farm.id,
        name="North Plot - Maize (Flowering)",
        area=1.4,
        soil_type="loam",
        irrigation_method="drip",
        crop="maize",
        growth_stage="flowering",
        planting_date=now - timedelta(days=58),
        status="ACTIVE"
    )
    db.add(field_a)
    db.flush()

    sensor_a = Sensor(
        field_id=field_a.id,
        name="Loam Sensor Node 01",
        type="SOIL_MOISTURE",
        unit="%",
        status="ONLINE"
    )
    db.add(sensor_a)
    db.flush()

    # 3. Field B: South Terrace (French Beans Vegetative)
    field_b = Field(
        farm_id=farm.id,
        name="South Terrace - French Beans",
        area=0.8,
        soil_type="sandy loam",
        irrigation_method="micro-sprinkler",
        crop="french beans",
        growth_stage="vegetative",
        planting_date=now - timedelta(days=22),
        status="ACTIVE"
    )
    db.add(field_b)
    db.flush()

    sensor_b = Sensor(
        field_id=field_b.id,
        name="Terrace Sensor Node 02",
        type="SOIL_MOISTURE",
        unit="%",
        status="ONLINE"
    )
    db.add(sensor_b)
    db.flush()

    # --- Source Reliability Calibrations ---
    rel_weather = SourceReliability(
        field_id=None,
        source_id="open-meteo-east-africa",
        source_type="WEATHER_PROVIDER",
        score=0.74,
        samples=18,
        updated_at=now - timedelta(hours=2)
    )
    rel_sensor_a = SourceReliability(
        field_id=field_a.id,
        source_id="loam-sensor-01",
        source_type="SENSOR",
        score=0.96,
        samples=45,
        updated_at=now - timedelta(minutes=15)
    )
    rel_sensor_b = SourceReliability(
        field_id=field_b.id,
        source_id="terrace-sensor-02",
        source_type="SENSOR",
        score=0.94,
        samples=32,
        updated_at=now - timedelta(minutes=20)
    )
    rel_farmer = SourceReliability(
        field_id=None,
        source_id="farmer-ui",
        source_type="FARMER",
        score=0.88,
        samples=14,
        updated_at=now - timedelta(hours=6)
    )
    db.add_all([rel_weather, rel_sensor_a, rel_sensor_b, rel_farmer])
    db.flush()

    # --- Field A: Custom Field Rule ("The Agent That Grows Up") ---
    rule_a = FieldRule(
        field_id=field_a.id,
        name="Kirinyaga Flowering Rain Buffer",
        description="Conserve limited tank water when rain probability >= 65% is forecast during maize flowering stage",
        condition={"rain_threshold_min": 65},
        action="WAIT",
        metta_expr="(= (kirinyaga-rain-buffer $soil $rain) (if (>= $rain 65) WAIT CONTINUED))",
        priority=20,
        is_active=True
    )
    db.add(rule_a)
    db.flush()

    # --- Field A History: Initial Decision (IRRIGATE) before rain forecast was received ---
    t_minus_2h = now - timedelta(hours=2)

    ev_soil_early = Evidence(
        field_id=field_a.id,
        type="SENSOR_OBSERVATION",
        source_type="SENSOR",
        source_id="loam-sensor-01",
        subject=field_a.id,
        predicate="soil_moisture",
        value={"value": 16.5},
        unit="%",
        observed_at=t_minus_2h - timedelta(minutes=10),
        confidence=0.94,
        source_reliability=0.94,
        provenance={"sensor": "Loam Sensor Node 01"},
        status="ACTIVE"
    )
    ev_rain_early = Evidence(
        field_id=field_a.id,
        type="WEATHER_FORECAST",
        source_type="WEATHER_PROVIDER",
        source_id="open-meteo-east-africa",
        subject=field_a.id,
        predicate="rain_probability_24h",
        value={"value": 18},
        unit="%",
        observed_at=t_minus_2h - timedelta(minutes=25),
        confidence=0.72,
        source_reliability=0.72,
        provenance={"provider": "Open-Meteo"},
        status="SUPERSEDED"
    )
    db.add_all([ev_soil_early, ev_rain_early])
    db.flush()

    run_early = CognitiveRun(
        field_id=field_a.id,
        trigger="SCHEDULED_CYCLE",
        goal="morning_irrigation_evaluation",
        status="COMPLETED",
        world_state_version=1,
        started_at=t_minus_2h,
        completed_at=t_minus_2h + timedelta(seconds=1)
    )
    db.add(run_early)
    db.flush()

    decision_early = Decision(
        field_id=field_a.id,
        cognitive_run_id=run_early.id,
        recommendation="IRRIGATE",
        confidence=0.87,
        reason="Soil moisture is critically low at 16.5%, crop is in flowering stage with high water demand, and rain probability is only 18%. Immediate drip irrigation recommended.",
        supersedes_id=None,
        status="SUPERSEDED",
        created_at=t_minus_2h
    )
    db.add(decision_early)
    db.flush()

    steps_early = [
        DecisionReasoning(
            decision_id=decision_early.id,
            sequence_number=1,
            step_type="OMEGA_AGENT_INIT",
            rule_id="OMEGA-CORE-CYCLE",
            input_data={"agent_id": "omega-agriguide-agent-01", "goal": "irrigation_decision", "skill": "omega/skills/agriguide.metta"},
            output_data={"status": "Omega agent activated goal: 'irrigation_decision'"},
            confidence=0.99
        ),
        DecisionReasoning(
            decision_id=decision_early.id,
            sequence_number=2,
            step_type="OBSERVATION",
            input_data={"soil_moisture": 16.5, "rain_probability": 18, "water": "LIMITED"},
            output_data={"status": "evidence ingested into cognitive context"},
            confidence=0.88
        ),
        DecisionReasoning(
            decision_id=decision_early.id,
            sequence_number=3,
            step_type="BELIEF",
            input_data={"crop": "maize", "growth_stage": "flowering"},
            output_data={"crop_water_demand": "HIGH"},
            confidence=0.95
        ),
        DecisionReasoning(
            decision_id=decision_early.id,
            sequence_number=4,
            step_type="METTA_RULE",
            rule_id="R-LOW-MOISTURE-LOW-RAIN",
            input_data={"soil": 16.5, "rain": 18},
            output_data={"result": "IRRIGATE"},
            confidence=0.92
        ),
        DecisionReasoning(
            decision_id=decision_early.id,
            sequence_number=5,
            step_type="DECISION",
            rule_id="R-LOW-MOISTURE-LOW-RAIN",
            input_data={"recommendation": "IRRIGATE"},
            output_data={"recommendation": "IRRIGATE", "confidence": 0.87},
            confidence=0.87
        )
    ]
    db.add_all(steps_early)

    # --- Field A: New Evidence arriving at t_minus_20m (High Rain Forecast & Farmer Observation) ---
    t_recent = now - timedelta(minutes=20)

    ev_rain_new = Evidence(
        field_id=field_a.id,
        type="WEATHER_FORECAST",
        source_type="WEATHER_PROVIDER",
        source_id="open-meteo-east-africa",
        subject=field_a.id,
        predicate="rain_probability_24h",
        value={"value": 82},
        unit="%",
        observed_at=t_recent - timedelta(minutes=5),
        confidence=0.84,
        source_reliability=0.74,
        provenance={"provider": "Open-Meteo East Africa", "model": "GFS-0.25"},
        status="ACTIVE"
    )
    ev_farmer_obs = Evidence(
        field_id=field_a.id,
        type="FARMER_OBSERVATION",
        source_type="FARMER",
        source_id="farmer-ui",
        subject=field_a.id,
        predicate="weather_condition",
        value={"message": "Dark rain clouds over Mt Kenya ridge; wind picking up", "rain_likely": True},
        observed_at=t_recent - timedelta(minutes=2),
        confidence=0.85,
        source_reliability=0.88,
        provenance={"extractor": "llm-interface"},
        status="ACTIVE"
    )
    db.add_all([ev_rain_new, ev_farmer_obs])
    db.flush()

    # --- Field A: Revised Decision (WAIT) superseding early decision ---
    run_revised = CognitiveRun(
        field_id=field_a.id,
        trigger="EVIDENCE_UPDATE",
        goal="reassess_irrigation_due_to_weather",
        status="COMPLETED",
        world_state_version=2,
        started_at=t_recent,
        completed_at=t_recent + timedelta(seconds=1)
    )
    db.add(run_revised)
    db.flush()

    decision_revised = Decision(
        field_id=field_a.id,
        cognitive_run_id=run_revised.id,
        recommendation="WAIT",
        confidence=0.91,
        reason="Soil moisture is low (16.5%), but rain probability jumped to 82% within 24h. With limited water availability, immediate irrigation is suspended to conserve water and avoid leaching nutrients.",
        supersedes_id=decision_early.id,
        status="ISSUED",
        created_at=t_recent
    )
    db.add(decision_revised)
    db.flush()

    steps_revised = [
        DecisionReasoning(
            decision_id=decision_revised.id,
            sequence_number=1,
            step_type="OMEGA_AGENT_INIT",
            rule_id="OMEGA-CORE-CYCLE",
            input_data={"agent_id": "omega-agriguide-agent-01", "goal": "reassess_irrigation", "skill": "omega/skills/agriguide.metta"},
            output_data={"status": "Omega agent activated goal: 'reassess_irrigation'"},
            confidence=0.99
        ),
        DecisionReasoning(
            decision_id=decision_revised.id,
            sequence_number=2,
            step_type="OMEGA_MEMORY_RECONCILIATION",
            rule_id="OMEGA-REVISE-PRIOR-DECISION",
            input_data={
                "prior_recommendation": "IRRIGATE",
                "new_telemetry": {"rain_probability_24h": 82, "current_rainfall": False}
            },
            output_data={"status": "Memory conflict detected: New rainfall telemetry invalidates prior dry assumption; triggering state supersession."},
            confidence=0.95
        ),
        DecisionReasoning(
            decision_id=decision_revised.id,
            sequence_number=3,
            step_type="OBSERVATION",
            input_data={"soil_moisture": 16.5, "rain_probability": 82, "current_rain": False},
            output_data={"status": "new weather evidence detected and ingested"},
            confidence=0.89
        ),
        DecisionReasoning(
            decision_id=decision_revised.id,
            sequence_number=4,
            step_type="BELIEF",
            input_data={"rain_probability_24h": 82, "previous_recommendation": "IRRIGATE"},
            output_data={"hypothesis": "weather shifts priority to water conservation"},
            confidence=0.90
        ),
        DecisionReasoning(
            decision_id=decision_revised.id,
            sequence_number=5,
            step_type="METTA_RULE",
            rule_id="R-HIGH-RAIN-WATER-CONSERVATION",
            input_data={"soil": 16.5, "rain": 82, "water": "limited"},
            output_data={"result": "WAIT"},
            confidence=0.94
        ),
        DecisionReasoning(
            decision_id=decision_revised.id,
            sequence_number=6,
            step_type="DECISION_REVISED",
            rule_id="R-HIGH-RAIN-WATER-CONSERVATION",
            input_data={"supersedes": decision_early.id, "from": "IRRIGATE", "to": "WAIT"},
            output_data={"recommendation": "WAIT", "confidence": 0.91},
            confidence=0.91
        )
    ]
    db.add_all(steps_revised)

    # Beliefs for Field A
    b_soil = Belief(
        field_id=field_a.id,
        subject=field_a.id,
        predicate="soil_moisture",
        value={"value": 16.5},
        confidence=0.94,
        uncertainty=0.06,
        status="ACTIVE",
        revision_number=1,
        created_at=t_minus_2h,
        updated_at=t_recent
    )
    b_rain = Belief(
        field_id=field_a.id,
        subject=field_a.id,
        predicate="rain_probability_24h",
        value={"value": 82},
        confidence=0.84,
        uncertainty=0.16,
        status="ACTIVE",
        revision_number=2,
        created_at=t_recent,
        updated_at=t_recent
    )
    db.add_all([b_soil, b_rain])

    # Outcomes & Learning Event for Field A
    outcome_rain = Outcome(
        decision_id=decision_revised.id,
        field_id=field_a.id,
        type="ACTUAL_RAINFALL",
        observed_value={"millimeters": 9.4, "rained": True, "duration_hours": 1.5},
        confidence=0.95,
        observed_at=now - timedelta(minutes=5)
    )
    db.add(outcome_rain)
    db.flush()

    learn_event = LearningEvent(
        field_id=field_a.id,
        decision_id=decision_revised.id,
        outcome_id=outcome_rain.id,
        type="SOURCE_CALIBRATION",
        observation={"actual_rainfall_mm": 9.4, "forecast_probability": 82},
        pattern="Weather provider Open-Meteo East Africa correctly predicted high rainfall (82% -> 9.4mm measured). Source reliability calibrated upward from 0.70 to 0.74.",
        old_value=0.70,
        new_value=0.74,
        status="APPLIED",
        created_at=now - timedelta(minutes=5)
    )
    db.add(learn_event)

    # --- Field B: South Terrace (French Beans) ---
    ev_soil_b = Evidence(
        field_id=field_b.id,
        type="SENSOR_OBSERVATION",
        source_type="SENSOR",
        source_id="terrace-sensor-02",
        subject=field_b.id,
        predicate="soil_moisture",
        value={"value": 11.2},
        unit="%",
        observed_at=now - timedelta(minutes=15),
        confidence=0.95,
        source_reliability=0.94,
        provenance={"sensor": "Terrace Sensor Node 02"},
        status="ACTIVE"
    )
    ev_rain_b = Evidence(
        field_id=field_b.id,
        type="WEATHER_FORECAST",
        source_type="WEATHER_PROVIDER",
        source_id="open-meteo-east-africa",
        subject=field_b.id,
        predicate="rain_probability_24h",
        value={"value": 14},
        unit="%",
        observed_at=now - timedelta(minutes=25),
        confidence=0.74,
        source_reliability=0.74,
        provenance={"provider": "Open-Meteo"},
        status="ACTIVE"
    )
    db.add_all([ev_soil_b, ev_rain_b])
    db.flush()

    run_b = CognitiveRun(
        field_id=field_b.id,
        trigger="SENSOR_THRESHOLD_ALERT",
        goal="evaluate_critical_moisture",
        status="COMPLETED",
        world_state_version=1,
        started_at=now - timedelta(minutes=12),
        completed_at=now - timedelta(minutes=12, seconds=-1)
    )
    db.add(run_b)
    db.flush()

    decision_b = Decision(
        field_id=field_b.id,
        cognitive_run_id=run_b.id,
        recommendation="IRRIGATE",
        confidence=0.93,
        reason="Soil moisture is critically low at 11.2%, French beans are shallow-rooted in sandy loam, and rain probability is only 14%. Immediate micro-sprinkler irrigation required to prevent wilting.",
        supersedes_id=None,
        status="ISSUED",
        created_at=now - timedelta(minutes=12)
    )
    db.add(decision_b)
    db.flush()

    steps_b = [
        DecisionReasoning(
            decision_id=decision_b.id,
            sequence_number=1,
            step_type="OBSERVATION",
            input_data={"soil_moisture": 11.2, "rain_probability": 14},
            output_data={"status": "critical low moisture alert"},
            confidence=0.95
        ),
        DecisionReasoning(
            decision_id=decision_b.id,
            sequence_number=2,
            step_type="BELIEF",
            input_data={"crop": "french beans", "soil": "sandy loam"},
            output_data={"vulnerability": "high drought sensitivity"},
            confidence=0.92
        ),
        DecisionReasoning(
            decision_id=decision_b.id,
            sequence_number=3,
            step_type="METTA_RULE",
            rule_id="R-LOW-MOISTURE-LOW-RAIN",
            input_data={"soil": 11.2, "rain": 14},
            output_data={"result": "IRRIGATE"},
            confidence=0.95
        ),
        DecisionReasoning(
            decision_id=decision_b.id,
            sequence_number=4,
            step_type="DECISION",
            rule_id="R-LOW-MOISTURE-LOW-RAIN",
            input_data={"action": "IRRIGATE"},
            output_data={"recommendation": "IRRIGATE", "confidence": 0.93},
            confidence=0.93
        )
    ]
    db.add_all(steps_b)

    # Beliefs for Field B
    b_soil_b = Belief(
        field_id=field_b.id,
        subject=field_b.id,
        predicate="soil_moisture",
        value={"value": 11.2},
        confidence=0.95,
        uncertainty=0.05,
        status="ACTIVE",
        revision_number=1,
        created_at=now - timedelta(minutes=15),
        updated_at=now - timedelta(minutes=15)
    )
    b_rain_b = Belief(
        field_id=field_b.id,
        subject=field_b.id,
        predicate="rain_probability_24h",
        value={"value": 14},
        confidence=0.74,
        uncertainty=0.26,
        status="ACTIVE",
        revision_number=1,
        created_at=now - timedelta(minutes=25),
        updated_at=now - timedelta(minutes=25)
    )
    db.add_all([b_soil_b, b_rain_b])

    # Audit Events
    audit_1 = AuditEvent(
        entity_type="decision",
        entity_id=decision_early.id,
        event_type="DECISION_CREATED",
        payload={"recommendation": "IRRIGATE", "rules": ["R-LOW-MOISTURE-LOW-RAIN"], "confidence": 0.87},
        created_at=t_minus_2h
    )
    audit_2 = AuditEvent(
        entity_type="decision",
        entity_id=decision_revised.id,
        event_type="DECISION_REVISED",
        payload={"supersedes": decision_early.id, "previous": "IRRIGATE", "new": "WAIT", "reason": "Rain forecast jump to 82%"},
        created_at=t_recent
    )
    audit_3 = AuditEvent(
        entity_type="decision",
        entity_id=decision_b.id,
        event_type="DECISION_CREATED",
        payload={"recommendation": "IRRIGATE", "field": field_b.name, "confidence": 0.93},
        created_at=now - timedelta(minutes=12)
    )
    db.add_all([audit_1, audit_2, audit_3])

    farm_name = farm.name
    field_a_name = field_a.name
    field_a_id = field_a.id
    field_b_name = field_b.name
    field_b_id = field_b.id
    dec_early_rec = decision_early.recommendation
    dec_rev_rec = decision_revised.recommendation
    out_val = outcome_rain.observed_value
    score_val = rel_weather.score

    db.commit()
    db.close()

    print(f"Successfully seeded:")
    print(f"  Farm: {farm_name}")
    print(f"  Field A: {field_a_name} ({field_a_id})")
    print(f"  Field B: {field_b_name} ({field_b_id})")
    print(f"  Decisions: {dec_early_rec} -> {dec_rev_rec} (superseded)")
    print(f"  Outcome: {out_val} mm rain recorded")
    print(f"  Learning: Source reliability calibrated to {score_val}")


if __name__ == "__main__":
    seed()
