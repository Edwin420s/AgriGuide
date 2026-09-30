; ==========================================================
; AgriGuide Symbolic Reasoning & Decision Rules (MeTTa)
; Demonstrating Pattern Matching, Reductions, and Counterfactuals
; ==========================================================

; --- 1. Growth Stage Water Demand Mapping ---
(= (water-demand flowering) high)
(= (water-demand vegetative) medium)
(= (water-demand germination) high)
(= (water-demand fruiting) high)
(= (water-demand maturity) low)

; --- 2. Soil Moisture Critical Thresholds ---
(= (soil-threshold loam) 18)
(= (soil-threshold sandy_loam) 22)
(= (soil-threshold clay) 15)

; --- 3. Core Irrigation Decision Logic ---
; Evaluates: (irrigation-decision $soil $rain $water $current-rain)
(= (irrigation-decision $soil $rain $water $current-rain)
    (if $current-rain
        WAIT
        (if (and (< $soil 18) (>= $rain 70) (== $water limited))
            WAIT
            (if (and (< $soil 18) (< $rain 35) (not (== $water unavailable)))
                IRRIGATE
                REASSESS))))

; --- 4. Soil-Aware Decision Logic ---
(= (soil-aware-decision $soil $soil-type $rain $water $current-rain)
    (if $current-rain
        WAIT
        (if (and (< $soil (soil-threshold $soil-type)) (>= $rain 70) (== $water limited))
            WAIT
            (if (and (< $soil (soil-threshold $soil-type)) (< $rain 35) (not (== $water unavailable)))
                IRRIGATE
                REASSESS))))

; --- 5. Symbolic Rule Identifiers ---
(= (decision-rule IRRIGATE) R-LOW-MOISTURE-LOW-RAIN)
(= (decision-rule WAIT) R-HIGH-RAIN-WATER-CONSERVATION)
(= (decision-rule REASSESS) R-UNCERTAIN-OR-BALANCED)
(= (decision-rule MONITOR) R-CONFLICT-OR-HIGH-UNCERTAINTY)

; --- 6. Counterfactual Reasoning Rules (Trade-off Analysis) ---
; "What if you Irrigated?"
(= (counterfactual-analysis IRRIGATE $soil $rain $water)
    (if (>= $rain 70)
        (Counterfactual 
            (action IRRIGATE) 
            (efficiency POOR) 
            (risk root-leaching-and-resource-depletion)
            (impact "Consumes limited reservoir water unnecessarily before heavy rain"))
        (Counterfactual 
            (action IRRIGATE) 
            (efficiency OPTIMAL) 
            (risk low-moisture-stress-relief)
            (impact "Replenishes soil moisture directly to sustain vegetative growth"))))

; "What if you Waited?"
(= (counterfactual-analysis WAIT $soil $rain $water)
    (if (< $rain 35)
        (Counterfactual 
            (action WAIT) 
            (efficiency NEUTRAL) 
            (risk severe-crop-water-stress)
            (impact "Prolonged moisture deficit without incoming rain may permanently reduce yield"))
        (Counterfactual 
            (action WAIT) 
            (efficiency HIGH) 
            (risk minimal-natural-rain-compensates)
            (impact "Preserves reservoir reserves while expected rainfall replenishes soil"))))
