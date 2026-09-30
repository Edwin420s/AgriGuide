; ==============================================================================
; AgriGuide: BASIX MeTTa Omniversity Training Foundations Showcase
; ==============================================================================
; This module explicitly embodies and scales the 17 core programming challenges 
; and concepts mastered in the BASIX MeTTa Curriculum (mettatraining):
; 
; Module 1: Functional Foundations, Syntax, and Atomspace Pattern Matching
; Module 2: Recursive Logic, Higher-Order Functions (HOF), and Data Structures
; Module 3: Non-Determinism (superpose/collapse) & Dynamic Space Manipulation
; Module 4: Python Integration (py-atom/hyperon) & Knowledge Graph Unification
; ==============================================================================

; ------------------------------------------------------------------------------
; 1. Type Declarations & Ontology (Curriculum Lesson 03 - 05 & Challenge 4)
; ------------------------------------------------------------------------------
(: Field Type)
(: Crop Type)
(: Soil Type)
(: RiskLevel Type)
(: Action Type)
(: HydrologyNode Type)

(: Maize Crop)
(: FrenchBeans Crop)
(: Tomato Crop)

(: Loam Soil)
(: SandyLoam Soil)
(: Clay Soil)

; Relational Triples (The Farm Digital Twin Knowledge Base)
(grows FieldA Maize)
(has-soil FieldA Loam)
(current-stage FieldA Vegetative)
(moisture-reading FieldA 18)

(grows FieldB FrenchBeans)
(has-soil FieldB SandyLoam)
(current-stage FieldB Flowering)
(moisture-reading FieldB 16)

; Hydrological Network (Upstream Canal -> Field A -> Field B -> Drainage Sump)
(water-flow CanalMain FieldA)
(water-flow FieldA FieldB)
(water-flow FieldB DrainageSump)

; ------------------------------------------------------------------------------
; 2. Higher-Order Logic: Range Guard & Safe Envelope (Challenge 1, 8, 9)
; ------------------------------------------------------------------------------
; Returns True if a sensor reading $val is within [$minVal, $maxVal]
(= (in-range $val $minVal $maxVal)
   (and (>= $val $minVal) (<= $val $maxVal)))

; Yield safety guard: checks if root zone is in critical stress
(= (is-water-stressed $field)
   (match &self (has-soil $field $soil)
      (match &self (moisture-reading $field $current)
         (if (< $current 20) True False))))

; Higher-order conditional summation (Challenge 1: sumIf adapted for water quota)
(= (sum-active-water-demand () $total) $total)
(= (sum-active-water-demand (Cons $x $xs) $total)
   (if (is-water-stressed $x)
       (sum-active-water-demand $xs (+ $total 1500))  ; 1500 Liters needed
       (sum-active-water-demand $xs $total)))

; ------------------------------------------------------------------------------
; 3. Recursive Graph Tracing: Hydrological Watershed & Runoff (Challenge 16)
; ------------------------------------------------------------------------------
; Recursively traces upstream water flow links up to $depth to detect upstream
; runoff hazards during storm events.
(= (trace-upstream $node $depth)
   (if (== $depth 0)
       (empty)
       (match &self (water-flow $upstream $node)
           (superpose (
               $upstream
               (trace-upstream $upstream (- $depth 1))
           )))))

; ------------------------------------------------------------------------------
; 4. Non-Deterministic Counterfactual Evaluation (Curriculum Lesson 15-16)
; ------------------------------------------------------------------------------
; Uses 'superpose' to explore candidate action branches simultaneously without
; mutating the ground truth Atomspace.
(= (counterfactual-branches $moisture $rain)
   (superpose (
       ; Branch 1: If farmer irrigates
       (Branch 
           (action IRRIGATE)
           (predicted-moisture (+ $moisture 15))
           (efficiency (if (>= $rain 70) LOW OPTIMAL))
           (risk (if (>= $rain 70) WATER_WASTE_AND_LEACHING MINIMAL)))
       
       ; Branch 2: If farmer waits
       (Branch 
           (action WAIT)
           (predicted-moisture (if (>= $rain 70) (+ $moisture 18) (- $moisture 3)))
           (efficiency (if (>= $rain 70) MAXIMUM INSUFFICIENT))
           (risk (if (>= $rain 70) NONE ROOT_ZONE_DROUGHT_STRESS)))
   )))

; ------------------------------------------------------------------------------
; 5. Dynamic Atomspace Manipulation: Testing Hypotheses (Challenge 15)
; ------------------------------------------------------------------------------
; Rule demonstrating the dynamic addition of temporary evidence, evaluating
; its impact, and maintaining cognitive purity.
(= (test-rain-hypothesis $field $hypothetical-rain)
   (let () (add-atom &self (hypothetical-forecast $field $hypothetical-rain))
       (let $decision (if (>= $hypothetical-rain 70) WAIT IRRIGATE)
           (let () (remove-atom &self (hypothetical-forecast $field $hypothetical-rain))
               $decision))))

; ------------------------------------------------------------------------------
; 6. Self-Evolving Rule Adaptation (Curriculum Lesson 21 & Track 05 Solo)
; ------------------------------------------------------------------------------
; Baseline conservative threshold: 70% rain triggers irrigation delay
(= (rain-delay-threshold FieldA) 70)

; Adaptive override: When farmer adds custom knowledge, the rule updates
(= (adaptive-irrigation-policy $field $moisture $rain)
   (if (< $moisture 18)
       (if (>= $rain (rain-delay-threshold $field))
           (Decision WAIT "Expected rainfall will recharge root zone naturally")
           (Decision IRRIGATE "Soil moisture is below threshold and rainfall is insufficient"))
       (Decision REASSESS "Soil moisture is currently within adequate buffer")))

; ------------------------------------------------------------------------------
; Verification Queries (Executable in any MeTTa / Hyperon runtime)
; ------------------------------------------------------------------------------
; 1. Query all crops grown across fields:
; !(match &self (grows $field $crop) ($field $crop))

; 2. Run recursive upstream watershed trace for FieldB (2 hops):
; !(trace-upstream FieldB 2)

; 3. Run non-deterministic counterfactual exploration:
; !(counterfactual-branches 18 75)

; 4. Test hypothesis execution:
; !(test-rain-hypothesis FieldA 80)
