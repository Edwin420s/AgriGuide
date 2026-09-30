# AgriGuide ↔ Omega integration

This directory contains the integration contract for running AgriGuide's cognitive loop with the official SingularityNET Omega runtime.

Omega is intentionally not vendored into this repository. The upstream project has its own PeTTa/MeTTa runtime, dependencies, providers, memory and channels. Keeping it external avoids forking a moving upstream runtime into the application.

## Contract

AgriGuide sends the Omega agent a structured goal:

- field_id
- current world state
- relevant evidence
- active beliefs
- recent decision history
- available tools

The Omega/MeTTa side returns:

- recommendation
- confidence
- reason
- triggered rules
- reasoning steps
- optional memory updates

The backend persists the result as a CognitiveRun + Decision + DecisionReasoning record.

## Why this boundary exists

The official Omega repository supports extension through MeTTa skills and plugins. AgriGuide therefore treats Omega as the cognitive runtime and keeps the agricultural domain model in this repository. This makes the system replaceable, testable and compatible with future Omega changes.
