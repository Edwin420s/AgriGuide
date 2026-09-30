; ==========================================================
; AgriGuide Omega Skill Contract (MeTTa)
; Master entrypoint integrating all omega/agriguide submodules
; ==========================================================

; Include modular subcomponents
; (import! &self omega/agriguide/skills.metta)
; (import! &self omega/agriguide/reasoning.metta)
; (import! &self omega/agriguide/memory.metta)
; (import! &self omega/agriguide/evidence.metta)
; (import! &self omega/agriguide/decisions.metta)
; (import! &self omega/agriguide/outcomes.metta)

(= (getSkills) (:: agriguide))
(= (skill-name agriguide) "AgriGuide Agricultural Intelligence")

; Core decision dispatch (backwards-compatible with original contract)
(= (agriguide-decision $soil $rain $water $current-rain)
  (if $current-rain
      WAIT
      (if (and (< $soil 18) (>= $rain 70) (== $water limited))
          WAIT
          (if (and (< $soil 18) (< $rain 35) (not (== $water unavailable)))
              IRRIGATE
              REASSESS))))

(= (agriguide-rule IRRIGATE) R-LOW-MOISTURE-LOW-RAIN)
(= (agriguide-rule WAIT) R-HIGH-RAIN-WATER-CONSERVATION)
(= (agriguide-rule REASSESS) R-UNCERTAIN-OR-BALANCED)

(= (agriguide-counterfactual IRRIGATE $rain)
   (if (>= $rain 70)
       (water-efficiency POOR)
       (water-efficiency OPTIMAL)))

(= (agriguide-counterfactual WAIT $rain)
   (if (< $rain 35)
       (crop-stress-risk HIGH)
       (crop-stress-risk LOW)))
