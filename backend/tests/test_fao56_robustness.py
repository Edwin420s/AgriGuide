import pytest
from app.services.analytics import agronomic_analytics

def test_penman_monteith_extreme_weather():
    # Dry, hot, windy conditions
    et0_hot = agronomic_analytics.calculate_et0_penman_monteith(temp_c=38.0, humidity_pct=15.0, wind_ms=5.0, solar_rad_mj=28.0)
    assert 5.0 <= et0_hot <= 12.0
    
    # Cool, humid, calm conditions
    et0_cool = agronomic_analytics.calculate_et0_penman_monteith(temp_c=16.0, humidity_pct=90.0, wind_ms=0.5, solar_rad_mj=10.0)
    assert 1.0 <= et0_cool <= 4.0
    
    # Evapotranspiration in hot/dry must exceed cool/humid
    assert et0_hot > et0_cool
