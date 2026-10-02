# MeTTa Typed Agricultural Ontology Reference

## Overview
AgriGuide represents agricultural entities, physical properties, and agronomic logic as formal declarative S-expressions within an OpenCog Hyperon Atomspace metagraph.

## Core Types

```metta
(: Crop Type)
(: SoilType Type)
(: GrowthStage Type)
(: WaterAvailability Type)
(: Recommendation Type)
(: EvidenceSource Type)
```

## Type Constructor Declarations

```metta
(: Field Symbol)
(: Maize Crop)
(: FrenchBeans Crop)
(: Tomatoes Crop)
(: Loam SoilType)
(: SandyLoam SoilType)
(: ClayLoam SoilType)
(: Vegetative GrowthStage)
(: Flowering GrowthStage)
(: Fruiting GrowthStage)
(: HarvestReady GrowthStage)
(: RELIABLE WaterAvailability)
(: LIMITED WaterAvailability)
(: UNAVAILABLE WaterAvailability)
(: IRRIGATE Recommendation)
(: WAIT Recommendation)
(: MONITOR Recommendation)
(: REASSESS Recommendation)
```

## Relational Predicates

```metta
(: has-crop (-> Field Crop Symbol))
(: has-stage (-> Field GrowthStage Symbol))
(: has-soil (-> Field SoilType Symbol))
(: soil-moisture (-> Field Number Symbol))
(: rain-probability (-> Field Number Symbol))
(: water-status (-> Field WaterAvailability Symbol))
(: current-rainfall (-> Field Bool Symbol))
```

## Higher-Order Operators
- match &self: Evaluates pattern queries over the active Atomspace space.
- superpose: Generates non-deterministic alternative evaluation branches.
- sum-active-water-demand: Recursive accumulator calculating total volumetric demand across water-stressed fields.
- trace-upstream: Recursive graph-walking operator identifying upstream hydrologic contributors.
