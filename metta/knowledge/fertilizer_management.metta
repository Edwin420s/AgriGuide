;; ============================================================================
;; AgriGuide - Fertilizer & Nutrient Management Knowledge Base (MeTTa)
;; Rules for Nitrogen leaching risk, top-dressing windows, and foliar feeding
;; ============================================================================

(: FertilizerType Type)
(: basal_dap FertilizerType)
(: top_dress_can FertilizerType)
(: urea FertilizerType)
(: npk_17_17_17 FertilizerType)
(: foliar_booster FertilizerType)

;; Leaching risk determination based on forecast rainfall intensity (mm)
(: evaluate_leaching_risk (-> Number Number Symbol))
(= (evaluate_leaching_risk $rain_mm $soil_sand_pct)
   (if (> $rain_mm 35.0)
       HIGH_LEACHING_RISK
       (if (and (> $rain_mm 15.0) (> $soil_sand_pct 60.0))
           MODERATE_LEACHING_RISK
           SAFE_FOR_APPLICATION)))

;; Top-dressing eligibility for maize based on growth stage
(: is_eligible_for_top_dressing (-> Symbol Symbol Bool))
(= (is_eligible_for_top_dressing maize vegetative) True)
(= (is_eligible_for_top_dressing maize knee_high) True)
(= (is_eligible_for_top_dressing maize flowering) False)
(= (is_eligible_for_top_dressing maize maturity) False)

;; Recommendation rule: Halt nitrogen top-dressing if heavy downpour is imminent
(: fertilizer_recommendation (-> Symbol Symbol Number Symbol))
(= (fertilizer_recommendation $crop $stage $forecast_rain_mm)
   (if (> $forecast_rain_mm 25.0)
       DELAY_FERTILIZER
       (if (is_eligible_for_top_dressing $crop $stage)
           APPLY_TOP_DRESS
           MONITOR_NUTRIENTS)))
