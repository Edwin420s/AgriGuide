# Parametric Index Insurance Oracle Specification

This document details the deterministic telemetry oracle specifications utilized by micro-insurance partners to settle drought and excess-rainfall claims automatically.

---

## 1. Problem with Traditional Crop Insurance

Traditional smallholder crop insurance in Sub-Saharan Africa suffers from:
- Prohibitive loss adjustment costs (inspecting individual remote 0.5-hectare farms).
- Prolonged claim settlement times (often taking 6 to 12 months after harvest).
- Moral hazard and adverse selection disputes.

---

## 2. AgriGuide Parametric Oracle Design

AgriGuide functions as a tamper-evident decentralized oracle converting multi-source sensor and satellite observations into objective parametric triggers.

### 2.1 Drought Index Trigger Parameters
- **Metric**: Root-zone volumetric soil moisture at 20 cm depth.
- **Critical Threshold**: <= 16.0% volumetric moisture.
- **Trigger Window**: 5 consecutive days below critical threshold during sensitive growth stages (e.g. flowering/tasseling).
- **Settlement Action**: Immediate payout triggered to farmer mobile money (M-Pesa) account within 24 hours of window satisfaction.

### 2.2 Excess Rainfall / Flood Trigger Parameters
- **Metric**: Cumulative 48-hour precipitation.
- **Critical Threshold**: >= 120 mm cumulative rainfall resulting in prolonged soil saturation (> 95% pore space) for > 72 hours.
- **Settlement Action**: Payout triggered for waterlogging and root rot compensation.

---

## 3. Cryptographic Non-Repudiation

Every parametric evaluation generates a signed decision certificate containing:
1. `sha256_evidence_root`: Merkle root of raw sensor and satellite records.
2. `metta_rule_id`: Immutable identifier of the executed rule.
3. `timestamp_utc`: ISO 8601 UTC timestamp.
4. `ed25519_signature`: Digital signature of the oracle node.
