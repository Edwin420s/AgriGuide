; ====================================================================
; AgriGuide Multi-Domain Reasoning: reasoning.metta
; Pure symbolic backward-chaining and rewrite rules across agriculture
; ====================================================================

; --- 1. IRRIGATION DOMAIN ---
(= (irrigate-rule-check $soil $rain $water $cur-rain $stage)
   (if $cur-rain
       (DECISION WAIT R-CURRENT-RAIN 0.95 "Rain is currently falling; irrigation is prohibited to prevent waterlogging.")
       (if (and (< $soil 18) (>= $rain 70) (== $water limited))
           (DECISION WAIT R-HIGH-RAIN-WATER-CONSERVATION 0.88 "Imminent heavy rainfall expected with limited water reserves; conserve water and await rain.")
           (if (and (< $soil 20) (< $rain 35) (not (== $water unavailable)))
               (if (or (== $stage flowering) (== $stage tasseling))
                   (DECISION IRRIGATE R-CRITICAL-STAGE-DEFICIT 0.94 "Soil moisture is below threshold during critical reproductive stage; immediate irrigation required.")
                   (DECISION IRRIGATE R-LOW-MOISTURE-LOW-RAIN 0.90 "Soil moisture is depleted and rain probability is low; irrigate field."))
               (if (and (< $soil 18) (== $water unavailable))
                   (DECISION RATION R-WATER-UNAVAILABLE 0.85 "Moisture is low but water reserves are exhausted; emergency conservation mode active.")
                   (if (and (>= $soil 25) (>= $rain 50))
                       (DECISION WAIT R-ADEQUATE-MOISTURE 0.91 "Soil moisture is currently optimal and rainfall is expected; do not irrigate.")
                       (DECISION REASSESS R-UNCERTAIN-OR-BALANCED 0.65 "Telemetry indicates balanced moisture and weather indicators; monitor field and reassess.")))))))

; --- 2. PLANTING WINDOW DOMAIN ---
(= (planting-rule-check $soil $temp $forecast-rain $season-onset)
   (if (not $season-onset)
       (DECISION DELAY_PLANTING R-SEASON-NOT-OPEN 0.92 "Official agricultural season onset criteria not yet satisfied.")
       (if (< $soil 18)
           (DECISION DELAY_PLANTING R-SEEDBED-TOO-DRY 0.89 "Seedbed soil moisture is below minimum germination threshold (18%).")
           (if (> $temp 35)
               (DECISION DELAY_PLANTING R-HEAT-STRESS-EMERGENCE 0.86 "Soil surface temperature exceeds safe germination limits.")
               (if (and (>= $soil 20) (>= $forecast-rain 40) (<= $temp 32))
                   (DECISION PLANT R-OPTIMAL-PLANTING-WINDOW 0.95 "Soil moisture, temperature, and 7-day rainfall outlook are optimal for planting.")
                   (DECISION MONITOR R-MARGINAL-PLANTING-CONDITIONS 0.70 "Conditions are marginal; wait for subsequent rainfall window."))))))

; --- 3. FERTILIZATION DOMAIN ---
(= (fertilization-rule-check $stage $soil $rain-24h $wind)
   (if (>= $rain-24h 70)
       (DECISION DELAY_FERTILIZER R-NITROGEN-LEACHING-RISK 0.94 "High impending rainfall (>70%) risks immediate nitrate leaching and runoff.")
       (if (> $wind 25)
           (DECISION DELAY_FERTILIZER R-WIND-DRIFT-HAZARD 0.90 "High wind speed exceeds safe broadcast limits.")
           (if (< $soil 14)
               (DECISION DELAY_FERTILIZER R-SOIL-TOO-DRY-FOR-UPTAKE 0.88 "Soil moisture too low for chemical dissolution and root uptake.")
               (if (and (or (== $stage vegetative) (== $stage flowering)) (>= $soil 18) (< $rain-24h 40))
                   (DECISION APPLY_FERTILIZER R-OPTIMAL-SIDE-DRESSING 0.92 "Crop stage demands nutrients, soil moisture is adequate, and leaching risk is low.")
                   (DECISION MONITOR R-SUBOPTIMAL-FERTILIZATION 0.72 "Conditions are neutral; postpone application."))))))

; --- 4. CROP HEALTH & STRESS DOMAIN ---
(= (crop-health-check $dry-days $max-temp $leaf-anomaly)
   (if (and (>= $dry-days 7) (>= $max-temp 32))
       (HEALTH_ALERT SEVERE_WATER_STRESS R-PROLONGED-DROUGHT-HEAT 0.93 "Crop exhibits severe thermal and moisture stress symptoms.")
       (if $leaf-anomaly
           (HEALTH_ALERT PATHOGEN_OR_DEFICIENCY_DETECTED R-CANOPY-ANOMALY 0.85 "Canopy optical sensors or farmer images indicate localized anomaly.")
           (if (>= $dry-days 4)
               (HEALTH_ALERT MILD_MOISTURE_DEFICIT R-EARLY-WILTING-WATCH 0.78 "Field has experienced 4 consecutive dry days; watch for wilting.")
               (HEALTH_STATUS NORMAL R-CROP-VIGOR-GOOD 0.92 "Crop vigor indices are within healthy parameters.")))))

; --- 5. WEATHER RISK DOMAIN ---
(= (weather-risk-check $rain-prob $wind-gusts $consecutive-dry-days)
   (if (and (>= $rain-prob 85) (>= $wind-gusts 45))
       (RISK_ALERT SEVERE_STORM_LODGING_RISK R-STORM-WATCH 0.94 "Severe weather system incoming; secure infrastructure and delay field activities.")
       (if (>= $consecutive-dry-days 14)
           (RISK_ALERT DROUGHT_HAZARD R-DROUGHT-WATCH 0.90 "14+ days without precipitation; initiate dry-spell mitigation.")
           (RISK_STATUS LOW_RISK R-WEATHER-NOMINAL 0.85 "No high-severity weather hazards forecast."))))

; --- 6. HARVEST READINESS DOMAIN ---
(= (harvest-rule-check $days-since-planting $maturity-days $rain-3day-prob $grain-moisture)
   (if (< $days-since-planting $maturity-days)
       (DECISION DELAY_HARVEST R-PHYSIOLOGICAL-IMMATURE 0.95 "Crop has not reached physiological maturity.")
       (if (>= $rain-3day-prob 60)
           (DECISION DELAY_HARVEST R-AWAIT-DRY-HARVEST-WINDOW 0.89 "Imminent rainfall creates high mold and post-harvest rot risk; delay harvest.")
           (if (and (>= $days-since-planting $maturity-days) (<= $grain-moisture 15) (< $rain-3day-prob 30))
               (DECISION HARVEST R-OPTIMAL-HARVEST-WINDOW 0.96 "Crop is physiologically mature, grain moisture is safe (<15%), and weather is dry.")
               (DECISION MONITOR R-DRYING-IN-PROGRESS 0.75 "Crop mature but awaiting further in-field desiccation.")))))
