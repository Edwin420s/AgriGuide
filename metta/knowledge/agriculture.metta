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

