; ==========================================================
; Reference Cases for AgriGuide Reasoning Model (MeTTa)
; ==========================================================

; Test 1: Dry soil, low rain, limited water -> IRRIGATE
! (irrigation-decision 17 18 limited false)

; Test 2: Dry soil, high rain, limited water -> WAIT (Conserve)
! (irrigation-decision 17 81 limited false)

; Test 3: Dry soil, high rain, rain currently falling -> WAIT
! (irrigation-decision 17 81 limited true)

; Test 4: Counterfactual Analysis for IRRIGATE under high rain (Wasted water)
! (counterfactual-analysis IRRIGATE 17 81 limited)

; Test 5: Counterfactual Analysis for WAIT under high rain (High conservation)
! (counterfactual-analysis WAIT 17 81 limited)

; Test 6: Soil-Aware Decision for Sandy Loam (Threshold 22%) with moisture 20%
! (soil-aware-decision 20 sandy_loam 15 limited false)
