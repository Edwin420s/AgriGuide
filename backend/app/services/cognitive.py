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

    def decide(self, db: Session, field: Field, trigger: str, goal: str):
        self.update_beliefs(db, field.id)
        state = self.world.build(db, field)

        run_count = db.query(CognitiveRun).filter(CognitiveRun.field_id == field.id).count()
        run = CognitiveRun(
            field_id=field.id,
            trigger=trigger,
            goal=goal,
            status="REASONING",
            world_state_version=run_count + 1
        )
        db.add(run)
        db.flush()

        previous = (
            db.query(Decision)
            .filter(Decision.field_id == field.id)
            .order_by(Decision.created_at.desc())
            .first()
        )
        memory = []
        if previous:
            memory.append({
                "decision": previous.recommendation,
                "confidence": previous.confidence,
                "reason": previous.reason,
                "created_at": previous.created_at.isoformat()
            })

        result = self.omega.run(goal, state, memory)

        supersedes_id = None
        if previous and previous.recommendation != result.reasoning.recommendation:
            supersedes_id = previous.id

        decision = Decision(
            field_id=field.id,
            cognitive_run_id=run.id,
            recommendation=result.reasoning.recommendation,
            confidence=result.reasoning.confidence,
            reason=result.reasoning.reason,
            supersedes_id=supersedes_id
        )
        db.add(decision)
        db.flush()

        for i, step in enumerate(result.reasoning.steps, 1):
            db.add(DecisionReasoning(
                decision_id=decision.id,
                sequence_number=i,
                step_type=step.get("type", "INFERENCE"),
                input_data=step.get("input", {}),
                rule_id=step.get("rule_id"),
                output_data=step.get("output", {}),
                confidence=step.get("confidence", result.reasoning.confidence)
            ))

        run.status = "COMPLETED"
        run.completed_at = datetime.utcnow()

        self.audit(
            db, "decision", decision.id, "DECISION_CREATED",
            {
                "recommendation": decision.recommendation,
                "confidence": decision.confidence,
                "rules": result.reasoning.rules,
                "omega_mode": result.mode,
                "source": result.reasoning.source
            }
        )

        if decision.supersedes_id:
            self.audit(
                db, "decision", decision.id, "DECISION_REVISED",
                {
                    "supersedes": decision.supersedes_id,
                    "previous_recommendation": previous.recommendation if previous else None,
                    "new_recommendation": decision.recommendation,
                    "trigger": trigger
                }
            )

        db.commit()
        db.refresh(decision)
        return decision, state, result

    def get_decision_diff(self, db: Session, decision_id: str) -> dict:
        d = db.query(Decision).filter(Decision.id == decision_id).first()
        if not d:
            return {}

        prev = None
        if d.supersedes_id:
            prev = db.query(Decision).filter(Decision.id == d.supersedes_id).first()

        evidence_changes = []
        rule_changes = []

        if prev:
            curr_steps = (
                db.query(DecisionReasoning)
                .filter(DecisionReasoning.decision_id == d.id)
                .order_by(DecisionReasoning.sequence_number)
                .all()
            )
            prev_steps = (
                db.query(DecisionReasoning)
                .filter(DecisionReasoning.decision_id == prev.id)
                .order_by(DecisionReasoning.sequence_number)
                .all()
            )

            prev_rules = [s.rule_id for s in prev_steps if s.rule_id]
            curr_rules = [s.rule_id for s in curr_steps if s.rule_id]

            rule_changes.append({
                "previous_rules": prev_rules,
                "new_rules": curr_rules,
                "explanation": f"Rule shifted from {prev_rules} to {curr_rules} based on updated evidence."
            })

            # Fetch evidences created around or between decisions
            recent_ev = (
                db.query(Evidence)
                .filter(Evidence.field_id == d.field_id)
                .order_by(Evidence.observed_at.desc())
                .limit(5)
                .all()
            )
            for e in recent_ev:
                evidence_changes.append({
                    "predicate": e.predicate,
                    "value": e.value,
                    "source": e.source_type,
                    "observed_at": e.observed_at.isoformat()
                })

        return {
            "decision_id": d.id,
            "superseded_id": d.supersedes_id,
            "recommendation": d.recommendation,
            "previous_recommendation": prev.recommendation if prev else None,
            "reason": d.reason,
            "previous_reason": prev.reason if prev else None,
            "confidence_delta": round(d.confidence - (prev.confidence if prev else d.confidence), 2),
            "evidence_changes": evidence_changes,
            "rule_changes": rule_changes
        }

