import pytest
from app.services.ml_analytics import AgriculturalMLService

def test_penman_monteith_extreme_weather():
    ml = AgriculturalMLService()
    et0_hot = ml.estimate_et0(temp_c=38.0, humidity_pct=15.0, wind_kmh=20.0)
    assert 4.0 <= et0_hot <= 12.0
    
    et0_cool = ml.estimate_et0(temp_c=16.0, humidity_pct=90.0, wind_kmh=5.0)
    assert 1.0 <= et0_cool <= 5.0
    
    assert et0_hot > et0_cool
