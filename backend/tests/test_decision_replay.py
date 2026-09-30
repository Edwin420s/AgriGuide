import pytest
from app.db.session import SessionLocal
from app.models.domain import Decision
from app.services.decision_replay import DecisionReplayEngine


def test_decision_replay_deterministic():
    db = SessionLocal()
    try:
        latest_decision = db.query(Decision).order_by(Decision.created_at.desc()).first()
        if not latest_decision:
            pytest.skip("No decisions available to replay.")

        replay_engine = DecisionReplayEngine()
        cert = replay_engine.replay_decision(db, latest_decision.id)

        assert cert.decision_id == latest_decision.id
        assert cert.status in ["VERIFIED_DETERMINISTIC", "DIVERGENCE_DETECTED"]
        assert cert.is_exact_match is True
        assert cert.original_recommendation == cert.replayed_recommendation
    finally:
        db.close()
