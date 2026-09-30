.PHONY: install backend frontend seed test run
install:
	python3 -m venv .venv && . .venv/bin/activate && pip install -r backend/requirements.txt
backend:
	cd backend && python3 -m uvicorn app.main:app --reload --port 8000
frontend:
	cd frontend && npm install && npm run dev
seed:
	python3 scripts/seed_demo.py

test:
	cd backend && python3 -m pytest -q
run:
	python3 scripts/seed_demo.py || true
