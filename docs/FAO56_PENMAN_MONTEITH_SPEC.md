# FAO-56 Penman-Monteith Reference Evapotranspiration Specification

## Overview
AgriGuide integrates the standard United Nations Food and Agriculture Organization (FAO) Paper No. 56 Penman-Monteith equation to derive daily reference evapotranspiration (ET0) from physical meteorological telemetry.

## Governing Equation

$$ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \frac{900}{T + 273} u_2 (e_s - e_a)}{\Delta + \gamma (1 + 0.34 u_2)}$$

### Parameters
- $ET_0$: Reference evapotranspiration [mm / day].
- $R_n$: Net radiation at the crop surface [MJ / m^2 / day].
- $G$: Soil heat flux density [MJ / m^2 / day] (approximated as 0 for daily intervals).
- $T$: Mean daily air temperature at 2m height [degrees Celsius].
- $u_2$: Wind speed at 2m height [m / s].
- $e_s$: Saturation vapor pressure [kPa].
- $e_a$: Actual vapor pressure [kPa].
- $e_s - e_a$: Vapor pressure deficit [kPa].
- $\Delta$: Slope vapor pressure curve [kPa / degrees Celsius].
- $\gamma$: Psychrometric constant [kPa / degrees Celsius].

## Crop Evapotranspiration (ETc)
Actual crop water consumption is determined by scaling reference evapotranspiration by the crop coefficient ($K_c$):

$$ET_c = K_c \times ET_0$$

### Default Crop Coefficients
- Maize (Vegetative): 0.70
- Maize (Flowering / Tasseling): 1.20
- Maize (Maturity / Dry Down): 0.60
- French Beans (Vegetative): 0.50
- French Beans (Pod Formation): 1.05
- Tomatoes (Fruiting): 1.15
