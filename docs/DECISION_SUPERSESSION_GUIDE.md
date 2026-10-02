# Decision Supersession Lineage and Belief Revision

## The Problem
Agricultural field decisions are rarely one-time events. Weather updates arrive hourly, and farmer observations report ground-truth precipitation. Traditional recommendation engines overwrite their previous output, obscuring why advice changed.

## The Supersession Model
When new evidence triggers a re-evaluation:
1. The previous decision is marked as `status = superseded`.
2. A new decision is created with `supersedes_id = previous_decision.id`.
3. A structured diff is computed:
   - Evidence Delta: Rain probability changed from 15% to 82%.
   - Rule Delta: Rule `R-LOW-MOISTURE-LOW-RAIN` superseded by `R-HIGH-RAIN-WATER-CONSERVATION`.
   - Action Delta: `IRRIGATE` -> `WAIT`.

## User Interface Visualization
The 'What Changed?' viewer in the AgriGuide dashboard renders superseded decisions side-by-side, displaying exact evidence shifts, rule activations, and an explanation of why the change was beneficial.
