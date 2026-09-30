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
