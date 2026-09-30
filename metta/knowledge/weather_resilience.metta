;; ============================================================================
;; AgriGuide - Extreme Weather Resilience & Mitigation Knowledge Base (MeTTa)
;; Rules for frost alerts, extreme heat shock, gale-force wind, and flood risks
;; ============================================================================

(: WeatherHazard Type)
(: frost_hazard WeatherHazard)
(: heat_shock WeatherHazard)
(: gale_wind WeatherHazard)
(: waterlogging WeatherHazard)
(: nominal_conditions WeatherHazard)

;; Temperature hazard evaluation
(: evaluate_thermal_hazard (-> Number Symbol))
(= (evaluate_thermal_hazard $tmin)
   (if (<= $tmin 2.0)
       FROST_WARNING
       (if (<= $tmin 6.0)
           CHILL_ADVISORY
           THERMAL_SAFE)))

;; Extreme wind velocity hazard
(: evaluate_wind_hazard (-> Number Symbol))
(= (evaluate_wind_hazard $wind_kmh)
   (if (>= $wind_kmh 45.0)
       LODGING_RISK_GALE
       (if (>= $wind_kmh 30.0)
           DRIFT_HAZARD_HALT_SPRAYING
           WIND_NOMINAL)))

;; Flood and waterlogging saturation index
(: evaluate_waterlogging_hazard (-> Number Number Symbol))
(= (evaluate_waterlogging_hazard $current_moisture $forecast_rain_mm)
   (if (and (>= $current_moisture 38.0) (>= $forecast_rain_mm 50.0))
       WATERLOGGING_ANAEROBIC_RISK
       HYDROLOGIC_SAFE))

;; Resilience mitigation advisory
(: recommend_resilience_action (-> Symbol Symbol))
(= (recommend_resilience_action FROST_WARNING) APPLY_PROTECTIVE_SMOKE_OR_LIGHT_SPRINKLER)
(= (recommend_resilience_action LODGING_RISK_GALE) STAKE_TALL_CROPS_AND_HALT_ELEVATED_OPS)
(= (recommend_resilience_action WATERLOGGING_ANAEROBIC_RISK) EXCAV_DRAINAGE_FURROWS_IMMEDIATELY)
