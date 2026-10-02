import pytest
from app.services.ml_analytics import AgriculturalMLService

def test_et0_temperature_sensitivity():
    """Verify that elevated ambient temperatures increase reference evapotranspiration."""
    ml = AgriculturalMLService()
    et0_cool = ml.estimate_et0(temp_c=18.0, humidity_pct=60.0, wind_kmh=10.0)
    et0_hot = ml.estimate_et0(temp_c=34.0, humidity_pct=60.0, wind_kmh=10.0)
    assert et0_hot > et0_cool

def test_et0_humidity_sensitivity():
    """Verify that arid, low-humidity air increases reference evapotranspiration."""
    ml = AgriculturalMLService()
    et0_humid = ml.estimate_et0(temp_c=25.0, humidity_pct=85.0, wind_kmh=10.0)
    et0_arid = ml.estimate_et0(temp_c=25.0, humidity_pct=30.0, wind_kmh=10.0)
    assert et0_arid > et0_humid

def test_et0_wind_sensitivity():
    """Verify that wind increases convective evaporative demand."""
    ml = AgriculturalMLService()
    et0_calm = ml.estimate_et0(temp_c=25.0, humidity_pct=60.0, wind_kmh=2.0)
    et0_windy = ml.estimate_et0(temp_c=25.0, humidity_pct=60.0, wind_kmh=25.0)
    assert et0_windy > et0_calm

def test_et0_physical_boundaries():
    """Verify that ET0 is clamped to agronomic physical limits (1.5 to 9.5 mm/day)."""
    ml = AgriculturalMLService()
    et0_extreme_cold = ml.estimate_et0(temp_c=-10.0, humidity_pct=100.0, wind_kmh=0.0)
    et0_extreme_hot = ml.estimate_et0(temp_c=65.0, humidity_pct=5.0, wind_kmh=80.0)
    assert et0_extreme_cold >= 1.5
    assert et0_extreme_hot <= 9.5
