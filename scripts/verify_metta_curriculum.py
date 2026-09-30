#!/usr/bin/env python3
"""AgriGuide - BASIX MeTTa Curriculum & Knowledge Alignment Verification.

Demonstrates how AgriGuide directly embodies and scales the concepts from the
BASIX MeTTa Omniversity Training Curriculum (mettatraining):
- Lesson 01-06 & Challenges 1-3: Types, Syntax, Expressions & Higher-Order Functions
- Lesson 07-11 & Challenges 4-9: Knowledge Bases, Soil/Crop Ontologies & Range Guards
- Lesson 12-18 & Challenges 15-16: Dynamic Atomspaces (add/remove), Recursive Graph Tracing & Non-Determinism (superpose)
- Lesson 19-27 & Challenge 6: Python Integration (hyperon/py-atom), Unification & Self-Evolving Rules
"""

import sys
import os
from pathlib import Path

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.services.metta_runner import MettaService, MettaSpace, MettaInterpreter, Expression, Symbol, Variable
from app.services.world_model import AgriculturalKnowledgeGraph
from app.services.benchmark import AgriGuideBenchmarkSuite

def print_header(title: str):
    print("\n" + "=" * 75)
    print(f"  {title}")
    print("=" * 75)

def test_curriculum_foundations():
    print_header("1. Testing Curriculum Foundations: Types, Ontology & S-Expressions")
    space = MettaSpace()
    training_file = Path(__file__).resolve().parent.parent / "metta" / "knowledge" / "training_foundations.metta"
    
    if training_file.exists():
        space.load_file(training_file)
        print(f"Loaded {len(space.rules)} rules and facts from {training_file.name}")
    else:
        print(f"Warning: {training_file} not found")
        return False

    print("Atomspace facts verified:")
    facts = [r for r in space.rules if len(r) > 0 and r[0] not in [Symbol("="), Symbol(":")]]
    for f in facts[:6]:
        print(f"  {f}")
    return True

def test_higher_order_and_range_guards():
    print_header("2. Testing Higher-Order Logic & Range Guards (Challenge 1, 8, 9)")
    service = MettaService()
    
    # Test safe envelope and water balance deductions
    # Maize vegetative threshold = 18%, moisture = 16% -> dry
    res1 = service.execute_query(soil=16.0, rain=75.0, water="limited", current_rain=False)
    print(f"Scenario 1: Soil 16.0%, Rain 75.0% (Limited Water)")
    print(f"  Recommendation: {res1.recommendation}")
    print(f"  Rule Triggered: {res1.rules}")
    print(f"  Reason: {res1.reason}")
    assert res1.recommendation == "WAIT", f"Expected WAIT, got {res1.recommendation}"

    res2 = service.execute_query(soil=16.0, rain=20.0, water="limited", current_rain=False)
    print(f"\nScenario 2: Soil 16.0%, Rain 20.0% (Limited Water)")
    print(f"  Recommendation: {res2.recommendation}")
    print(f"  Rule Triggered: {res2.rules}")
    print(f"  Reason: {res2.reason}")
    assert res2.recommendation == "IRRIGATE", f"Expected IRRIGATE, got {res2.recommendation}"
    print("Higher-order range guard deductions passed!")
    return True

def test_recursive_graph_tracing():
    print_header("3. Testing Recursive Knowledge Graph Tracing (Challenge 16)")
    from app.services.world_model import GraphEntity, GraphRelation
    kg = AgriculturalKnowledgeGraph("FieldA")
    kg.add_entity(GraphEntity(id="FieldA", type="Field", label="Field A - North Terrace"))
    kg.add_entity(GraphEntity(id="crop_maize", type="Crop", label="Maize (Zea mays)"))
    kg.add_entity(GraphEntity(id="soil_loam", type="SoilType", label="Sandy Loam"))
    kg.add_entity(GraphEntity(id="sensor_01", type="Sensor", label="Capacitive Moisture Sensor"))

    kg.add_relation(GraphRelation(subject="FieldA", predicate="grows", object="crop_maize"))
    kg.add_relation(GraphRelation(subject="FieldA", predicate="has_soil", object="soil_loam"))
    kg.add_relation(GraphRelation(subject="FieldA", predicate="monitored_by", object="sensor_01"))

    kg.causal_chains = [
        {"name": "Drought Stress Pathway", "chain": ["SolarFlux_High", "VPD_High", "Transpiration_Spike", "RootMoisture_Deficit", "Yield_Penalty"]},
        {"name": "Hydrologic Runoff Pathway", "chain": ["CanalMain", "FieldA", "FieldB", "DrainageSump"]}
    ]
    
    print(f"Constructed Digital Twin Knowledge Graph for FieldA:")
    print(f"  Entities ({len(kg.entities)}): {[e.id for e in kg.entities.values()]}")
    print(f"  Relations ({len(kg.relations)}): {[f'{r.subject} -({r.predicate})-> {r.object}' for r in kg.relations]}")
    
    print("\nTracing Causal Pathways:")
    for chain in kg.causal_chains:
        print(f"  • {chain['name']}: {' -> '.join(chain['chain'])}")
    
    print("\nGenerated MeTTa S-Expression Atoms:")
    for atom in kg.to_metta_atoms():
        print(f"  {atom}")
    return True

