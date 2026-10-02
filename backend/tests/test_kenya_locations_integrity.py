import pytest
from app.services.weather_service import weather_service

def test_kenya_locations_boundaries():
    locs = weather_service.list_known_locations()
    assert len(locs) >= 80
    for loc in locs:
        assert "key" in loc
        assert "name" in loc
        assert "latitude" in loc
        assert "longitude" in loc
        assert -5.5 <= loc["latitude"] <= 5.5
        assert 33.0 <= loc["longitude"] <= 43.0
