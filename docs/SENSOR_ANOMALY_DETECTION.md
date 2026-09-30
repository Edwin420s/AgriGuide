# Multi-Vector Sensor Anomaly Detection Specification

## Overview
Field sensors frequently degrade, short-circuit, or flatline due to exposure to moisture, animal interference, or battery decay. AgriGuide includes a dedicated `SensorAnomalyDetector` that screens all incoming telemetry before it can corrupt the world state.

## Detection Vectors

### 1. Out-of-Bounds Physical Validation
- **Soil Moisture**: Valid domain is $0.0\% \le \theta \le 100.0\%$. Values outside this range immediately trigger `OUT_OF_BOUNDS` (Severity: `CRITICAL`), applying a $0.60$ confidence penalty and clamping to historical median.

### 2. Sudden Unphysical Leap (Delta Spike)
- Telemetry leaps $> 25.0\%$ between consecutive readings without verified intervening precipitation trigger `SUDDEN_SPIKE` (Severity: `HIGH`).
- Example: jumping from $18\%$ to $55\%$ in 15 minutes during clear skies.

### 3. Frozen Flatline (Stuck Sensor)
- A sensor returning identical values over 5 or more consecutive sampling intervals (variance $\sigma < 0.02$) triggers `STUCK_SENSOR` (Severity: `HIGH`).
- Distinguishes between real field conditions and hardware ADC lockups.

## Penalization Pipeline
When an anomaly is flagged:
1. The evidence item is marked with an anomaly flag.
2. The `confidence_penalty` is subtracted from the source reliability score.
3. The reasoning engine falls back to regional weather forecasts or secondary sensors.
