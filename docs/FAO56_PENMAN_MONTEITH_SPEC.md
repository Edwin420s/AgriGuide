# FAO-56 Penman-Monteith Evapotranspiration Specification

## Overview
AgriGuide integrates physical agronomic equations based on the FAO Irrigation and Drainage Paper No. 56 (*Crop Evapotranspiration - Guidelines for computing crop water requirements*).

## Reference Evapotranspiration ($ET_0$)
The simplified Hargreaves-Samani formulation is used to calculate reference evapotranspiration based on ambient temperature, atmospheric humidity, and wind speed:

$$ET_0 = 2.8 + \max(0, (T_{mean} - 10) \times 0.15) + \max(0, (100 - RH) \times 0.02) + \frac{u_2}{10} \times 0.4$$

Where:
- $T_{mean}$: Mean diurnal temperature (°C)
- $RH$: Relative humidity (%)
- $u_2$: Wind velocity at 2m height (km/h)

## Crop Evapotranspiration ($ET_c$)
Crop water demand accounts for phenological development using stage-specific crop coefficients ($K_c$):

$$ET_c = K_c \times ET_0$$

### Crop Coefficient Table ($K_c$)

| Crop | Initial Stage | Vegetative Stage | Flowering / Mid-Season | Maturity / Late Season |
| :--- | :---: | :---: | :---: | :---: |
| Maize | 0.40 | 0.80 | **1.20** | 0.60 |
| Tomato | 0.60 | 0.85 | **1.15** | 0.80 |
| Common Bean | 0.40 | 0.70 | **1.10** | 0.35 |

## Root-Zone Depletion Forecasting
Soil moisture depletion over 24-hour and 48-hour horizons is projected using soil texture retention multipliers:
- **Sandy Loam**: High drainage multiplier (1.4×)
- **Loam**: Baseline retention (1.0×)
- **Clay**: High capillary water retention (0.7×)
