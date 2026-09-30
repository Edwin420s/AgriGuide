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
