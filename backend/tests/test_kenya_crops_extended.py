import pytest
from app.services.crop_dictionary import detect_crop_multilingual, CROP_MULTILINGUAL_CATALOG
from app.services.ml_analytics import AgriculturalMLService

def test_crop_catalog_coverage():
    """Verify that all core Kenyan staple and cash crops exist in catalog."""
    crop_names = [c["name"].lower() for c in CROP_MULTILINGUAL_CATALOG]
    required = ["maize", "french beans", "beans", "tomatoes", "potatoes", "coffee", "tea", "cabbage", "sukuma wiki", "cassava", "sorghum", "wheat", "rice"]
    for r in required:
        assert r in crop_names, f"Expected {r} in crop catalog"

def test_swahili_alias_detection():
    """Verify Swahili and dialect crop names map to canonical keys."""
    test_cases = [
        ("mahindi", "maize"),
        ("nyanya", "tomatoes"),
        ("sukuma wiki", "sukuma wiki"),
        ("kales", "sukuma wiki"),
        ("waru", "potatoes"),
        ("kahawa", "coffee"),
        ("majani ya chai", "tea"),
        ("muhogo", "cassava"),
        ("mtama", "sorghum"),
    ]
    for raw, expected_canonical in test_cases:
        res = detect_crop_multilingual(raw)
        assert res["canonical_name"].lower() == expected_canonical, f"Failed for {raw}: got {res['canonical_name']}"

def test_stage_crop_coefficients():
    """Verify crop coefficient (Kc) calculations across stages for key crops."""
    ml = AgriculturalMLService()
    et0 = 5.0  # 5 mm/day reference ET
    
    # Maize vegetative vs flowering
    maize_veg = ml.calculate_crop_water_demand("maize", "vegetative", et0)
    maize_flowering = ml.calculate_crop_water_demand("maize", "flowering", et0)
    assert maize_veg["crop_coefficient_kc"] < maize_flowering["crop_coefficient_kc"]
    assert maize_flowering["crop_demand_etc_mm_day"] > maize_veg["crop_demand_etc_mm_day"]
    assert maize_veg["crop_demand_etc_mm_day"] == round(5.0 * 0.80, 2)
