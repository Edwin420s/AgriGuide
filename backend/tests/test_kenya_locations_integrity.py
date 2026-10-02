import pytest
from app.services.kenya_locations import KENYA_LOCATIONS

def test_kenya_locations_boundaries():
    assert len(KENYA_LOCATIONS) >= 80
    for loc in KENYA_LOCATIONS:
        assert "key" in loc
        assert "name" in loc
        assert "latitude" in loc
        assert "longitude" in loc
        # Verify coordinates fall within Kenyan geographic envelope (-5.0 to 5.5 lat, 33.5 to 42.0 lon)
        assert -5.5 <= loc["latitude"] <= 5.5
        assert 33.0 <= loc["longitude"] <= 43.0
