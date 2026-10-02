import pytest
from app.services.ml_analytics import AgriculturalMLService

def test_soil_depletion_texture_ranking():
    """Verify that lighter soils (sand) lose moisture faster than heavier soils (clay)."""
    ml = AgriculturalMLService()
    initial_moisture = 25.0
    etc_mm = 5.0
    
    res_sand = ml.forecast_soil_depletion(initial_moisture, etc_mm, soil_type="sand")
    res_sandy_loam = ml.forecast_soil_depletion(initial_moisture, etc_mm, soil_type="sandy_loam")
    res_loam = ml.forecast_soil_depletion(initial_moisture, etc_mm, soil_type="loam")
    res_clay = ml.forecast_soil_depletion(initial_moisture, etc_mm, soil_type="clay")
    
    # Sand should experience highest daily loss rate
    assert res_sand["estimated_daily_loss_pct"] > res_sandy_loam["estimated_daily_loss_pct"]
    assert res_sandy_loam["estimated_daily_loss_pct"] > res_loam["estimated_daily_loss_pct"]
    assert res_loam["estimated_daily_loss_pct"] > res_clay["estimated_daily_loss_pct"]

def test_stress_threshold_and_critical_days():
    """Verify that days until critical stress decreases as moisture approaches 18%."""
    ml = AgriculturalMLService()
    etc_mm = 4.0
    
    res_high = ml.forecast_soil_depletion(current_moisture=30.0, etc_mm=etc_mm, soil_type="loam")
    res_low = ml.forecast_soil_depletion(current_moisture=20.0, etc_mm=etc_mm, soil_type="loam")
    
    assert res_high["days_until_critical_stress"] > res_low["days_until_critical_stress"]
    assert res_high["projected_moisture_24h"] > res_low["projected_moisture_24h"]
    assert res_high["projected_moisture_48h"] < res_high["projected_moisture_24h"]
