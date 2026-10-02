# Agricultural Knowledge Graph Metagraph Topology

## Overview
The digital twin knowledge graph (`app/services/world_model.py`) models agricultural entities and their causal inter-relationships.

## Core Graph Nodes
- `Field`: The spatial plot entity (boundary, location, elevation).
- `Crop`: The biological cultivar (maize, beans, tomatoes) with moisture sensitivity curves.
- `Soil`: The substrate profile (loam, sandy loam, clay) with hydraulic conductivity attributes.
- `Sensor`: The telemetry instrument (depth, calibration offset, battery health).
- `WeatherEvent`: Forecasted or measured meteorological occurrences.
- `Decision`: Historical recommendations with lineage links.

## Causal Inference Pathways
- Drought Stress Cascade:
  `High Solar Flux -> High VPD -> Transpiration Spike -> Root Deficit -> Stomatal Closure -> Yield Penalty`
- Runoff and Leaching Cascade:
  `Heavy Rain Forecast -> Saturated Topsoil -> Surface Runoff -> Nitrogen Leaching -> Watershed Contamination`
