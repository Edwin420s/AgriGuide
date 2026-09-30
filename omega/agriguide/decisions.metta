; ====================================================================
; AgriGuide Decision Engine: decisions.metta
; Counterfactuals, Trade-Off Matrix, Safety Constraints & Diffs
; ====================================================================

; --- 1. COUNTERFACTUAL SIMULATION ---
; Simulates hypothetical future state under alternative branches
(= (simulate-consequence IRRIGATE $soil $rain $water)
   (let* (($projected-moisture (+ $soil 12.0))
          ($waste-risk (if (>= $rain 70) HIGH (if (>= $rain 40) MEDIUM LOW)))
          ($leaching-risk (if (>= $rain 60) HIGH LOW)))
     (outcome-projection
       (expected-moisture $projected-moisture)
       (water-waste-risk $waste-risk)
       (nutrient-leaching $leaching-risk)
       (water-reserves-impact (if (== $water limited) CRITICAL NOMINAL)))))

(= (simulate-consequence WAIT $soil $rain $water)
   (let* (($projected-moisture (if (>= $rain 50) (+ $soil 15.0) (- $soil 4.0)))
          ($stress-risk (if (and (< $soil 18) (< $rain 35)) HIGH (if (< $soil 18) MEDIUM LOW))))
     (outcome-projection
       (expected-moisture $projected-moisture)
       (crop-stress-risk $stress-risk)
       (water-saved (if (== $water limited) HIGH NOMINAL)))))

; --- 2. DETERMINISTIC SAFETY POLICY CHECKS ---
; Physical system protection: Never allow recommendations to breach safety envelopes
(= (check-safety-policy $action $params)
   (let* (($max-duration (get-param $params max-duration-min 30))
          ($wind-speed (get-param $params wind-speed 0))
          ($freeze-active (get-param $params freeze-active False)))
     (if (and (== $action IRRIGATE) (> $max-duration 30))
         (POLICY_VIOLATION "Max permitted irrigation cycle is 30 minutes.")
         (if (and (== $action IRRIGATE) (> $wind-speed 35))
             (POLICY_VIOLATION "Excessive wind speed (>35 km/h); drip/spray prohibited.")
             (if $freeze-active
                 (POLICY_VIOLATION "Emergency administrative freeze active on water source.")
                 POLICY_PASSED)))))

; --- 3. DECISION SUPERSESSION DIFF ---
(= (compute-decision-diff $prev-rec $curr-rec $primary-delta-cause)
   (if (== $prev-rec $curr-rec)
       NO_CHANGE
       (SUPERSEDED_DIFF
         (from $prev-rec)
         (to $curr-rec)
         (trigger $primary-delta-cause))))
