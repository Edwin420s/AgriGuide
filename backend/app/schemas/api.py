from datetime import datetime
from pydantic import BaseModel, Field
from typing import Any

class FarmCreate(BaseModel):
    name: str
    location_name: str
    water_availability: str = "LIMITED"
    area: float | None = 2.5
    latitude: float | None = None
    longitude: float | None = None

class FieldCreate(BaseModel):
    farm_id: str | None = None
    name: str
    crop: str = "maize"
    growth_stage: str = "flowering"
    soil_type: str = "loam"
    irrigation_method: str = "drip"
    area_ha: float | None = 1.0

class LocationResolveResponse(BaseModel):
    name: str
    latitude: float
    longitude: float
    elevation: float | None = None
    country: str = "Kenya"
    source: str = "verified_hub"
    preview_weather: dict | None = None

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
    observed_at: datetime

class DecisionResponse(BaseModel):
    decision_id: str
    recommendation: str
    confidence: float
    reason: str
    state_version: int
    audit_available: bool

class FieldRuleCreate(BaseModel):
    name: str
    description: str
    condition: dict
    action: str
    metta_expr: str | None = None
    priority: int = 10
    is_active: bool = True

class FieldRuleResponse(BaseModel):
    id: str
    field_id: str
    name: str
    description: str
    condition: dict
    action: str
    metta_expr: str | None = None
    priority: int
    is_active: bool
    created_at: datetime

class FieldUpdate(BaseModel):
    name: str | None = None
    crop: str | None = None
    growth_stage: str | None = None
    soil_type: str | None = None
    area_ha: float | None = None
    water_availability: str | None = None

class WhatIfSimulateRequest(BaseModel):
    soil_moisture: float | None = None
    rain_probability_24h: float | None = None
    water_availability: str | None = None
    current_rainfall: bool = False
    crop_water_demand: str | None = None
    custom_rule_action: str | None = None
    custom_rule_rain_min: float | None = None

class DecisionDiffResponse(BaseModel):
    decision_id: str
    superseded_id: str | None
    recommendation: str
    previous_recommendation: str | None
    reason: str
    previous_reason: str | None
    confidence_delta: float
    evidence_changes: list[dict]
    rule_changes: list[dict]

class FarmerConsultRequest(BaseModel):
    query: str
    model: str | None = None

class FarmerConsultResponse(BaseModel):
    answer: str
    grounded: bool
    provider: str
    model: str

class ModelInfo(BaseModel):
    id: str
    name: str
    tag: str
    description: str
    context_window: str
    best_for: str

class SwitchModelRequest(BaseModel):
    model: str

class ModelsListResponse(BaseModel):
    active_model: str
    models: list[ModelInfo]
    api_configured: bool

class LLMStatusResponse(BaseModel):
    provider: str
    api_configured: bool
    base_url: str
    model: str
    status: str
    available_models: list[str]
    models_metadata: list[ModelInfo] = []

class ActionProposalRequest(BaseModel):
    action_type: str
    proposed_params: dict[str, Any] = {}

class AnomalyCheckRequest(BaseModel):
    history: list[float]
    current_value: float
    sensor_type: str = "soil_moisture"

class DomainEvaluateRequest(BaseModel):
    params: dict[str, Any] = {}

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "FARMER"
    language: str = "en"
    farm_name: str | None = None
    location_name: str | None = None
    initial_crop: str | None = "maize"
    water_availability: str = "LIMITED"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    language: str = "en"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    farm_id: str | None = None
    field_id: str | None = None

class UserProfileUpdateRequest(BaseModel):
    name: str | None = None
    language: str | None = None

class UserChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


