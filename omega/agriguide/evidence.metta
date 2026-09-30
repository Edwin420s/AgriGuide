; ====================================================================
; AgriGuide Evidence Engine: evidence.metta
; Provenance, Freshness Decay, Conflict Detection & Belief Revision
; ====================================================================

; --- 1. FRESHNESS DECAY CURVES ---
; Half-lives in minutes per observation type:
; Sensors: 30m, Forecast: 360m (6h), Satellite: 1440m (24h), Farmer note: 180m (3h)
(= (half-life iot-sensor) 30.0)
(= (half-life weather-forecast) 360.0)
(= (half-life satellite-ndvi) 1440.0)
(= (half-life farmer-note) 180.0)

(= (calculate-freshness $source-type $age-minutes)
   (let* (($hl (half-life $source-type))
          ($ratio (/ $age-minutes $hl)))
     (if (<= $ratio 0.0)
         1.0
         (if (>= $ratio 4.0)
             0.10
             (- 1.0 (* $ratio 0.225))))))

; --- 2. SOURCE-SPECIFIC RELIABILITY ---
(= (contextual-reliability $provider $region $metric)
   (match &self (provider-reliability $provider $region $metric $score)
          $score
          0.75))

; --- 3. CONFLICT DETECTION ---
; Detects variance beyond acceptable domain thresholds
(= (is-conflict rain-forecast $val1 $val2)
   (>= (abs (- $val1 $val2)) 25.0))

(= (is-conflict soil-moisture $val1 $val2)
   (>= (abs (- $val1 $val2)) 8.0))

(= (is-conflict rain-observed-vs-forecast $is-raining $forecast-prob)
   (and $is-raining (< $forecast-prob 20.0)))

; Conflict penalty applied to active confidence
(= (conflict-penalty $conflicts-detected)
   (if $conflicts-detected 0.25 0.0))

; --- 4. EVIDENCE FUSION & EFFECTIVE WEIGHT ---
(= (effective-evidence-weight $source-type $base-reliability $age-minutes)
   (let* (($freshness (calculate-freshness $source-type $age-minutes)))
     (* $base-reliability $freshness)))
