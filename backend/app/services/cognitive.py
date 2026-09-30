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

    def record_outcome(self, db: Session, decision: Decision, outcome_data: dict):
        observed_val = outcome_data.get("observed_value")
        if not isinstance(observed_val, dict):
            observed_val = {"value": observed_val}
            if "unit" in outcome_data:
                observed_val["unit"] = outcome_data["unit"]

        outcome = Outcome(
            decision_id=decision.id,
            field_id=decision.field_id,
            type=outcome_data.get("type", "ACTUAL_RAINFALL"),
            observed_value=observed_val,
            confidence=outcome_data.get("confidence", 0.8),
            observed_at=outcome_data.get("observed_at") or datetime.utcnow()
        )
        db.add(outcome)
        db.flush()

        pattern = "Outcome recorded for closed-loop evaluation."
        old_val = None
        new_val = None

        # Check weather outcome calibration
        if outcome.type in ("ACTUAL_RAINFALL", "RAINFALL_OBSERVATION"):
            obs = outcome.observed_value
            if isinstance(obs, (int, float)):
                mm = float(obs)
                actual_rain = mm > 1.0
            elif isinstance(obs, dict):
                mm = float(obs.get("millimeters", obs.get("value", 0.0)))
                actual_rain = mm > 1.0 or bool(obs.get("rained", False))
            else:
                try:
                    mm = float(obs)
                    actual_rain = mm > 1.0
                except (ValueError, TypeError):
                    mm = 0.0
                    actual_rain = False

            # Find weather evidence related to field
            weather_ev = (
                db.query(Evidence)
                .filter(Evidence.field_id == decision.field_id, Evidence.type == "WEATHER_FORECAST")
                .order_by(Evidence.observed_at.desc())
                .first()
            )

            if weather_ev:
                forecast_prob = weather_ev.value.get("value", 50)
                source_id = weather_ev.source_id or "demo-weather"
                source_type = weather_ev.source_type or "WEATHER_PROVIDER"

                # Accurate if predicted high rain and rained, or low rain and didn't rain
                is_accurate = (forecast_prob >= 50 and actual_rain) or (forecast_prob < 50 and not actual_rain)
                target_score = 0.92 if is_accurate else 0.45

                rel = db.query(SourceReliability).filter(SourceReliability.source_id == source_id).first()
                if not rel:
                    rel = SourceReliability(
                        source_id=source_id,
                        source_type=source_type,
                        score=0.70,
                        samples=1
                    )
                    db.add(rel)
                    db.flush()

                old_val = rel.score
                rel.samples += 1
                rel.score = round(((rel.score * (rel.samples - 1)) + target_score) / rel.samples, 3)
                rel.updated_at = datetime.utcnow()
                new_val = rel.score

                pattern = (
                    f"Calibrated reliability for weather source '{source_id}': "
                    f"Forecast was {forecast_prob}% rain, actual rainfall was {mm}mm. "
                    f"Accuracy verified ({'Accurate' if is_accurate else 'Inaccurate'}). "
                    f"Reliability updated from {old_val} to {new_val}."
                )

                # Record learning event
                event = LearningEvent(
                    field_id=decision.field_id,
                    decision_id=decision.id,
                    outcome_id=outcome.id,
                    type="SOURCE_CALIBRATION",
                    observation={"actual_rainfall_mm": mm, "forecast_probability": forecast_prob},
                    pattern=pattern,
                    old_value=old_val,
                    new_value=new_val,
                    status="APPLIED"
                )
                db.add(event)

        self.audit(db, "outcome", outcome.id, "OUTCOME_RECEIVED", outcome.observed_value)
        db.commit()
        db.refresh(outcome)
        return outcome
