#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  AgriGuide Comprehensive Full-Stack Verification"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "1. Checking MeTTa Curriculum Foundations..."
python3 scripts/verify_metta_curriculum.py

echo "2. Running Backend Unit & Domain Tests..."
pytest backend/tests/ -q

echo "3. Running End-to-End Security & Replay Suite..."
python3 scripts/test_end_to_end_security.py

echo "4. Verifying Frontend Production Build..."
cd frontend
npm run build
cd "$PROJECT_ROOT"

echo "=========================================================="
echo "  ALL VERIFICATION CHECKS PASSED (100% OPERATIONAL)"
echo "=========================================================="