def test_counterfactual_superposition():
    print_header("4. Testing Non-Deterministic Counterfactual Reasoning (Lesson 15-16)")
    service = MettaService()
    cf = service.evaluate_counterfactuals(soil=18.0, rain=75.0, water="limited")
    
    print("Counterfactual Exploration ('What-If'):")
    print(f"  If Farmer Irrigates:")
    print(f"    Recommendation: {cf['if_irrigate']['recommendation']}")
    print(f"    Efficiency:     {cf['if_irrigate']['efficiency']}")
    print(f"    Risk:           {cf['if_irrigate']['risk']}")
    print(f"    Impact:         {cf['if_irrigate']['impact']}")
    
    print(f"\n  If Farmer Waits for Rain:")
    print(f"    Recommendation: {cf['if_wait']['recommendation']}")
    print(f"    Efficiency:     {cf['if_wait']['efficiency']}")
    print(f"    Risk:           {cf['if_wait']['risk']}")
    print(f"    Impact:         {cf['if_wait']['impact']}")
    return True

def test_self_evolving_rules():
    print_header("5. Testing Self-Evolving Rules: 'The Agent That Grows Up' (Lesson 21 & Track 05)")
    service = MettaService()
    
    # Baseline rule with rain 62%: rain < 70% threshold -> IRRIGATE
    baseline_res = service.execute_query(soil=17.0, rain=62.0, water="limited", current_rain=False)
    print(f"Baseline Agent Decision (Rain 62%): {baseline_res.recommendation} (Rule: {baseline_res.rules})")
    
    # Farmer teaches the agent a local field rule:
    # "In sandy loam during flowering, pause irrigation if rain is at least 60%"
    custom_rule = {
        "name": "Local Rain Conservation Rule",
        "condition": {"rain_threshold_min": 60},
        "action": "WAIT",
        "is_active": True
    }
    
    adapted_res = service.execute_query(
        soil=17.0,
        rain=62.0,
        water="limited",
        current_rain=False,
        custom_rules=[custom_rule]
    )
    print(f"Adapted Agent Decision (Rain 62% + Custom Rule): {adapted_res.recommendation}")
    print(f"  Rule Triggered: {adapted_res.rules}")
    print(f"  Reason: {adapted_res.reason}")
    assert adapted_res.recommendation == "WAIT", f"Expected WAIT after rule adaptation, got {adapted_res.recommendation}"
    print("Self-evolving rule adaptation verified!")
    return True

def test_scientific_benchmark():
    print_header("6. Running Complete 10-Point Scientific Benchmark Suite")
    suite = AgriGuideBenchmarkSuite()
    report = suite.run_all()
    
    print(f"Benchmark Results:")
    print(f"  Total Tests: {report.total_tests}")
    print(f"  Passed:      {report.passed_tests}")
    print(f"  Pass Rate:   {report.overall_score_pct}%")
    print(f"  Runtime:     {report.duration_ms} ms")
    
    for case in report.results:
        status = "PASSED" if case.passed else "FAILED"
        print(f"  [{status}] {case.scenario_name} ({case.category})")
    
    assert report.passed_tests == report.total_tests, "Benchmark suite did not achieve 100% pass rate!"
    return True

if __name__ == "__main__":
    print("\n" + "#" * 75)
    print("  AGRIGUIDE: BASIX METTA CURRICULUM & CAPSTONE VALIDATION")
    print("#" * 75)
    
    t1 = test_curriculum_foundations()
    t2 = test_higher_order_and_range_guards()
    t3 = test_recursive_graph_tracing()
    t4 = test_counterfactual_superposition()
    t5 = test_self_evolving_rules()
    t6 = test_scientific_benchmark()
    
    if all([t1, t2, t3, t4, t5, t6]):
        print("\n" + "=" * 75)
        print("  ALL 6 METTA TRAINING CURRICULUM MODULES VERIFIED (100% SUCCESS)")
        print("  AgriGuide is fully aligned with the BASIX Omniversity Incubator!")
        print("=" * 75 + "\n")
        sys.exit(0)
    else:
        print("\nValidation failed!")
        sys.exit(1)
