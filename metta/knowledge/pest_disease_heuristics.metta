;; ============================================================================
;; AgriGuide - Pest & Disease Heuristics Knowledge Base (MeTTa)
;; Diagnostic heuristics for Fall Armyworm, Early Blight, and Aphid vectors
;; ============================================================================

(: PestThreat Type)
(: fall_armyworm PestThreat)
(: aphids PestThreat)
(: stalk_borer PestThreat)
(: early_blight PestThreat)
(: powdery_mildew PestThreat)

;; Environmental risk rules for fungal disease development (humidity + temp)
(: fungal_spore_germination_risk (-> Number Number Symbol))
(= (fungal_spore_germination_risk $humidity_pct $temp_c)
   (if (and (> $humidity_pct 85.0) (> $temp_c 18.0) (< $temp_c 28.0))
       CRITICAL_BLIGHT_RISK
       (if (> $humidity_pct 75.0)
           MODERATE_FUNGAL_RISK
           LOW_RISK)))

;; Pest diagnosis from natural language symptoms
(: diagnose_symptom (-> Symbol Symbol))
(= (diagnose_symptom windowpane_holes) fall_armyworm)
(= (diagnose_symptom leaf_curling_honeydew) aphids)
(= (diagnose_symptom concentric_brown_rings) early_blight)
(= (diagnose_symptom white_powdery_patches) powdery_mildew)

;; Integrated Pest Management (IPM) advisory
(: ipm_action (-> PestThreat Symbol))
(= (ipm_action fall_armyworm) APPLY_BIORATIONAL_BT_SPRAY)
(= (ipm_action aphids) RELEASE_LADYBIRD_BEETLES_OR_NEEM)
(= (ipm_action early_blight) APPLY_COPPER_FUNGICIDE_AND_VENTILATE)
(= (ipm_action powdery_mildew) APPLY_SULPHUR_FOLIAR)
