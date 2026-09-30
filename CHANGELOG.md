# AgriGuide Changelog

All notable changes to the AgriGuide platform are documented in this file.

## [1.0.0] - 2026-10-01 (BASIX MeTTa Omniversity Hackathon Release)

### Added
- **Symbolic Hyperon MeTTa Engine**:
  - Implemented 3-tier execution: Native OpenCog Hyperon bindings, CLI binary runner, and pure embedded S-expression fallback.
  - Implemented 6 core curriculum modules including higher-order types, pattern matching, dynamic AtomSpace modification, and non-deterministic superposition (`superpose`).
- **SingularityNET ASI Cloud Multi-Model Integration**:
  - Supported dynamic model switching across 5 cloud models (`minimax/minimax-m3`, `asi1-mini`, `google/gemma-3-27b-it`, `meta-llama/llama-3.3-70b-instruct`, `qwen/qwen3-32b`).
  - Implemented `ModelTaskRouter` for intelligent workload dispatching.
- **Multi-Domain Agricultural Decision Suite**:
  - Simultaneous evaluation of Irrigation, Planting, Fertilization, Crop Health, Weather Hazards, and Harvest.
- **Physical Agronomic ML & Sensor Anomaly Engine**:
  - FAO-56 Penman-Monteith reference evapotranspiration ($ET_0$) and crop water demand ($ET_c$).
  - Soil moisture depletion forecasting for 24h and 48h horizons.
  - Multi-vector sensor anomaly detection for bounds violations, sudden delta spikes, and stuck flatlines.
- **Deterministic Safety Policy Layer**:
  - Physical actuation limits: duration clamping (30 min ceiling), imminent precipitation lockout ($\ge 80\%$), and wind speed threshold ($>35\text{ km/h}$).
- **Reproducible Decision Replay Engine**:
  - Cryptographic verification certificates ensuring 100% deterministic reproducibility of historical decisions.
- **Scientific Simulation Benchmark Suite**:
  - 10-point test suite achieving 100% pass rate in sub-25 ms native execution.
- **Interactive Web Interface**:
  - React + TypeScript + Vite dashboard with 10 operational views, responsive mobile layout, and 70 kB gzipped bundle.
- **Security & Hardening**:
  - Zero-credential leakage across API endpoints and client bundles.
  - SQL injection parameterization and XSS sanitization.
