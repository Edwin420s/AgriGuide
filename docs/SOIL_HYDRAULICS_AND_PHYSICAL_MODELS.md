# Soil Hydraulics and Physical Infiltration Models

This document outlines the agronomic soil hydraulic foundations utilized within the AgriGuide platform to determine available water capacity (AWC), matric potential thresholds, and root-zone water balance dynamics.

---

## 1. Soil Hydraulic Classification

AgriGuide classifies East African soils into four standard hydraulic profiles, calibrated from KALRO (Kenya Agricultural and Livestock Research Organization) soil survey data:

| Soil Texture Class | Field Capacity (FC % vol) | Permanent Wilting Point (PWP % vol) | Available Water Capacity (AWC mm/m) | Saturated Hydraulic Conductivity (Ksat mm/h) |
| :--- | :--- | :--- | :--- | :--- |
| **Sand** | 10.0% | 4.0% | 60 mm/m | 50.0 mm/h |
| **Sandy Loam** | 18.0% | 8.0% | 100 mm/m | 25.0 mm/h |
| **Loam** | 28.0% | 13.0% | 150 mm/m | 13.0 mm/h |
| **Clay (Black Cotton / Vertisol)** | 40.0% | 22.0% | 180 mm/m | 2.5 mm/h |

---

## 2. Soil Water Retention Curves (van Genuchten Formulation)

Soil matric potential is modeled via the closed-form van Genuchten equation relating volumetric moisture theta to suction head h (cm):

```text
Theta(h) = Theta_r + (Theta_s - Theta_r) / [1 + (alpha * |h|)^n]^m
```

Where:
- `Theta_s`: Saturated water content
- `Theta_r`: Residual water content
- `alpha`: Inverse of the air entry suction head (cm^-1)
- `n`: Pore size distribution index
- `m = 1 - (1 / n)`

For East African volcanic red loam (Nitisols), parameters are parameterized as:
- `Theta_s`: 0.44
- `Theta_r`: 0.08
- `alpha`: 0.015 cm^-1
- `n`: 1.35

---

## 3. Depletion Factor (p) and Readily Available Water (RAW)

Total Available Water (TAW) in the root zone is calculated as:

```text
TAW = 1000 * (FC - PWP) * Zr
```

Where `Zr` is rooting depth in meters.

Readily Available Water (RAW) represents the fraction of TAW that crops can extract without experiencing water stress:

```text
RAW = p * TAW
```

Typical depletion fractions `p` utilized in AgriGuide:
- Maize (Flowering): `p = 0.50`
- Tomatoes (Fruiting): `p = 0.40`
- French Beans: `p = 0.45`
- Irish Potatoes: `p = 0.35` (shallow-rooted, highly sensitive to moisture stress)
