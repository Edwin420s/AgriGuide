# Agricultural Knowledge Graph & MeTTa Ontology Reference

## Overview
AgriGuide translates relational farm models into a symbolic hypergraph represented as MeTTa S-expressions in OpenCog Hyperon's AtomSpace.

## Entity Types
- `(: Farm Type)`: Geographic enterprise containing plots and infrastructure.
- `(: Field Type)`: Management unit with specific soil, crop, and irrigation system.
- `(: Sensor Type)`: In-situ telemetry device (capacitive moisture, temperature, leaf wetness).
- `(: Crop Type)`: Biological organism with cultivar-specific phenology.
- `(: WeatherProvider Type)`: External meteorological service.
- `(: Farmer Type)`: Human operator providing qualitative ground-truth observations.

## Relational Predicates
- `(has_field <farm_id> <field_id>)`
- `(monitors_field <sensor_id> <field_id>)`
- `(planted_with <field_id> <crop_id>)`
- `(has_soil <field_id> <soil_texture>)`
- `(in_stage <crop_id> <phenology_stage>)`
- `(derived_from <belief_id> <evidence_id>)`
- `(supersedes <new_decision_id> <old_decision_id>)`

## Causal Linkages
Causal chains map physical evidence to high-level decisions:

$$\text{Evidence}(\text{rain\_prob}: 82\%) \longrightarrow \text{Belief}(\text{precipitation\_imminent}) \longrightarrow \text{Decision}(\text{WAIT})$$

Each link contains provenance metadata, calibration confidence, and rule references.
