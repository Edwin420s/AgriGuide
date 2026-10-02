#!/usr/bin/env python3
"""Drought Deficit Scenario Simulator for AgriGuide.

Simulates a 14-day zero-rainfall scenario across arid Eastern Kenya (Kitui/Machakos)
to test crop water stress progression and adaptive irrigation triggering.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.services.ml_analytics import AgriculturalMLService
from app.services.reasoning import IrrigationReasoner

def main():
    print("==========================================================")
    print("  AgriGuide 14-Day Drought Deficit Scenario Simulator")
    print("==========================================================")
    
    ml = AgriculturalMLService()
    reasoner = IrrigationReasoner()
    
    moisture = 26.0  # Initial nominal moisture (loam soil)
    temp_c = 31.0
    humidity = 40.0
    wind_kmh = 14.0
    rain_prob = 5.0
    
    et0 = ml.estimate_et0(temp_c, humidity, wind_kmh)
    etc = ml.calculate_crop_water_demand("maize", "flowering", et0)["crop_demand_etc_mm_day"]
    
    print(f"Reference ET0: {et0} mm/day | Crop Demand ETc: {etc} mm/day")
    print("----------------------------------------------------------")
    
    irrigations_triggered = 0
    for day in range(1, 15):
        # Forecast moisture drop
        depletion = ml.forecast_soil_depletion(moisture, etc, "loam")
        moisture = depletion["projected_moisture_24h"]
        
        state = {
            "soil_moisture": moisture,
            "rain_probability_24h": rain_prob,
            "water_availability": "LIMITED",
            "crop_water_demand": "HIGH"
        }
        res = reasoner.decide(state)
        
        status_flag = "STRESS" if moisture < 18.0 else "NOMINAL"
        print(f"Day {day:02d}: Moisture={moisture:4.1f}% [{status_flag}] -> Recommendation: {res.recommendation} ({res.confidence*100:.0f}%)")
        
        if res.recommendation == "IRRIGATE":
            irrigations_triggered += 1
            moisture = min(28.0, moisture + 10.0)  # Simulated irrigation recovery
            
    print("==========================================================")
    print(f"Simulation Finished: {irrigations_triggered} Adaptive Irrigations Executed")
    print("[SUCCESS] Drought Stress Defense Evaluated")

if __name__ == "__main__":
    main()
