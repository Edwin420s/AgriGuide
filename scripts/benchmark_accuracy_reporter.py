#!/usr/bin/env python3
"""Scientific Accuracy and Latency Reporting CLI for AgriGuide.

Executes the 10-point benchmark suite and outputs performance metrics,
pass rates, and execution latency percentiles.
"""

import sys
import time
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.benchmark import AgriGuideBenchmarkSuite

def main():
    print("==========================================================")
    print("  AgriGuide Scientific Accuracy & Latency Reporter")
    print("==========================================================")
    
    suite = AgriGuideBenchmarkSuite()
    latencies_ms = []
    
    # Run 5 iterations to compute stable statistics
    all_passed = True
    iterations = 5
    for i in range(iterations):
        t0 = time.perf_counter()
        scorecard = suite.run_all()
        t1 = time.perf_counter()
        latencies_ms.append((t1 - t0) * 1000)
        if scorecard.passed_tests != scorecard.total_tests:
            all_passed = False

    avg_latency = sum(latencies_ms) / len(latencies_ms)
    min_latency = min(latencies_ms)
    max_latency = max(latencies_ms)
    
    print(f"Total Benchmark Cases Evaluated: {scorecard.total_tests}")
    print(f"Passing Cases:                   {scorecard.passed_tests}")
    print(f"Scientific Pass Rate:            {scorecard.overall_score_pct}%")
    print("----------------------------------------------------------")
    print(f"Benchmark Latency (Avg):         {avg_latency:.2f} ms")
    print(f"Benchmark Latency (Min):         {min_latency:.2f} ms")
    print(f"Benchmark Latency (Max):         {max_latency:.2f} ms")
    print("==========================================================")
    
    if all_passed:
        print("[SUCCESS] 100% Benchmark Verification Passed")
        sys.exit(0)
    else:
        print("[FAIL] Benchmark Divergence Detected")
        sys.exit(1)

if __name__ == "__main__":
    main()
