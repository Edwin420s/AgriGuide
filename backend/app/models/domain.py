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
