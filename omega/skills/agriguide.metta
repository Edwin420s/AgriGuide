; ==========================================================
; AgriGuide Omega Skill Contract (MeTTa)
; ==========================================================

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

