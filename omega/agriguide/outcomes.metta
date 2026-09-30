; ====================================================================
; AgriGuide Outcomes & Calibration: outcomes.metta
; Closed-Loop Evaluation, Source Calibration & Candidate Rule Discovery
; ====================================================================

; --- 1. PREDICTION VS OUTCOME DELTA ---
(= (prediction-error $predicted-prob $actual-rained)
   (if $actual-rained
       (- 100.0 $predicted-prob)
       $predicted-prob))

; --- 2. MULTI-LEVEL CALIBRATION ---
; Level 1: Weather source calibration
(= (calibrate-source-reliability $current-score $samples $was-accurate)
   (let* (($target (if $was-accurate 0.95 0.40))
          ($new-samples (+ $samples 1))
          ($updated (/ (+ (* $current-score $samples) $target) $new-samples)))
     (round-score $updated)))

; Level 2: Sensor drift detection
(= (detect-sensor-drift $expected-moisture $measured-moisture $delta-threshold)
   (let* (($abs-diff (abs (- $expected-moisture $measured-moisture))))
     (if (>= $abs-diff $delta-threshold)
         (SENSOR_DRIFT_WARNING (drift $abs-diff))
         SENSOR_NOMINAL)))

; Level 3: Field drying rate adaptation
(= (update-drying-rate $base-rate $measured-loss $expected-loss)
   (let* (($ratio (/ $measured-loss (max 0.1 $expected-loss))))
     (* $base-rate (+ 0.8 (* 0.2 $ratio)))))

; --- 3. CANDIDATE RULE DISCOVERY ---
; Proposes candidate rules for human/agronomist review when repetitive patterns succeed
(= (propose-candidate-rule $condition $action $success-count $total-samples)
   (let* (($success-rate (/ $success-count (max 1 $total-samples))))
     (if (and (>= $total-samples 20) (>= $success-rate 0.90))
         (CANDIDATE_RULE_PROPOSAL
           (condition $condition)
           (action $action)
           (confidence $success-rate)
           (sample-size $total-samples)
           (status PENDING_HUMAN_REVIEW))
         INSUFFICIENT_EVIDENCE)))
