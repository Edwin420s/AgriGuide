;; ============================================================================
;; AgriGuide - Soil Physics & Water Retention Ontology (MeTTa)
;; Models soil textures, field capacity, permanent wilting point, and percolation
;; ============================================================================

(: SoilTexture Type)
(: sandy SoilTexture)
(: sandy_loam SoilTexture)
(: loam SoilTexture)
(: clay_loam SoilTexture)
(: clay SoilTexture)

;; Available Water Capacity (AWC) in mm per meter of soil depth
(: awc (-> SoilTexture Number))
(= (awc sandy) 65.0)
(= (awc sandy_loam) 110.0)
(= (awc loam) 160.0)
(= (awc clay_loam) 175.0)
(= (awc clay) 140.0)

;; Infiltration rate in mm/hour
(: infiltration_rate (-> SoilTexture Number))
(= (infiltration_rate sandy) 30.0)
(= (infiltration_rate sandy_loam) 20.0)
(= (infiltration_rate loam) 10.0)
(= (infiltration_rate clay_loam) 5.0)
(= (infiltration_rate clay) 2.0)

;; Permanent wilting point volumetric moisture percentage (%)
(: wilting_point (-> SoilTexture Number))
(= (wilting_point sandy) 6.0)
(= (wilting_point sandy_loam) 10.0)
(= (wilting_point loam) 14.0)
(= (wilting_point clay_loam) 18.0)
(= (wilting_point clay) 22.0)

;; Field capacity volumetric moisture percentage (%)
(: field_capacity (-> SoilTexture Number))
(= (field_capacity sandy) 12.0)
(= (field_capacity sandy_loam) 22.0)
(= (field_capacity loam) 31.0)
(= (field_capacity clay_loam) 36.0)
(= (field_capacity clay) 40.0)

;; Rule: Critical water deficit threshold (Readily Available Water RAW = 50% MAD)
(: is_water_stressed (-> SoilTexture Number Bool))
(= (is_water_stressed $texture $current_moisture)
   (let* (($pwp (wilting_point $texture))
          ($fc (field_capacity $texture))
          ($stress_threshold (+ $pwp (* (- $fc $pwp) 0.5))))
     (< $current_moisture $stress_threshold)))
