# Sensor Telemetry Ingestion and Anomaly Detection Protocols

## Hardware Architecture
AgriGuide supports direct integration with ESP32 microcontrollers, LoRaWAN gateways, and RS485 soil moisture and electrical conductivity (EC) probes.

## Anomaly Detection Heuristics
Sensory data passes through three deterministic quality filters prior to Atomspace ingestion:

### 1. Physical Boundary Filter
- Permissible Soil Moisture Range: 5.0% to 55.0% volumetric water content (VWC).
- Permissible Soil Temperature: 2.0 degrees C to 45.0 degrees C.
- Permissible Relative Humidity: 10.0% to 100.0%.

### 2. Temporal Leap Anomaly Filter (Delta Clamp)
Unphysical step-function spikes (such as a capacitive moisture reading jumping from 18% to 91% within a 60-second polling interval) indicate sensor hardware short-circuits or liquid contact on unsealed probes:
$$\Delta M = |M_t - M_{t-1}| > 35.0\% \implies \text{REJECT}$$

### 3. Frozen Telemetry Line Filter (Flatline Check)
Sensors stuck at identical floating-point values over consecutive readings indicate ADC lockup or disconnected communication buses:
$$\text{Variance}(M_{t-5} \dots M_t) < 0.001 \implies \text{FLAG STALE}$$
