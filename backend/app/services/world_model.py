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
                conflicts.append({
                    "predicate": "soil_moisture",
                    "sources": [soil_items[0].source_type, soil_items[1].source_type],
                    "values": [val1, val2],
                    "variance": abs(val1 - val2),
                    "description": f"Moisture conflict: {soil_items[0].source_type} ({val1}%) vs {soil_items[1].source_type} ({val2}%)."
                })
                conflict_penalty += 0.12

        # Primary values
        soil = soil_items[0] if soil_items else None
        rain = rain_items[0] if rain_items else None
        current_rain_items = by_predicate.get("current_rainfall", [])
        current = current_rain_items[0] if current_rain_items else None

        crop_demand = "HIGH" if field.growth_stage.lower() in {"flowering", "tasseling", "silking", "fruiting"} else "MEDIUM"

        # Load active custom field rules ("The Agent That Grows Up")
        custom_rules = (
            db.query(FieldRule)
            .filter(FieldRule.field_id == field.id, FieldRule.is_active == True)
            .order_by(desc(FieldRule.priority))
            .all()
        )
        rules_payload = [
            {
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "condition": r.condition,
                "action": r.action,
                "metta_expr": r.metta_expr,
                "priority": r.priority,
                "is_active": r.is_active,
            }
            for r in custom_rules
        ]

        base_soil_conf = soil.confidence if soil else 0.0
        base_weather_conf = rain.confidence if rain else 0.0

        # Adjust confidence for conflict
        adj_soil_conf = max(0.2, base_soil_conf - (conflict_penalty if any(c["predicate"] == "soil_moisture" for c in conflicts) else 0.0))
        adj_weather_conf = max(0.2, base_weather_conf - (conflict_penalty if any(c["predicate"] == "rain_probability_24h" for c in conflicts) else 0.0))

        return {
            "field_id": field.id,
            "crop": field.crop,
            "growth_stage": field.growth_stage,
            "crop_water_demand": crop_demand,
            "soil_moisture": (soil.value.get("value") if soil else None),
            "soil_confidence": round(adj_soil_conf, 2),
            "soil_source": (soil.source_type if soil else None),
            "rain_probability_24h": (rain.value.get("value") if rain else None),
            "weather_confidence": round(adj_weather_conf, 2),
            "weather_source": (rain.source_type if rain else None),
            "current_rainfall": (current.value.get("value") if current else False),
            "water_availability": field.farm.water_availability if field.farm else "LIMITED",
            "evidence_count": len(evidences),
            "has_conflicts": len(conflicts) > 0,
            "conflicts": conflicts,
            "custom_rules": rules_payload,
            "generated_at": datetime.utcnow().isoformat(),
        }
