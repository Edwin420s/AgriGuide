from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def uid() -> str: return str(uuid4())
def utc_now() -> datetime: return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(40), default="FARMER")
    language: Mapped[str] = mapped_column(String(20), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class Farm(Base):
    __tablename__ = "farms"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(150))
    location_name: Mapped[str] = mapped_column(String(150), default="")
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    area: Mapped[float | None] = mapped_column(Float, nullable=True)
    water_availability: Mapped[str] = mapped_column(String(40), default="LIMITED")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    fields: Mapped[list["Field"]] = relationship(back_populates="farm", cascade="all, delete-orphan")

class Field(Base):
    __tablename__ = "fields"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    farm_id: Mapped[str] = mapped_column(ForeignKey("farms.id"))
    name: Mapped[str] = mapped_column(String(150))
    area: Mapped[float | None] = mapped_column(Float, nullable=True)
    soil_type: Mapped[str] = mapped_column(String(100), default="loam")
    irrigation_method: Mapped[str] = mapped_column(String(100), default="drip")
    crop: Mapped[str] = mapped_column(String(100), default="maize")
    growth_stage: Mapped[str] = mapped_column(String(100), default="flowering")
    planting_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")
    farm: Mapped[Farm] = relationship(back_populates="fields")
    rules: Mapped[list["FieldRule"]] = relationship(back_populates="field", cascade="all, delete-orphan")

class Sensor(Base):
    __tablename__ = "sensors"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"))
    name: Mapped[str] = mapped_column(String(120))
    type: Mapped[str] = mapped_column(String(60))
    unit: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(30), default="ONLINE")

class Evidence(Base):
    __tablename__ = "evidence"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"))
    type: Mapped[str] = mapped_column(String(60))
    source_type: Mapped[str] = mapped_column(String(60))
    source_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    subject: Mapped[str] = mapped_column(String(120))
    predicate: Mapped[str] = mapped_column(String(120))
    value: Mapped[dict] = mapped_column(JSON)
    unit: Mapped[str | None] = mapped_column(String(40), nullable=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    freshness_score: Mapped[float] = mapped_column(Float, default=1.0)
    quality_score: Mapped[float] = mapped_column(Float, default=1.0)
    source_reliability: Mapped[float] = mapped_column(Float, default=0.7)
    confidence: Mapped[float] = mapped_column(Float, default=0.7)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")
    provenance: Mapped[dict] = mapped_column(JSON, default=dict)
    raw_payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class Belief(Base):
    __tablename__ = "beliefs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"))
    subject: Mapped[str] = mapped_column(String(120))
    predicate: Mapped[str] = mapped_column(String(120))
    value: Mapped[dict] = mapped_column(JSON)
    confidence: Mapped[float] = mapped_column(Float)
    uncertainty: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")
    revision_number: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class CognitiveRun(Base):
    __tablename__ = "cognitive_runs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"))
    trigger: Mapped[str] = mapped_column(String(60))
    goal: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(30), default="CREATED")
    world_state_version: Mapped[int] = mapped_column(Integer, default=1)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

class Decision(Base):
    __tablename__ = "decisions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"))
    cognitive_run_id: Mapped[str] = mapped_column(ForeignKey("cognitive_runs.id"))
    recommendation: Mapped[str] = mapped_column(String(30))
    confidence: Mapped[float] = mapped_column(Float)
    reason: Mapped[str] = mapped_column(Text)
    supersedes_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="ISSUED")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class DecisionReasoning(Base):
    __tablename__ = "decision_reasoning"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    decision_id: Mapped[str] = mapped_column(ForeignKey("decisions.id"))
    sequence_number: Mapped[int] = mapped_column(Integer)
    step_type: Mapped[str] = mapped_column(String(40))
    input_data: Mapped[dict] = mapped_column(JSON)
    rule_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    output_data: Mapped[dict] = mapped_column(JSON)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)

class Outcome(Base):
    __tablename__ = "outcomes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    decision_id: Mapped[str] = mapped_column(ForeignKey("decisions.id"))
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"))
    type: Mapped[str] = mapped_column(String(60))
    observed_value: Mapped[dict] = mapped_column(JSON)
    confidence: Mapped[float] = mapped_column(Float, default=0.8)
    observed_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class LearningEvent(Base):
    __tablename__ = "learning_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"))
    decision_id: Mapped[str] = mapped_column(ForeignKey("decisions.id"), nullable=True)
    outcome_id: Mapped[str] = mapped_column(ForeignKey("outcomes.id"), nullable=True)
    type: Mapped[str] = mapped_column(String(80))
    observation: Mapped[dict] = mapped_column(JSON)
    pattern: Mapped[str] = mapped_column(Text)
    old_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    new_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="OBSERVED")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class SourceReliability(Base):
    __tablename__ = "source_reliability"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    field_id: Mapped[str | None] = mapped_column(ForeignKey("fields.id"), nullable=True)
    source_id: Mapped[str] = mapped_column(String(120))
    source_type: Mapped[str] = mapped_column(String(60))
    score: Mapped[float] = mapped_column(Float, default=0.7)
    samples: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    entity_type: Mapped[str] = mapped_column(String(60))
    entity_id: Mapped[str] = mapped_column(String(36))
    event_type: Mapped[str] = mapped_column(String(80))
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class FieldRule(Base):
    __tablename__ = "field_rules"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    field_id: Mapped[str] = mapped_column(ForeignKey("fields.id"))
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    condition: Mapped[dict] = mapped_column(JSON)
    action: Mapped[str] = mapped_column(String(40))
    metta_expr: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=10)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    field: Mapped[Field] = relationship(back_populates="rules")

class CropCatalog(Base):
    __tablename__ = "crop_catalog"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name_en: Mapped[str | None] = mapped_column(String(100), nullable=True)
    name_sw: Mapped[str | None] = mapped_column(String(100), nullable=True)
    aliases: Mapped[list[str]] = mapped_column(JSON, default=list)
    category: Mapped[str] = mapped_column(String(50), default="cereal")
    default_kc_initial: Mapped[float] = mapped_column(Float, default=0.50)
    default_kc_mid: Mapped[float] = mapped_column(Float, default=1.15)
    default_kc_late: Mapped[float] = mapped_column(Float, default=0.60)
    root_depth_m: Mapped[float] = mapped_column(Float, default=0.6)
    water_demand_level: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    common_stages: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


