#!/usr/bin/env python3
"""Export AgriGuide system benchmark and verification metrics to JSON and Markdown."""

import json
from pathlib import Path
from app.services.benchmark import benchmark_suite
from app.services.domain_reasoners import MultiDomainAgriculturalEngine


def main():
    root = Path(__file__).resolve().parent.parent
    reports_dir = root / "reports"
    reports_dir.mkdir(exist_ok=True)

    # 1. Run simulation benchmark
    benchmark_results = benchmark_suite.run_all()
    passed = sum(1 for r in benchmark_results if r.passed)
    total = len(benchmark_results)
    score_pct = (passed / total) * 100.0 if total > 0 else 0.0

    metrics = {
        "benchmark": {
            "total_tests": total,
            "passed_tests": passed,
            "score_pct": score_pct,
            "cases": [
                {
                    "id": r.case_id,
                    "name": r.name,
                    "passed": r.passed,
                    "expected": r.expected_recommendation,
                    "actual": r.actual_recommendation,
                    "confidence": r.confidence,
                }
                for r in benchmark_results
            ]
        }
    }

    # Save JSON report
    with open(reports_dir / "benchmark_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    # Save Markdown report
    with open(reports_dir / "benchmark_summary.md", "w") as f:
        f.write("# AgriGuide Benchmark & Verification Report\n\n")
        f.write(f"- **Total Benchmark Scenarios**: {total}\n")
        f.write(f"- **Passed**: {passed}\n")
        f.write(f"- **Pass Rate**: {score_pct:.1f}%\n\n")
        f.write("| Case ID | Name | Expected | Actual | Confidence | Status |\n")
        f.write("| :--- | :--- | :---: | :---: | :---: | :---: |\n")
        for r in benchmark_results:
            status = "✅ PASS" if r.passed else "❌ FAIL"
            f.write(f"| `{r.case_id}` | {r.name} | `{r.expected_recommendation}` | `{r.actual_recommendation}` | {r.confidence:.2f} | {status} |\n")

    print(f"Metrics successfully exported to {reports_dir}")


if __name__ == "__main__":
    main()
