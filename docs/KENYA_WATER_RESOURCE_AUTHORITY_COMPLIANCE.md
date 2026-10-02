# Kenya Water Resources Authority (WRA) Compliance Architecture

This document specifies how AgriGuide enforces regulatory compliance with Kenya's Water Act 2016 and Water Resources Authority (WRA) abstraction guidelines.

---

## 1. Regulatory Context

Under Section 36 of Kenya's Water Act 2016, any abstraction of surface water or groundwater for commercial or medium-to-large agricultural purposes requires an approved Water Abstraction Permit issued by the Water Resources Authority (WRA).

AgriGuide provides automated compliance monitoring for:
1. **Daily Abstraction Ceilings**: Enforces volumetric cubic meter (m^3) caps calibrated to each farm's permit class (Category A, B, C, or D).
2. **Seasonal Flow Thresholds**: Enforces low-flow river cutoff limits during dry spells (protecting downstream ecosystem reserves).
3. **Telemetry Audit Trails**: Stores immutable, timestamped logs of flow meter readings for WRA quarterly inspections.

---

## 2. Permitted Abstraction Categories

| Category | Daily Permitted Volume | Target Profile | Telemetry Requirement |
| :--- | :--- | :--- | :--- |
| **Category A** | Minor use (< 10 m^3/day) | Subsistence smallholders | Manual / weekly log |
| **Category B** | 10 to 100 m^3/day | Commercial horticulture (1-5 ha) | Daily pulse meter |
| **Category C** | 100 to 1,000 m^3/day | Medium commercial schemes | Real-time edge IoT meter |
| **Category D** | > 1,000 m^3/day | Large tea / sugarcane estates | Dual redundant telemetric telemetry |

---

## 3. Automated Guardrail Policies

In the event of a low-flow warning issued by the regional Basin Water Resources Committee (e.g. Athi, Tana, Lake Victoria North), the AgriGuide policy engine shifts the farm's `water_availability` flag to `LIMITED` or `UNAVAILABLE`.

This immediately triggers:
- Prohibition of non-essential irrigation.
- Priority routing to high-value nursery and flowering stages only.
- Mandatory logging of reason codes for regulatory reporting.
