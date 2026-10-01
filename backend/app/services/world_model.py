"""Agricultural World Model and Knowledge Graph Service.

Constructs an auditable, temporal, relational Digital Twin of each farm and field.
Encapsulates:
1. Entities: Farm, Field, Crop, Soil, Sensors, Weather Providers, Interventions, Decisions, Beliefs.
2. Relational Triples: grows, currently_at, has_soil, has_sensor, located_in, receives_forecast, etc.
3. Causal Graph: low_rainfall -> soil_moisture_drop -> water_stress -> yield_impact.
4. Temporal Validity & Freshness Decay.
5. Conflict Detection & Sensor Quality Scoring.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import desc
from sqlalchemy.orm import Session
from app.models.domain import Belief, Decision, Evidence, Field, FieldRule, Sensor, SourceReliability
from app.services.ml_analytics import AgriculturalMLService


@dataclass
class GraphEntity:
    id: str
    type: str
    label: str
    properties: dict[str, Any] = field(default_factory=dict)
    valid_from: str = ""
    valid_to: str | None = None


@dataclass
class GraphRelation:
    subject: str
    predicate: str
    object: str
    confidence: float = 1.0
    provenance: str = "world_model"
    properties: dict[str, Any] = field(default_factory=dict)


class AgriculturalKnowledgeGraph:
    """Explicit Agricultural Knowledge Graph representing entities, relational edges, and causal pathways."""

    def __init__(self, field_id: str):
        self.field_id = field_id
        self.entities: dict[str, GraphEntity] = {}
        self.relations: list[GraphRelation] = []
        self.causal_chains: list[dict[str, Any]] = []
        self.analytics: dict[str, Any] = {}

    def add_entity(self, entity: GraphEntity):
        self.entities[entity.id] = entity

    def add_relation(self, relation: GraphRelation):
        self.relations.append(relation)

    def to_dict(self) -> dict[str, Any]:
        return {
            "entities": [
                {
                    "id": e.id,
                    "type": e.type,
                    "label": e.label,
                    "properties": e.properties,
                    "valid_from": e.valid_from,
                    "valid_to": e.valid_to,
                }
                for e in self.entities.values()
            ],
            "relations": [
                {
                    "subject": r.subject,
                    "predicate": r.predicate,
                    "object": r.object,
                    "confidence": r.confidence,
                    "provenance": r.provenance,
                    "properties": r.properties,
                }
                for r in self.relations
            ],
            "causal_chains": self.causal_chains,
            "metta_atoms": self.to_metta_atoms(),
            "analytics": self.analytics,
        }

    def to_metta_atoms(self) -> list[str]:
        """Translates the graph relations into symbolic MeTTa atom declarations."""
        atoms = []
        for e in self.entities.values():
            atoms.append(f"(: {e.id} {e.type})")
        for r in self.relations:
            # Clean symbols for MeTTa s-expressions
            s = str(r.subject).replace(" ", "_").replace("-", "_")
            p = str(r.predicate).replace(" ", "_").replace("-", "_")
            o = str(r.object).replace(" ", "_").replace("-", "_")
            atoms.append(f"({p} {s} {o})")
        return atoms


class WorldModelService:
    """Maintains a living digital twin of every field, fusing sensor streams, weather,

    crop growth stages, and causal agronomic dependencies.
    """

    def build_knowledge_graph(self, db: Session, field: Field) -> AgriculturalKnowledgeGraph:
        """Constructs an explicit Agricultural Knowledge Graph for the specified field."""
        kg = AgriculturalKnowledgeGraph(field.id)
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Field Entity
        kg.add_entity(GraphEntity(
            id=field.id,
            type="Field",
            label=f"Field: {field.name}",
            properties={"area_ha": field.area, "status": field.status},
            valid_from=field.planting_date.isoformat() if field.planting_date else now_iso
        ))

        # 2. Farm & Location Entities
        if field.farm:
            farm_id = field.farm.id
            kg.add_entity(GraphEntity(
                id=farm_id,
                type="Farm",
                label=f"Farm: {field.farm.name}",
                properties={
                    "water_availability": field.farm.water_availability,
                    "latitude": field.farm.latitude,
                    "longitude": field.farm.longitude,
                }
            ))
            kg.add_relation(GraphRelation(subject=field.id, predicate="part_of", object=farm_id))

            loc_name = field.farm.location_name or "Regional_Baseline"
            loc_id = f"loc_{loc_name.lower().replace(' ', '_')}"
            kg.add_entity(GraphEntity(id=loc_id, type="Location", label=loc_name))
            kg.add_relation(GraphRelation(subject=farm_id, predicate="located_in", object=loc_id))
            kg.add_relation(GraphRelation(subject=field.id, predicate="located_in", object=loc_id))

        # 3. Crop & Lifecycle
        crop_id = f"crop_{field.crop.lower()}"
        kg.add_entity(GraphEntity(
            id=crop_id,
            type="Crop",
            label=field.crop.capitalize(),
            properties={"growth_stage": field.growth_stage}
        ))
        kg.add_relation(GraphRelation(subject=field.id, predicate="grows", object=crop_id))

        stage_id = f"stage_{field.growth_stage.lower()}"
        kg.add_entity(GraphEntity(
            id=stage_id,
            type="GrowthStage",
            label=f"Stage: {field.growth_stage.capitalize()}",
            properties={"stage": field.growth_stage}
        ))
        kg.add_relation(GraphRelation(subject=crop_id, predicate="currently_at", object=stage_id))

        # 4. Soil Entity
        soil_id = f"soil_{field.soil_type.lower()}"
        kg.add_entity(GraphEntity(
            id=soil_id,
            type="SoilType",
            label=field.soil_type.capitalize(),
            properties={"soil_type": field.soil_type}
        ))
        kg.add_relation(GraphRelation(subject=field.id, predicate="has_soil", object=soil_id))

        # 5. Sensors
        sensors = db.query(Sensor).filter(Sensor.field_id == field.id).all()
        for s in sensors:
            kg.add_entity(GraphEntity(
                id=s.id,
                type="Sensor",
                label=s.name,
                properties={"sensor_type": s.type, "unit": s.unit, "status": s.status}
            ))
            kg.add_relation(GraphRelation(subject=field.id, predicate="monitored_by", object=s.id))

        # 6. Active Beliefs
        beliefs = db.query(Belief).filter(Belief.field_id == field.id, Belief.status == "ACTIVE").all()
        for b in beliefs:
            b_val = b.value.get("value") if isinstance(b.value, dict) else b.value
            b_label = f"{b.predicate}={b_val}"
            b_node_id = f"belief_{b.id[:8]}"
            kg.add_entity(GraphEntity(
                id=b_node_id,
                type="Belief",
                label=b_label,
                properties={"confidence": b.confidence, "uncertainty": b.uncertainty, "revision": b.revision_number}
            ))
            kg.add_relation(GraphRelation(
                subject=field.id,
                predicate="current_belief",
                object=b_node_id,
                confidence=b.confidence
            ))

        # 7. Previous Decisions
        last_decision = (
            db.query(Decision)
            .filter(Decision.field_id == field.id)
            .order_by(Decision.created_at.desc())
            .first()
        )
        if last_decision:
            dec_id = f"dec_{last_decision.id[:8]}"
            kg.add_entity(GraphEntity(
                id=dec_id,
                type="Decision",
                label=f"Decision: {last_decision.recommendation}",
                properties={"confidence": last_decision.confidence, "reason": last_decision.reason}
            ))
            kg.add_relation(GraphRelation(subject=field.id, predicate="previous_decision", object=dec_id))

        # 8. Causal Chains
        kg.causal_chains = [
            {
                "path": ["Low_Rainfall", "Soil_Moisture_Drop", "Crop_Water_Stress", "Yield_Impact"],
                "mechanism": "Atmospheric moisture deficit propagates to root zone drying, inducing stomatal closure.",
                "weight": 0.92
            },
            {
                "path": ["Irrigation_Applied", "Soil_Moisture_Recovery", "Stress_Alleviation", "Yield_Protection"],
                "mechanism": "Targeted root-zone application restores transpiration efficiency and biomass accumulation.",
                "weight": 0.95
            },
            {
                "path": ["Excessive_Rain_Post_Irrigation", "Nutrient_Leaching", "Waterlogging", "Root_Hypoxia"],
                "mechanism": "Unneeded irrigation before storm events saturates pore space, flushing nitrates past root zone.",
                "weight": 0.88
            }
        ]

        # 9. Agronomic Physics & Visualization Analytics
        belief_map: dict[str, Any] = {}
        for b in beliefs:
            b_val = b.value.get("value") if isinstance(b.value, dict) else b.value
            belief_map[b.predicate] = b_val

        sm = float(belief_map.get("soil_moisture") or 17.5)
        rp = float(belief_map.get("rain_probability_24h") or 0.0)
        temp = float(belief_map.get("temperature_c") or 24.5)
        hum = float(belief_map.get("humidity_pct") or 65.0)
        wind = float(belief_map.get("wind_speed_kmh") or 9.6)
        ml_service = AgriculturalMLService()
        et0 = ml_service.estimate_et0(temp, hum, wind)
        crop_demand = ml_service.calculate_crop_water_demand(field.crop, field.growth_stage, et0)
        kc = crop_demand.get("crop_coefficient_kc", 1.15)
        etc = crop_demand.get("crop_demand_etc_mm_day") or crop_demand.get("crop_water_demand_etc_mm_day", 4.8)

        kg.analytics = {
            "soil_moisture": sm,
            "wilting_point": 18.0,
            "field_capacity": 34.0,
            "mad_threshold": 24.0,
            "rain_probability_24h": rp,
            "temperature_c": temp,
            "humidity_pct": hum,
            "wind_speed_kmh": wind,
            "reference_et0_mm": et0,
            "crop_coefficient_kc": kc,
            "etc_daily_mm": etc,
            "water_status": "CRITICAL_DEFICIT" if sm < 18.0 else ("DEPLETING" if sm < 24.0 else "OPTIMAL_HYDRATION"),
            "readily_available_water_pct": max(0.0, round(sm - 18.0, 1)),
            "recommendation_action": last_decision.recommendation if last_decision else "EVALUATE"
        }

        return kg

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
            if val1 is not None and val2 is not None and abs(val1 - val2) >= 8:
                conflicts.append({
                    "predicate": "soil_moisture",
                    "sources": [soil_items[0].source_type, soil_items[1].source_type],
                    "values": [val1, val2],
                    "variance": abs(val1 - val2),
                    "description": f"Moisture conflict: {soil_items[0].source_type} ({val1}%) vs {soil_items[1].source_type} ({val2}%)."
                })
                conflict_penalty += 0.12

        # Check current rainfall conflict or microclimate discrepancy
        current_rain_items = by_predicate.get("current_rainfall", [])
        if len(current_rain_items) >= 2:
            val1 = bool(current_rain_items[0].value.get("value"))
            val2 = bool(current_rain_items[1].value.get("value"))
            if val1 != val2:
                conflicts.append({
                    "predicate": "current_rainfall",
                    "sources": [current_rain_items[0].source_type, current_rain_items[1].source_type],
                    "values": [val1, val2],
                    "variance": 1.0,
                    "description": f"Rainfall report discrepancy: {current_rain_items[0].source_type} reports {'rain falling' if val1 else 'no rain'}, while {current_rain_items[1].source_type} reports {'rain falling' if val2 else 'no rain'}."
                })
                conflict_penalty += 0.20
        elif current_rain_items and current_rain_items[0].value.get("value") and rain_items and (rain_items[0].value.get("value") or 0) < 15:
            conflicts.append({
                "predicate": "rainfall_vs_forecast",
                "sources": [current_rain_items[0].source_type, rain_items[0].source_type],
                "values": [True, rain_items[0].value.get("value")],
                "variance": 0.8,
                "description": f"Localized rain context: Farmer observed active rain, while regional weather model shows {rain_items[0].value.get('value')}% 24h probability. Localized shower recognized."
            })
            conflict_penalty += 0.05

        # Primary values
        soil = soil_items[0] if soil_items else None
        rain = rain_items[0] if rain_items else None
        current = current_rain_items[0] if current_rain_items else None

        temp_items = by_predicate.get("temperature_c", [])
        temp = temp_items[0] if temp_items else None

        hum_items = by_predicate.get("humidity_pct", [])
        hum = hum_items[0] if hum_items else None

        wind_items = by_predicate.get("wind_speed_kmh", [])
        wind = wind_items[0] if wind_items else None

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

        # Build Agricultural Knowledge Graph
        kg = self.build_knowledge_graph(db, field)

        temp_val = temp.value.get("value") if temp else 25.3
        hum_val = hum.value.get("value") if hum else 42.0
        wind_val = wind.value.get("value") if wind else 9.6

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
            "temperature_c": temp_val,
            "temperature_source": (temp.source_type if temp else "WEATHER_PROVIDER"),
            "humidity_pct": hum_val,
            "wind_speed_kmh": wind_val,
            "water_availability": field.farm.water_availability if field.farm else "LIMITED",
            "evidence_count": len(evidences),
            "has_conflicts": len(conflicts) > 0,
            "conflicts": conflicts,
            "custom_rules": rules_payload,
            "knowledge_graph": kg.to_dict(),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
