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
