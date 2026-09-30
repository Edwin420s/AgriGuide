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
