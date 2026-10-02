# Dynamic Local-Rule Learning: 'The Agent That Grows Up'

## Concept
AgriGuide empowers smallholder farmers to teach the agent custom agronomic rules that override or complement baseline policies.

## Compilation Pipeline
1. Farmer inputs rule parameters via UI:
   - Soil: Sandy Loam
   - Growth Stage: Flowering
   - Rain Threshold: >= 65%
   - Action: WAIT
2. AgriGuide validates rule constraints (ensuring duration limits and safety envelopes remain intact).
3. The rule compiles to MeTTa declarative syntax:
```metta
(= (agriguide-decision $field $soil $crop $moisture $rain $water)
   (if (and (== $soil sandy_loam) (>= $rain 65.0))
       (Decision (action WAIT) (rule "FARMER-CUSTOM-RULE-SANDY-RAIN") (confidence 0.95))
       (empty)))
```
4. The rule is hot-loaded into the active Atomspace rule set for that specific field twin.
