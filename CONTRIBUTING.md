# Contributing to AgriGuide

Thank you for your interest in contributing to AgriGuide.

## Guiding Principles
1. Determinism: Agricultural decisions must be grounded in verified MeTTa symbolic rules.
2. Safety: Hard guardrails (maximum duration, valve lockouts) must never be bypassed.
3. Auditability: Any change to reasoning logic must include an updated test case and proof assertion.

## Development Workflow
1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`.
3. Install dependencies: `pip install -r backend/requirements.txt` and `npm --prefix frontend install`.
4. Run the automated test suite: `pytest backend/tests/ -q`.
5. Run the curriculum verification: `python3 scripts/verify_metta_curriculum.py`.
6. Submit a pull request with clear description and test evidence.
