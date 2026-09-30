; ====================================================================
; AgriGuide Persistent Memory & Ontology: memory.metta
; Episodic, Semantic, Procedural, and Experience Memory Spaces
; ====================================================================

; --- 1. SEMANTIC MEMORY: CROP & SOIL ONTOLOGY ---
(crop-species Maize "Zea mays")
(crop-species Tomato "Solanum lycopersicum")
(crop-species Bean "Phaseolus vulgaris")

; Stage sensitivity coefficients (1.0 = baseline, 2.0 = highly vulnerable)
(stage-sensitivity Maize vegetative 1.1)
(stage-sensitivity Maize flowering 1.9)
(stage-sensitivity Maize tasseling 2.0)
(stage-sensitivity Maize grain-fill 1.4)
(stage-sensitivity Maize maturity 0.5)

; Soil water retention capacities (available water capacity mm/m)
(soil-awc sandy 65)
(soil-awc loam 140)
(soil-awc clay 180)
(soil-awc sandy-loam 110)

; --- 2. PROCEDURAL MEMORY: STANDARD OPERATING PROTOCOLS ---
(= (irrigation-protocol Maize drip)
   (protocol-spec (duration-minutes 25) (frequency-days 2) (target-moisture 24)))

(= (irrigation-protocol Tomato drip)
   (protocol-spec (duration-minutes 35) (frequency-days 1) (target-moisture 28)))

; --- 3. EXPERIENCE MEMORY: FIELD-SPECIFIC CALIBRATION PARAMETERS ---
; Stores empirical deviations learned from historical sensor/outcome telemetry
(= (field-drying-offset $field-id)
   (match &self (field-experience $field-id drying-rate $rate)
          $rate
          1.00)) ; Default 1.0 (no regional deviation)

(= (source-calibration-factor $source-id)
   (match &self (source-experience $source-id reliability $score)
          $score
          0.70))

; --- 4. EPISODIC MEMORY TRACE CONTRACT ---
; Defines how an episode is recorded in the agent's long-term memory
(= (record-episode $episode-id $field-id $goal $decision $confidence $state $rules)
   (add-atom &self (episode $episode-id
                            $field-id
                            $goal
                            $decision
                            $confidence
                            $state
                            $rules)))

; --- 5. HISTORICAL SUPERSESSION CHAINS ---
; Tracks causal provenance when a new belief or decision invalidates a prior one
(= (link-supersession $new-id $old-id $reason)
   (add-atom &self (superseded-by $old-id $new-id $reason)))

(= (get-supersession-history $id)
   (match &self (superseded-by $id $next-id $reason)
          (cons (pair $next-id $reason) (get-supersession-history $next-id))
          (nil)))
