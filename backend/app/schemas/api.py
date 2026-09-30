from datetime import datetime
from pydantic import BaseModel, Field

class EvidenceCreate(BaseModel):
    type: str
    source_type: str
    source_id: str | None = None
    subject: str
    predicate: str
    value: dict
    unit: str | None = None
    observed_at: datetime
    valid_until: datetime | None = None
    confidence: float = Field(0.7, ge=0, le=1)
    quality_score: float = Field(1, ge=0, le=1)
    source_reliability: float = Field(0.7, ge=0, le=1)
    provenance: dict = {}
    raw_payload: dict = {}

class FarmerObservation(BaseModel):
    message: str

class DecisionRequest(BaseModel):
    trigger: str = "USER_REQUEST"
    goal: str = "irrigation_decision"

class OutcomeCreate(BaseModel):
    type: str
    observed_value: dict
    confidence: float = Field(0.8, ge=0, le=1)
