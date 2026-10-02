import pytest
from app.services.crop_dictionary import CROP_MULTILINGUAL_CATALOG

def test_crop_catalog_threshold_sanity():
    assert len(CROP_MULTILINGUAL_CATALOG) >= 15
    for crop in CROP_MULTILINGUAL_CATALOG:
        assert "name" in crop
        assert "name_en" in crop
        assert "name_sw" in crop
        assert "default_kc_initial" in crop
        assert "default_kc_mid" in crop
        assert "default_kc_late" in crop
        assert crop["default_kc_initial"] < crop["default_kc_mid"]
