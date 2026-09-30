from datetime import datetime
from sqlalchemy.orm import Session
from app.models.domain import (
    AuditEvent, Belief, CognitiveRun, Decision, DecisionReasoning,
    Evidence, LearningEvent, Outcome, SourceReliability, Field
)
from app.services.omega import OmegaAgent
from app.services.world_model import WorldModelService

class CognitiveService:
    def __init__(self):
        self.omega = OmegaAgent()
        self.world = WorldModelService()

    def audit(self, db: Session, entity_type: str, entity_id: str, event_type: str, payload: dict):
        db.add(AuditEvent(
            entity_type=entity_type,
            entity_id=entity_id,
            event_type=event_type,
            payload=payload
        ))

    def update_beliefs(self, db: Session, field_id: str):
        evidences = (
            db.query(Evidence)
            .filter(Evidence.field_id == field_id, Evidence.status == "ACTIVE")
            .order_by(Evidence.observed_at.desc())
            .all()
        )
        latest: dict[str, Evidence] = {}
        for e in evidences:
            latest.setdefault(e.predicate, e)

        for predicate, e in latest.items():
            value = e.value
            old = (
                db.query(Belief)
                .filter(Belief.field_id == field_id, Belief.predicate == predicate, Belief.status == "ACTIVE")
                .order_by(Belief.updated_at.desc())
                .first()
            )
            if old and old.value == value:
                old.confidence = min(0.99, (old.confidence + e.confidence) / 2 + 0.02)
                old.updated_at = datetime.utcnow()
            else:
                if old:
                    old.status = "SUPERSEDED"
                    old.updated_at = datetime.utcnow()
                b = Belief(
                    field_id=field_id,
                    subject=e.subject,
                    predicate=predicate,
                    value=value,
                    confidence=e.confidence,
                    uncertainty=round(1.0 - e.confidence, 2),
                    revision_number=(old.revision_number + 1 if old else 1)
                )
                db.add(b)
        db.flush()

