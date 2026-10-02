# Valve Safety and Actuation Policies

This specification defines the physical, mechanical, and logical safeguards enforced between cognitive advisory outputs and physical field actuators (solenoids, ball valves, booster pumps, drip lines).

---

## 1. Architectural Separation

AgriGuide strictly decouples decision reasoning from physical actuation through a three-stage pipeline:

```text
[Cognitive MeTTa Engine] 
         │ (Advisory Output: IRRIGATE 45m)
         ▼
[Deterministic Policy Gatekeeper] 
         │ (Clamps duration to 30m, verifies rain < 80%, wind < 35 km/h)
         ▼
[Hardware Actuation Interface] 
         │ (Cryptographically signed actuation command)
         ▼
[Solenoid / Pump Controller]
```

---

## 2. Mandatory Guardrail Constraints

### 2.1 Duration Ceiling Clamping
- Maximum single continuous irrigation cycle: **30 minutes**.
- Minimum dwell time between cycles on the same zone: **45 minutes** (allows soil percolation and prevents surface ponding).
- Daily cumulative quota cap: Dependent on water permit allocation (typically <= 6.0 mm/day equivalent).

### 2.2 Environmental Lockouts
1. **Precipitation Lockout**: If rain probability for the next 24 hours >= 80% or current precipitation is reported, valve actuation is strictly blocked.
2. **Wind Velocity Lockout**: If ambient wind speed exceeds 35 km/h, overhead and sprinkler actuation is suppressed to prevent drift and evaporative loss.
3. **Depletion Lockout**: If farm water reserves or borehole levels fall below minimum emergency operational reserves, valves are locked shut.

---

## 3. Hardware Fail-Safe Specifications

- **Default State**: Normally Closed (NC) spring-return solenoid valves. In the event of grid power failure or edge micro-controller brownout, valves automatically revert to closed.
- **Hardware Watchdog**: Solenoid driver boards require periodic heartbeat pulses every 60 seconds from the edge daemon. If no heartbeat is received within 120 seconds, hardware watchdogs kill relay power automatically.
- **Water Hammer Mitigation**: Actuation sequences enforce a 4-second soft-close ramp to prevent hydraulic shockwaves through PVC and HDPE distribution mains.
