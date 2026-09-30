; ==========================================================
; AgriGuide Agricultural Knowledge Base (Atomspace)
; Rooted in Level 1 MeTTa Concepts: Types, Facts, Relations
; ==========================================================

; --- 1. Type Declarations ---
(: Crop Type)
(: GrowthStage Type)
(: SoilType Type)
(: WaterDemand Type)
(: Decision Type)
(: EvidenceType Type)
(: Relation Type)
(: ConflictType Type)

; --- 2. Crops ---
(crop maize)
(crop french_beans)
(crop tomato)

; --- 3. Growth Stages ---
(growth-stage germination)
(growth-stage vegetative)
(growth-stage flowering)
(growth-stage fruiting)
(growth-stage maturity)

; --- 4. Crop Water Demands per Growth Stage ---
(water-demand maize germination high)
(water-demand maize vegetative medium)
(water-demand maize flowering high)
(water-demand maize fruiting high)
(water-demand maize maturity low)

(water-demand french_beans germination medium)
(water-demand french_beans vegetative high)
(water-demand french_beans flowering high)
(water-demand french_beans fruiting medium)
(water-demand french_beans maturity low)

(water-demand tomato germination medium)
(water-demand tomato vegetative high)
(water-demand tomato flowering high)
(water-demand tomato fruiting high)
(water-demand tomato maturity low)

; --- 5. Soil Types & Water Retention Capacity ---
; Format: (soil-property $soil_type $retention_tier $critical_threshold_percent)
(soil-property loam medium-retention 18)
(soil-property sandy_loam low-retention 22)
(soil-property clay high-retention 15)

; --- 6. Evidence Types ---
(evidence-type sensor-soil-moisture)
(evidence-type weather-forecast)
(evidence-type farmer-observation)
(evidence-type ground-truth-rain-gauge)

; --- 7. Cognitive Relations ---
(relation supports)
(relation contradicts)
(relation supersedes)
(relation compensates-for)

; --- 8. Decision Classifiers ---
(decision IRRIGATE)
(decision WAIT)
(decision REASSESS)
(decision MONITOR)

; --- 9. Atomspace Query Patterns (Lessons 05, 10, 15) ---
; Retrieve water demand for any crop and stage combination:
(= (get-crop-demand $crop $stage)
   (match &self (water-demand $crop $stage $demand) $demand))

; Retrieve critical moisture threshold for any soil type:
(= (get-soil-threshold $soil)
   (match &self (soil-property $soil $retention $thresh) $thresh))

; Retrieve whether two items have a cognitive relation:
(= (has-relation $rel $subject $object)
   (match &self (relation $rel) (relation $rel)))
