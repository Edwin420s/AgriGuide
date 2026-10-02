import pytest
from app.services.crop_catalog import CROP_CATALOG

def test_crop_catalog_threshold_sanity():
    assert len(CROP_CATALOG) >= 25
    for crop in CROP_CATALOG:
        assert "id" in crop
        assert "name_en" in crop
        assert "min_moisture" in crop
        assert "optimal_moisture" in crop
        assert "max_moisture" in crop
        assert crop["min_moisture"] < crop["optimal_moisture"] <= crop["max_moisture"]
