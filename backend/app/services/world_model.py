from datetime import datetime, timedelta
from typing import Any
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.models.domain import Belief, Evidence, Field, FieldRule, Sensor, SourceReliability

class WorldModelService:
    def build(self, db: Session, field: Field) -> dict[str, Any]:
        # Fetch active evidence
        evidences = (
            db.query(Evidence)
            .filter(Evidence.field_id == field.id, Evidence.status == "ACTIVE")
            .order_by(desc(Evidence.observed_at))
            .all()
        )

        by_predicate: dict[str, list[Evidence]] = {}
        for e in evidences:
            by_predicate.setdefault(e.predicate, []).append(e)

        # Detect conflicts across sources
        conflicts = []
        conflict_penalty = 0.0

        # Check rain forecast conflict
        rain_items = by_predicate.get("rain_probability_24h", [])
        if len(rain_items) >= 2:
            val1 = rain_items[0].value.get("value")
            val2 = rain_items[1].value.get("value")
            if val1 is not None and val2 is not None and abs(val1 - val2) >= 25:
                conflicts.append({
                    "predicate": "rain_probability_24h",
                    "sources": [rain_items[0].source_type, rain_items[1].source_type],
                    "values": [val1, val2],
                    "variance": abs(val1 - val2),
                    "description": f"Weather forecast discrepancy: {val1}% vs {val2}% reported by different sources."
                })
                conflict_penalty += 0.15

        # Check soil moisture conflict
        soil_items = by_predicate.get("soil_moisture", [])
        if len(soil_items) >= 2:
            val1 = soil_items[0].value.get("value")
            val2 = soil_items[1].value.get("value")
            if val1 is not None and val2 is not None and abs(val1 - val2) >= 10:
