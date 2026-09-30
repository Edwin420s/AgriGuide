from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.models.domain import (
    User, Farm, Field, FieldRule, Sensor, Evidence, Belief, Decision,
    DecisionReasoning, Outcome, LearningEvent, SourceReliability
)
from app.schemas.api import (
    EvidenceCreate, FarmerObservation, DecisionRequest, OutcomeCreate,
    FieldRuleCreate, WhatIfSimulateRequest, FarmerConsultRequest,
    FarmerConsultResponse, LLMStatusResponse, SwitchModelRequest,
    ModelsListResponse
)
from app.services.cognitive import CognitiveService
from app.services.llm import LLMService
from app.services.metta_runner import metta_service

router = APIRouter()
cognitive = CognitiveService()
llm = LLMService()

@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "agriguide",
        "metta_engine": "active",
        "llm_provider": llm.check_status()
    }

@router.get("/llm/status", response_model=LLMStatusResponse)
def get_llm_status():
    return llm.check_status()

@router.get("/llm/models", response_model=ModelsListResponse)
def get_llm_models():
    return {
        "active_model": llm.model,
        "models": llm.get_models(),
        "api_configured": llm.is_configured
    }

@router.post("/llm/model", response_model=LLMStatusResponse)
def switch_llm_model(payload: SwitchModelRequest):
    try:
        return llm.set_model(payload.model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return {
        "farms": db.query(Farm).count(),
        "fields": db.query(Field).count(),
        "evidence": db.query(Evidence).count(),
        "decisions": db.query(Decision).count(),
        "outcomes": db.query(Outcome).count(),
        "rules": db.query(FieldRule).count(),
        "calibrated_sources": db.query(SourceReliability).count()
    }

@router.get("/farms")
def farms(db: Session = Depends(get_db)):
    return [
        {
            "id": f.id,
            "name": f.name,
            "location": f.location_name,
            "water_availability": f.water_availability,
            "fields": len(f.fields)
        }
        for f in db.query(Farm).options(joinedload(Farm.fields)).all()
    ]

@router.get("/fields")
def fields(db: Session = Depends(get_db)):
    return [
        {
            "id": f.id,
            "farm_id": f.farm_id,
            "name": f.name,
            "crop": f.crop,
            "growth_stage": f.growth_stage,
            "soil_type": f.soil_type,
            "rules_count": db.query(FieldRule).filter(FieldRule.field_id == f.id).count()
        }
        for f in db.query(Field).all()
    ]

@router.get("/fields/{field_id}")
def field(field_id: str, db: Session = Depends(get_db)):
    f = db.query(Field).options(joinedload(Field.farm)).filter(Field.id == field_id).first()
    if not f:
        raise HTTPException(404, "Field not found")
    return {
        "id": f.id,
        "name": f.name,
        "farm": f.farm.name,
        "crop": f.crop,
        "growth_stage": f.growth_stage,
        "soil_type": f.soil_type,
        "water_availability": f.farm.water_availability
    }

@router.get("/fields/{field_id}/state")
def field_state(field_id: str, db: Session = Depends(get_db)):
    f = db.query(Field).options(joinedload(Field.farm)).filter(Field.id == field_id).first()
    if not f:
        raise HTTPException(404, "Field not found")
    st = cognitive.world.build(db, f)
    st["counterfactuals"] = metta_service.evaluate_counterfactuals(
        st.get("soil_moisture") or 18.0,
        st.get("rain_probability_24h") or 20.0,
        st.get("water_availability") or "LIMITED"
    )
    return st

@router.get("/fields/{field_id}/evidence")
def field_evidence(field_id: str, db: Session = Depends(get_db)):
    return [
        {
            "id": e.id,
            "type": e.type,
            "source_type": e.source_type,
            "source_id": e.source_id,
            "predicate": e.predicate,
            "value": e.value,
            "confidence": e.confidence,
            "observed_at": e.observed_at.isoformat()
        }
        for e in db.query(Evidence).filter(Evidence.field_id == field_id).order_by(Evidence.observed_at.desc()).all()
    ]

@router.post("/fields/{field_id}/evidence")
def create_evidence(field_id: str, payload: EvidenceCreate, db: Session = Depends(get_db)):
    if not db.query(Field).filter(Field.id == field_id).first():
        raise HTTPException(404, "Field not found")
    e = Evidence(field_id=field_id, **payload.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    cognitive.audit(db, "evidence", e.id, "EVIDENCE_CREATED", {"predicate": e.predicate, "value": e.value})
    db.commit()
    return {"id": e.id, "status": e.status}

@router.post("/fields/{field_id}/observations")
def farmer_observation(field_id: str, payload: FarmerObservation, db: Session = Depends(get_db)):
    if not db.query(Field).filter(Field.id == field_id).first():
        raise HTTPException(404, "Field not found")
    parsed = llm.extract_observation(payload.message)
    e = Evidence(
        field_id=field_id,
        type="FARMER_OBSERVATION",
        source_type="FARMER",
        source_id="farmer-ui",
        subject=field_id,
        predicate=parsed.predicate,
        value=parsed.value,
        observed_at=datetime.utcnow(),
        confidence=parsed.confidence,
        provenance={"extractor": "llm-interface"},
        raw_payload={"message": payload.message}
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    cognitive.audit(db, "evidence", e.id, "FARMER_OBSERVATION_PARSED", {"message": payload.message, "predicate": parsed.predicate, "explanation": parsed.explanation})
    db.commit()
    return {
        "evidence_id": e.id,
        "predicate": parsed.predicate,
        "value": parsed.value,
        "confidence": parsed.confidence,
        "explanation": parsed.explanation
    }

@router.get("/fields/{field_id}/beliefs")
def beliefs(field_id: str, db: Session = Depends(get_db)):
    return [
        {
            "id": b.id,
            "predicate": b.predicate,
            "value": b.value,
            "confidence": b.confidence,
            "status": b.status,
            "revision": b.revision_number
        }
        for b in db.query(Belief).filter(Belief.field_id == field_id).order_by(Belief.updated_at.desc()).all()
    ]

# --- Custom Field Rules ("The Agent That Grows Up") ---

@router.get("/fields/{field_id}/rules")
def get_field_rules(field_id: str, db: Session = Depends(get_db)):
    rules = db.query(FieldRule).filter(FieldRule.field_id == field_id).order_by(FieldRule.priority.desc()).all()
    return [
        {
            "id": r.id,
            "field_id": r.field_id,
            "name": r.name,
            "description": r.description,
            "condition": r.condition,
            "action": r.action,
            "metta_expr": r.metta_expr,
            "priority": r.priority,
            "is_active": r.is_active,
            "created_at": r.created_at.isoformat()
        }
        for r in rules
    ]

@router.post("/fields/{field_id}/rules")
def create_field_rule(field_id: str, payload: FieldRuleCreate, db: Session = Depends(get_db)):
    if not db.query(Field).filter(Field.id == field_id).first():
        raise HTTPException(404, "Field not found")
    rule = FieldRule(
        field_id=field_id,
        name=payload.name,
        description=payload.description,
        condition=payload.condition,
        action=payload.action,
        metta_expr=payload.metta_expr,
        priority=payload.priority,
        is_active=payload.is_active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    cognitive.audit(db, "rule", rule.id, "CUSTOM_RULE_CREATED", {"name": rule.name, "action": rule.action})
    db.commit()
    return {"id": rule.id, "name": rule.name, "status": "active"}

@router.put("/fields/{field_id}/rules/{rule_id}/toggle")
def toggle_field_rule(field_id: str, rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(FieldRule).filter(FieldRule.id == rule_id, FieldRule.field_id == field_id).first()
    if not rule:
        raise HTTPException(404, "Rule not found")
    rule.is_active = not rule.is_active
    db.commit()
    return {"id": rule.id, "is_active": rule.is_active}

@router.delete("/fields/{field_id}/rules/{rule_id}")
def delete_field_rule(field_id: str, rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(FieldRule).filter(FieldRule.id == rule_id, FieldRule.field_id == field_id).first()
    if not rule:
        raise HTTPException(404, "Rule not found")
    db.delete(rule)
    db.commit()
    return {"deleted": True, "rule_id": rule_id}

# --- Decision, Audit & Diff ---

@router.post("/fields/{field_id}/decide")
def decide(field_id: str, payload: DecisionRequest, db: Session = Depends(get_db)):
    f = db.query(Field).options(joinedload(Field.farm)).filter(Field.id == field_id).first()
    if not f:
        raise HTTPException(404, "Field not found")
    d, state, result = cognitive.decide(db, f, payload.trigger, payload.goal)
    diff = cognitive.get_decision_diff(db, d.id) if d.supersedes_id else None
    explanation = llm.explain_decision(
        recommendation=d.recommendation,
        confidence=d.confidence,
        reason=d.reason,
        steps=result.reasoning.steps,
        counterfactuals=result.reasoning.counterfactuals,
        supersedes_diff=diff,
        crop=f.crop,
        soil_moisture=state.get("soil_moisture"),
        rain_prob=state.get("rain_probability_24h"),
        water_avail=state.get("water_availability")
    )
    return {
        "decision_id": d.id,
        "recommendation": d.recommendation,
        "confidence": d.confidence,
        "reason": d.reason,
        "explanation": explanation,
        "supersedes_id": d.supersedes_id,
        "state_version": db.query(Decision).filter(Decision.field_id == field_id).count(),
        "audit_available": True,
        "rules": result.reasoning.rules,
        "omega_mode": result.mode,
        "source": result.reasoning.source,
        "counterfactuals": result.reasoning.counterfactuals,
        "state": state,
        "diff": diff
    }

@router.get("/fields/{field_id}/decisions")
def decisions(field_id: str, db: Session = Depends(get_db)):
    return [
        {
            "id": d.id,
            "recommendation": d.recommendation,
            "confidence": d.confidence,
            "reason": d.reason,
            "supersedes_id": d.supersedes_id,
            "created_at": d.created_at.isoformat()
        }
        for d in db.query(Decision).filter(Decision.field_id == field_id).order_by(Decision.created_at.desc()).all()
    ]

@router.get("/decisions/{decision_id}/audit")
def audit(decision_id: str, db: Session = Depends(get_db)):
    d = db.query(Decision).filter(Decision.id == decision_id).first()
    if not d:
        raise HTTPException(404, "Decision not found")
    reasoning = (
        db.query(DecisionReasoning)
        .filter(DecisionReasoning.decision_id == decision_id)
        .order_by(DecisionReasoning.sequence_number)
        .all()
    )
    evidence = (
        db.query(Evidence)
        .filter(Evidence.field_id == d.field_id)
        .order_by(Evidence.observed_at.desc())
        .limit(20)
        .all()
    )
    outcomes = db.query(Outcome).filter(Outcome.decision_id == decision_id).all()
    diff = cognitive.get_decision_diff(db, decision_id) if d.supersedes_id else None

    f = db.query(Field).options(joinedload(Field.farm)).filter(Field.id == d.field_id).first()
    f_state = cognitive.world.build(db, f) if f else {}
    cf = metta_service.evaluate_counterfactuals(
        f_state.get("soil_moisture") or 18.0,
        f_state.get("rain_probability_24h") or 20.0,
        f_state.get("water_availability") or "LIMITED"
    )

    explanation = llm.explain_decision(
        recommendation=d.recommendation,
        confidence=d.confidence,
        reason=d.reason,
        steps=[{"rule_id": r.rule_id, "input": r.input_data, "output": r.output_data} for r in reasoning],
        counterfactuals=cf,
        supersedes_diff=diff,
        crop=f.crop if f else "Maize",
        soil_moisture=f_state.get("soil_moisture"),
        rain_prob=f_state.get("rain_probability_24h"),
        water_avail=f_state.get("water_availability")
    )

    return {
        "decision": {
            "id": d.id,
            "recommendation": d.recommendation,
            "confidence": d.confidence,
            "reason": d.reason,
            "explanation": explanation,
            "supersedes_id": d.supersedes_id,
            "created_at": d.created_at.isoformat()
        },
        "reasoning": [
            {
                "sequence": r.sequence_number,
                "type": r.step_type,
                "rule_id": r.rule_id,
                "input": r.input_data,
                "output": r.output_data,
                "confidence": r.confidence
            }
            for r in reasoning
        ],
        "evidence": [
            {
                "id": e.id,
                "type": e.type,
                "predicate": e.predicate,
                "value": e.value,
                "confidence": e.confidence,
                "source_type": e.source_type,
                "observed_at": e.observed_at.isoformat()
            }
            for e in evidence
        ],
        "outcomes": [
            {
                "id": o.id,
                "type": o.type,
                "value": o.observed_value,
                "observed_at": o.observed_at.isoformat()
            }
            for o in outcomes
        ],
        "diff": diff,
        "counterfactuals": cf
    }

@router.get("/decisions/{decision_id}/diff")
def decision_diff(decision_id: str, db: Session = Depends(get_db)):
    diff = cognitive.get_decision_diff(db, decision_id)
    if not diff:
        raise HTTPException(404, "No supersession diff found for this decision.")
    return diff

@router.post("/fields/{field_id}/consult", response_model=FarmerConsultResponse)
def consult_field(field_id: str, payload: FarmerConsultRequest, db: Session = Depends(get_db)):
    f = db.query(Field).options(joinedload(Field.farm)).filter(Field.id == field_id).first()
    if not f:
        raise HTTPException(404, "Field not found")
    state = cognitive.world.build(db, f)
    latest_d = db.query(Decision).filter(Decision.field_id == field_id).order_by(Decision.created_at.desc()).first()
    context = {
        "crop": f.crop,
        "soil_moisture": state.get("soil_moisture", 18.0),
        "rain_probability_24h": state.get("rain_probability_24h", 75.0),
        "water_availability": state.get("water_availability", "LIMITED"),
        "latest_decision": latest_d.recommendation if latest_d else "PENDING_EVALUATION",
        "latest_reason": latest_d.reason if latest_d else "Awaiting initial MeTTa inference."
    }
    return llm.consult(payload.query, context, model=payload.model)


# --- Interactive What-If Simulation ---

@router.post("/fields/{field_id}/simulate")
def simulate(field_id: str, payload: WhatIfSimulateRequest, db: Session = Depends(get_db)):
    f = db.query(Field).options(joinedload(Field.farm)).filter(Field.id == field_id).first()
    if not f:
        raise HTTPException(404, "Field not found")

    base_state = cognitive.world.build(db, f)

    # Override with simulated parameters
    sim_state = dict(base_state)
    if payload.soil_moisture is not None:
        sim_state["soil_moisture"] = payload.soil_moisture
    if payload.rain_probability_24h is not None:
        sim_state["rain_probability_24h"] = payload.rain_probability_24h
    if payload.water_availability is not None:
        sim_state["water_availability"] = payload.water_availability
    sim_state["current_rainfall"] = payload.current_rainfall
    if payload.crop_water_demand is not None:
        sim_state["crop_water_demand"] = payload.crop_water_demand

    # If farmer custom rule test included
    if payload.custom_rule_action and payload.custom_rule_rain_min is not None:
        sim_rules = list(sim_state.get("custom_rules", []))
        sim_rules.insert(0, {
            "name": "Simulated Farmer Rule",
            "action": payload.custom_rule_action,
            "condition": {"rain_threshold_min": payload.custom_rule_rain_min},
            "is_active": True
        })
        sim_state["custom_rules"] = sim_rules

    reasoner_res = cognitive.omega.reasoner.decide(sim_state)
    return {
        "simulated_state": sim_state,
        "recommendation": reasoner_res.recommendation,
        "confidence": reasoner_res.confidence,
        "reason": reasoner_res.reason,
        "rules": reasoner_res.rules,
        "steps": reasoner_res.steps,
        "source": reasoner_res.source,
        "counterfactuals": reasoner_res.counterfactuals
    }

# --- Outcomes, Learning & Calibration ---

@router.post("/decisions/{decision_id}/outcomes")
def outcome(decision_id: str, payload: OutcomeCreate, db: Session = Depends(get_db)):
    d = db.query(Decision).filter(Decision.id == decision_id).first()
    if not d:
        raise HTTPException(404, "Decision not found")
    return cognitive.record_outcome(db, d, payload.model_dump())

@router.get("/fields/{field_id}/learning")
def learning(field_id: str, db: Session = Depends(get_db)):
    return [
        {
            "id": x.id,
            "type": x.type,
            "pattern": x.pattern,
            "observation": x.observation,
            "old_value": x.old_value,
            "new_value": x.new_value,
            "status": x.status,
            "created_at": x.created_at.isoformat()
        }
        for x in db.query(LearningEvent).filter(LearningEvent.field_id == field_id).order_by(LearningEvent.created_at.desc()).all()
    ]

@router.get("/sources/reliability")
def source_reliability(db: Session = Depends(get_db)):
    sources = db.query(SourceReliability).order_by(SourceReliability.score.desc()).all()
    return [
        {
            "id": s.id,
            "source_id": s.source_id,
            "source_type": s.source_type,
            "score": s.score,
            "samples": s.samples,
            "updated_at": s.updated_at.isoformat()
        }
        for s in sources
    ]

@router.get("/fields/{field_id}/timeline")
def timeline(field_id: str, db: Session = Depends(get_db)):
    ev = db.query(Evidence).filter(Evidence.field_id == field_id).all()
    ds = db.query(Decision).filter(Decision.field_id == field_id).all()
    out = db.query(Outcome).filter(Outcome.field_id == field_id).all()
    rows = []
    rows += [{"time": e.observed_at.isoformat(), "kind": "evidence", "title": e.predicate, "detail": e.value} for e in ev]
    rows += [{"time": d.created_at.isoformat(), "kind": "decision", "title": d.recommendation, "detail": d.reason} for d in ds]
    rows += [{"time": o.observed_at.isoformat(), "kind": "outcome", "title": o.type, "detail": o.observed_value} for o in out]
    return sorted(rows, key=lambda x: x["time"])
