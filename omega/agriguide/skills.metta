; ====================================================================
; AgriGuide Omega Skill Contract: skills.metta
; Implements official SingularityNET Omega extension point specifications
; ====================================================================

; Skill Declaration
(= (getSkills) (:: agriguide))

(= (skill-name agriguide) "AgriGuide Agricultural Intelligence")
(= (skill-version agriguide) "2.0.0")
(= (skill-description agriguide)
   "Explainable, evidence-driven agricultural decision intelligence with auditable MeTTa inference and persistent episodic memory.")

; Supported Cognitive Domains
(= (skill-domains agriguide)
   (:: irrigation planting fertilization crop-health weather-risk harvest))

; Skill Preconditions & Required Context
(= (skill-preconditions agriguide $state)
   (and
     (not (== (get-state-key $state field_id) None))
     (not (== (get-state-key $state crop) None))))

; Skill Postconditions & Guarantees
(= (skill-postconditions agriguide $result)
   (and
     (has-key $result recommendation)
     (has-key $result confidence)
     (has-key $result reason)
     (has-key $result rules)
     (has-key $result proof-chain)))

; Skill Execution Dispatcher
(= (execute-skill agriguide $goal $state $memory)
   (let* (($domain (extract-domain $goal))
          ($evidence (evaluate-evidence $state))
          ($rules (select-rules $domain $state))
          ($decision (derive-decision $domain $state $evidence))
          ($counterfactuals (simulate-counterfactuals $domain $state $decision))
          ($safety (check-safety-policies $decision $state)))
     (format-omega-result $decision $rules $counterfactuals $safety)))
