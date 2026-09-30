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
    FieldRuleCreate, WhatIfSimulateRequest
)
from app.services.cognitive import CognitiveService
from app.services.llm import LLMService
from app.services.metta_runner import metta_service

router = APIRouter()
cognitive = CognitiveService()
llm = LLMService()

@router.get("/health")
def health():
    return {"status": "ok", "service": "agriguide", "metta_engine": "active"}

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
    cognitive.audit(db, "evidence", e.id, "FARMER_OBSERVATION_PARSED", {"message": payload.message, "predicate": parsed.predicate})
    db.commit()
    return {"evidence_id": e.id, "predicate": parsed.predicate, "value": parsed.value, "confidence": parsed.confidence}

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
