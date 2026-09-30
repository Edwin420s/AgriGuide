from datetime import datetime
from uuid import uuid4
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def uid() -> str: return str(uuid4())

class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    role: Mapped[str] = mapped_column(String(40), default="FARMER")
    language: Mapped[str] = mapped_column(String(20), default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
