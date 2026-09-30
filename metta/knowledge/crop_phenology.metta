;; ============================================================================
;; AgriGuide - Crop Phenology & Thermal Degree Days (GDD) Knowledge Base
;; Models developmental stages, base temperatures, and water sensitivity
;; ============================================================================

(: CropStage Type)
(: germination CropStage)
(: vegetative CropStage)
(: flowering CropStage)
(: grain_fill CropStage)
(: maturity CropStage)

;; Base temperature (Tbase) below which crop growth ceases (Celsius)
(: base_temp (-> Symbol Number))
(= (base_temp maize) 10.0)
(= (base_temp tomato) 10.0)
(= (base_temp bean) 8.0)
(= (base_temp sorghum) 10.0)
(= (base_temp potato) 6.0)

;; Growing Degree Day (GDD) calculation for a single 24h diurnal cycle
(: calculate_daily_gdd (-> Symbol Number Number Number))
(= (calculate_daily_gdd $crop $tmax $tmin)
   (let* (($tbase (base_temp $crop))
          ($tmean (/ (+ $tmax $tmin) 2.0))
          ($gdd (- $tmean $tbase)))
     (if (< $gdd 0.0) 0.0 $gdd)))

;; Stage water stress sensitivity factor (Ky, FAO-33)
(: yield_response_factor (-> Symbol CropStage Number))
(= (yield_response_factor maize germination) 0.2)
(= (yield_response_factor maize vegetative) 0.4)
(= (yield_response_factor maize flowering) 1.5)  ;; Most critical period!
(= (yield_response_factor maize grain_fill) 0.8)
(= (yield_response_factor maize maturity) 0.2)

;; Priority rule: Flowering under stress demands emergency prioritization
(: requires_emergency_water_protection (-> Symbol CropStage Bool Number Bool))
(= (requires_emergency_water_protection $crop $stage $is_stressed $rain_forecast_mm)
   (and (== $stage flowering)
        $is_stressed
        (< $rain_forecast_mm 5.0)))
