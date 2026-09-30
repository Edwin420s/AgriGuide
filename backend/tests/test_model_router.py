import pytest
from app.services.model_router import ModelTaskRouter


@pytest.fixture
def router():
    return ModelTaskRouter()


def test_route_perception_task(router):
    model = router.resolve_model("perception")
    assert model == "asi1-mini"


def test_route_extraction_task(router):
    model = router.resolve_model("extraction")
    assert model == "google/gemma-3-27b-it"


def test_route_reasoning_task(router):
    model = router.resolve_model("reasoning")
    assert model == "minimax/minimax-m3"


def test_route_counterfactual_audit(router):
    model = router.resolve_model("counterfactual_audit")
    assert model == "meta-llama/llama-3.3-70b-instruct"


def test_route_consultation_task(router):
    model = router.resolve_model("consultation")
    assert model == "qwen/qwen3-32b"


def test_route_user_override(router):
    model = router.resolve_model("perception", user_override="minimax/minimax-m3")
    assert model == "minimax/minimax-m3"


def test_get_routing_table(router):
    table = router.get_routing_table()
    assert len(table) == 5
    tasks = [r["task"] for r in table]
    assert "reasoning" in tasks
    assert "perception" in tasks
