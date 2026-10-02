# Agronomist Field Guide: FAO-56 Crop Coefficient Calibration

## Overview
This guide instructs agricultural extension officers on how to fine-tune crop coefficient ($K_c$) curves in AgriGuide for local heirloom varieties and specialized cultivars.

## Crop Growth Stages and Standard $K_c$ Values

| Crop | Initial Stage ($K_{c,\text{ini}}$) | Mid-Season ($K_{c,\text{mid}}$) | Late Season ($K_{c,\text{late}}$) |
| :--- | :--- | :--- | :--- |
| Maize / Corn | 0.30 - 0.50 | 1.15 - 1.25 | 0.50 - 0.65 |
| French Beans | 0.40 - 0.55 | 1.05 - 1.15 | 0.85 - 0.95 |
| Tomatoes | 0.40 - 0.60 | 1.10 - 1.20 | 0.70 - 0.80 |
| Cabbage | 0.45 - 0.55 | 1.00 - 1.10 | 0.90 - 0.95 |
| Potatoes | 0.45 - 0.55 | 1.10 - 1.20 | 0.70 - 0.80 |

## Adjusting for High Vapor Pressure Deficit
When relative humidity falls below 20% and wind speeds exceed 3 m/s in arid zones (e.g., Machakos or Garissa), $K_{c,\text{mid}}$ should be increased by 0.05 to compensate for enhanced boundary-layer transpiration:

$$K_{c,\text{mid(adj)}} = K_{c,\text{mid}} + [0.04(u_2 - 2) - 0.004(RH_{\min} - 45)] \left(\frac{h}{3}\right)^{0.3}$$
