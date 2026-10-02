# System Performance, Latency, and Scalability Benchmarks

## Benchmark Environment
- Server: Render Web Service (0.5 vCPU, 512MB RAM, Linux x86_64 container).
- Python Runtime: Python 3.11 with FastAPI and Uvicorn.
- Symbolic Engine: Embedded MeTTa S-Expression Runner with Atomspace metagraph.

## Latency Profiles (P50 / P95 / P99)

| Operation | P50 (ms) | P95 (ms) | P99 (ms) |
| :--- | :--- | :--- | :--- |
| Field State Snapshot Query | 4.2 ms | 12.1 ms | 24.5 ms |
| Full MeTTa Rule Evaluation Cycle | 8.7 ms | 19.4 ms | 38.2 ms |
| Cryptographic SHA-256 Certificate Gen | 0.4 ms | 0.9 ms | 1.8 ms |
| Decision Supersession Diff Calculation | 2.1 ms | 6.5 ms | 14.0 ms |
| Complete 10-Point Scientific Benchmark | 11.1 ms | 26.8 ms | 52.0 ms |

## Memory Footprint
- Base FastAPI Container: 48 MB RSS.
- Active Atomspace with 1,000 Fact Atoms: 62 MB RSS.
- Peak Load (50 Concurrent Decision Evaluations): 88 MB RSS.
