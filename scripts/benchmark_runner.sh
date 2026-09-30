#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  AgriGuide 10-Point Scientific Benchmark Runner"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Ensure dependencies are available
python3 -c "
import requests
import json

res = requests.post('http://127.0.0.1:8000/api/benchmark/run')
if res.status_code == 200:
    data = res.json()
    print('Benchmark Status: OK')
    print(f'Total Tests:      {data[\"total_tests\"]}')
    print(f'Passed Tests:     {data[\"passed_tests\"]}')
    print(f'Pass Rate:        {data[\"overall_score_pct\"]}%')
    print(f'Duration:         {data[\"duration_ms\"]} ms')
else:
    print('Falling back to local in-process benchmark...')
    from app.services.benchmark import benchmark_suite
    results = benchmark_suite.run_all()
    passed = sum(1 for r in results if r.passed)
    print(f'Results: {passed}/{len(results)} passed.')
"
echo "=========================================================="
