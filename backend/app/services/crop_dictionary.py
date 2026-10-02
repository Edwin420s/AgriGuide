from typing import Any

CROP_MULTILINGUAL_CATALOG: list[dict[str, Any]] = [
    {
        "name": "maize",
        "name_en": "Maize (Corn)",
        "name_sw": "Mahindi",
        "aliases": ["mahindi", "mhindi", "corn", "sweetcorn", "maize"],
        "category": "cereal",
        "default_kc_initial": 0.40,
        "default_kc_mid": 1.20,
        "default_kc_late": 0.60,
        "root_depth_m": 1.0,
        "water_demand_level": "HIGH",
        "common_stages": ["germination", "vegetative", "flowering", "grain_filling", "maturity"]
    },
    {
        "name": "french beans",
        "name_en": "French Beans (Green Beans)",
        "name_sw": "Maharagwe Mabichi",
        "aliases": ["french beans", "green beans", "string beans", "maharagwe mabichi", "maharage mabichi", "mishiri", "snap beans"],
        "category": "legume",
        "default_kc_initial": 0.45,
        "default_kc_mid": 1.15,
        "default_kc_late": 0.85,
        "root_depth_m": 0.6,
        "water_demand_level": "MEDIUM",
        "common_stages": ["germination", "vegetative", "flowering", "pod_filling", "maturity"]
    },
    {
        "name": "beans",
        "name_en": "Common Beans (Dry Beans)",
        "name_sw": "Maharagwe",
        "aliases": ["beans", "dry beans", "kidney beans", "maharagwe", "maharage", "wairimu", "nyayo"],
        "category": "legume",
        "default_kc_initial": 0.40,
        "default_kc_mid": 1.10,
        "default_kc_late": 0.35,
        "root_depth_m": 0.6,
        "water_demand_level": "MEDIUM",
        "common_stages": ["germination", "vegetative", "flowering", "pod_filling", "maturity"]
    },
    {
        "name": "tomatoes",
        "name_en": "Tomatoes",
        "name_sw": "Nyanya",
        "aliases": ["tomatoes", "tomato", "nyanya"],
        "category": "horticultural",
        "default_kc_initial": 0.60,
        "default_kc_mid": 1.15,
        "default_kc_late": 0.80,
        "root_depth_m": 0.7,
        "water_demand_level": "HIGH",
        "common_stages": ["transplanting", "vegetative", "flowering", "fruit_set", "maturity"]
    },
    {
        "name": "potatoes",
        "name_en": "Irish Potatoes",
        "name_sw": "Viazi Mviringo",
        "aliases": ["potatoes", "potato", "irish potatoes", "viazi mviringo", "viazi", "waru"],
        "category": "root_tuber",
        "default_kc_initial": 0.50,
        "default_kc_mid": 1.15,
        "default_kc_late": 0.75,
        "root_depth_m": 0.6,
        "water_demand_level": "HIGH",
        "common_stages": ["sprouting", "vegetative", "tuber_initiation", "tuber_bulking", "maturity"]
    },
    {
        "name": "sweet potatoes",
        "name_en": "Sweet Potatoes",
        "name_sw": "Viazi Vitamu",
        "aliases": ["sweet potatoes", "sweet potato", "viazi vitamu", "ngwaci"],
        "category": "root_tuber",
        "default_kc_initial": 0.50,
        "default_kc_mid": 1.10,
        "default_kc_late": 0.65,
        "root_depth_m": 0.8,
        "water_demand_level": "MEDIUM",
        "common_stages": ["vine_establishment", "vegetative", "root_bulking", "maturity"]
    },
    {
        "name": "sukuma wiki",
        "name_en": "Collard Greens (Sukuma Wiki)",
        "name_sw": "Sukuma Wiki",
        "aliases": ["sukuma wiki", "sukuma", "collards", "collard greens", "kale", "kales"],
        "category": "horticultural",
        "default_kc_initial": 0.50,
        "default_kc_mid": 1.00,
        "default_kc_late": 0.95,
        "root_depth_m": 0.5,
        "water_demand_level": "MEDIUM",
        "common_stages": ["transplanting", "vegetative", "active_harvesting", "maturity"]
    },
    {
        "name": "cabbage",
        "name_en": "Cabbage",
        "name_sw": "Kabichi",
        "aliases": ["cabbage", "cabbages", "kabichi", "kabeji"],
        "category": "horticultural",
        "default_kc_initial": 0.50,
        "default_kc_mid": 1.10,
        "default_kc_late": 0.90,
        "root_depth_m": 0.5,
        "water_demand_level": "HIGH",
        "common_stages": ["transplanting", "head_formation", "head_filling", "maturity"]
    },
    {
        "name": "spinach",
        "name_en": "Spinach",
        "name_sw": "Mchicha",
        "aliases": ["spinach", "mchicha", "terere", "managu"],
        "category": "horticultural",
        "default_kc_initial": 0.50,
        "default_kc_mid": 1.00,
        "default_kc_late": 0.95,
        "root_depth_m": 0.4,
        "water_demand_level": "MEDIUM",
        "common_stages": ["transplanting", "vegetative", "active_harvesting", "maturity"]
    },
    {
        "name": "onions",
        "name_en": "Onions (Bulb Onions)",
        "name_sw": "Vitunguu",
        "aliases": ["onions", "onion", "bulb onions", "vitunguu", "kitunguu"],
        "category": "horticultural",
        "default_kc_initial": 0.50,
        "default_kc_mid": 1.05,
        "default_kc_late": 0.75,
        "root_depth_m": 0.4,
        "water_demand_level": "MEDIUM",
        "common_stages": ["transplanting", "vegetative", "bulb_initiation", "bulb_filling", "curing"]
    },
    {
        "name": "garlic",
        "name_en": "Garlic",
        "name_sw": "Kitunguu Saumu",
        "aliases": ["garlic", "kitunguu saumu", "kitunguu thumu"],
        "category": "horticultural",
        "default_kc_initial": 0.50,
        "default_kc_mid": 1.00,
        "default_kc_late": 0.70,
        "root_depth_m": 0.4,
        "water_demand_level": "MEDIUM",
        "common_stages": ["vegetative", "clove_bulking", "curing"]
    },
    {
        "name": "coffee",
        "name_en": "Coffee (Arabica / Robusta)",
        "name_sw": "Kahawa",
        "aliases": ["coffee", "kahawa", "arabica", "robusta"],
        "category": "cash_crop",
        "default_kc_initial": 0.80,
        "default_kc_mid": 1.05,
        "default_kc_late": 0.90,
        "root_depth_m": 1.5,
        "water_demand_level": "MEDIUM",
        "common_stages": ["flowering", "berry_expansion", "cherry_filling", "ripening"]
    },
    {
        "name": "tea",
        "name_en": "Tea",
        "name_sw": "Chai",
        "aliases": ["tea", "chai", "majani ya chai"],
        "category": "cash_crop",
        "default_kc_initial": 0.90,
        "default_kc_mid": 1.10,
        "default_kc_late": 0.85,
        "root_depth_m": 1.5,
        "water_demand_level": "HIGH",
        "common_stages": ["vegetative", "flush", "active_plucking", "dormant"]
    },
    {
        "name": "banana",
        "name_en": "Banana / Plantain",
        "name_sw": "Ndizi",
        "aliases": ["banana", "bananas", "plantain", "ndizi", "matoke"],
        "category": "fruit",
        "default_kc_initial": 0.70,
        "default_kc_mid": 1.20,
        "default_kc_late": 1.00,
        "root_depth_m": 0.9,
        "water_demand_level": "HIGH",
        "common_stages": ["vegetative", "shooting", "bunch_development", "maturity"]
    },
    {
        "name": "avocado",
        "name_en": "Avocado (Hass / Fuerte)",
        "name_sw": "Parachichi",
        "aliases": ["avocado", "avocados", "parachichi", "maparachichi", "hass avocado", "fuerte"],
        "category": "fruit",
        "default_kc_initial": 0.60,
        "default_kc_mid": 0.85,
        "default_kc_late": 0.75,
        "root_depth_m": 1.2,
        "water_demand_level": "MEDIUM",
        "common_stages": ["flowering", "fruit_set", "fruit_development", "maturity"]
    },
    {
        "name": "mango",
        "name_en": "Mango",
        "name_sw": "Embe",
        "aliases": ["mango", "mangoes", "embe", "maembe"],
        "category": "fruit",
        "default_kc_initial": 0.60,
        "default_kc_mid": 0.90,
        "default_kc_late": 0.75,
        "root_depth_m": 1.5,
        "water_demand_level": "MEDIUM",
        "common_stages": ["flowering", "fruit_set", "fruit_filling", "ripening"]
    },
    {
        "name": "cassava",
        "name_en": "Cassava",
        "name_sw": "Muhogo",
        "aliases": ["cassava", "muhogo", "mihogo", "yuca"],
        "category": "root_tuber",
        "default_kc_initial": 0.40,
        "default_kc_mid": 1.05,
        "default_kc_late": 0.60,
        "root_depth_m": 1.0,
        "water_demand_level": "LOW",
        "common_stages": ["sprouting", "canopy_development", "tuber_bulking", "maturity"]
    },
    {
        "name": "sorghum",
        "name_en": "Sorghum",
        "name_sw": "Mtama",
        "aliases": ["sorghum", "mtama"],
        "category": "cereal",
        "default_kc_initial": 0.35,
        "default_kc_mid": 1.05,
        "default_kc_late": 0.55,
        "root_depth_m": 1.2,
        "water_demand_level": "LOW",
        "common_stages": ["germination", "vegetative", "booting", "heading", "maturity"]
    },
    {
        "name": "millet",
        "name_en": "Finger Millet / Pearl Millet",
        "name_sw": "Uwele (Wimbi)",
        "aliases": ["millet", "finger millet", "pearl millet", "uwele", "wimbi"],
        "category": "cereal",
        "default_kc_initial": 0.35,
        "default_kc_mid": 1.00,
        "default_kc_late": 0.50,
        "root_depth_m": 1.0,
        "water_demand_level": "LOW",
        "common_stages": ["germination", "tillering", "heading", "maturity"]
    },
    {
        "name": "wheat",
        "name_en": "Wheat",
        "name_sw": "Ngano",
        "aliases": ["wheat", "ngano"],
        "category": "cereal",
        "default_kc_initial": 0.35,
        "default_kc_mid": 1.15,
        "default_kc_late": 0.40,
        "root_depth_m": 1.0,
        "water_demand_level": "MEDIUM",
        "common_stages": ["germination", "tillering", "heading", "ripening"]
    },
    {
        "name": "rice",
        "name_en": "Rice (Paddy / Upland)",
        "name_sw": "Mpunga (Mchele)",
        "aliases": ["rice", "mpunga", "mchele", "basmati", "paddy"],
        "category": "cereal",
        "default_kc_initial": 1.05,
        "default_kc_mid": 1.25,
        "default_kc_late": 0.90,
        "root_depth_m": 0.5,
        "water_demand_level": "HIGH",
        "common_stages": ["seedling", "tillering", "panicle_initiation", "flowering", "ripening"]
    },
    {
        "name": "sugarcane",
        "name_en": "Sugarcane",
        "name_sw": "Miwa",
        "aliases": ["sugarcane", "miwa", "muwa"],
        "category": "cash_crop",
        "default_kc_initial": 0.40,
        "default_kc_mid": 1.25,
        "default_kc_late": 0.75,
        "root_depth_m": 1.2,
        "water_demand_level": "HIGH",
        "common_stages": ["sprouting", "tillering", "grand_growth", "ripening"]
    },
    {
        "name": "macadamia",
        "name_en": "Macadamia Nut",
        "name_sw": "Makadamia",
        "aliases": ["macadamia", "macadamia nut", "macadamia nuts", "makadamia"],
        "category": "cash_crop",
        "default_kc_initial": 0.60,
        "default_kc_mid": 0.85,
        "default_kc_late": 0.75,
        "root_depth_m": 1.5,
        "water_demand_level": "MEDIUM",
        "common_stages": ["vegetative", "flowering", "nut_development", "maturity"]
    },
    {
        "name": "watermelon",
        "name_en": "Watermelon",
        "name_sw": "Tikitimaji",
        "aliases": ["watermelon", "watermelons", "tikitimaji", "tikiti maji"],
        "category": "horticultural",
        "default_kc_initial": 0.40,
        "default_kc_mid": 1.00,
        "default_kc_late": 0.75,
        "root_depth_m": 0.8,
        "water_demand_level": "HIGH",
        "common_stages": ["vegetative", "flowering", "fruit_setting", "ripening"]
    },
    {
        "name": "carrots",
        "name_en": "Carrots",
        "name_sw": "Karoti",
        "aliases": ["carrots", "carrot", "karoti"],
        "category": "root_tuber",
        "default_kc_initial": 0.45,
        "default_kc_mid": 1.05,
        "default_kc_late": 0.85,
        "root_depth_m": 0.6,
        "water_demand_level": "MEDIUM",
        "common_stages": ["germination", "vegetative", "root_expansion", "maturity"]
    },
    {
        "name": "capsicum",
        "name_en": "Capsicum / Bell Pepper",
        "name_sw": "Pilipili Hoho",
        "aliases": ["capsicum", "bell pepper", "sweet pepper", "pilipili hoho", "pilipili"],
        "category": "horticultural",
        "default_kc_initial": 0.55,
        "default_kc_mid": 1.05,
        "default_kc_late": 0.85,
        "root_depth_m": 0.6,
        "water_demand_level": "MEDIUM",
        "common_stages": ["transplanting", "vegetative", "flowering", "fruit_set", "maturity"]
    },
    {
        "name": "peas",
        "name_en": "Peas / Cowpeas",
        "name_sw": "Njegere (Kunde)",
        "aliases": ["peas", "green peas", "cowpeas", "njegere", "kunde", "mbaazi"],
        "category": "legume",
        "default_kc_initial": 0.45,
        "default_kc_mid": 1.15,
        "default_kc_late": 0.85,
        "root_depth_m": 0.6,
        "water_demand_level": "MEDIUM",
        "common_stages": ["germination", "vegetative", "flowering", "pod_filling", "maturity"]
    },
    {
        "name": "passion fruit",
        "name_en": "Passion Fruit",
        "name_sw": "Pasheni",
        "aliases": ["passion fruit", "passionfruit", "pasheni", "matunda ya pasheni"],
        "category": "fruit",
        "default_kc_initial": 0.55,
        "default_kc_mid": 0.90,
        "default_kc_late": 0.80,
        "root_depth_m": 1.0,
        "water_demand_level": "MEDIUM",
        "common_stages": ["vegetative", "flowering", "fruit_set", "ripening"]
    },
    {
        "name": "pineapple",
        "name_en": "Pineapple",
        "name_sw": "Nanasi",
        "aliases": ["pineapple", "pineapples", "nanasi", "mananasi"],
        "category": "fruit",
        "default_kc_initial": 0.30,
        "default_kc_mid": 0.60,
        "default_kc_late": 0.50,
        "root_depth_m": 0.6,
        "water_demand_level": "LOW",
        "common_stages": ["vegetative", "flowering", "fruit_development", "maturity"]
    },
    {
        "name": "papaya",
        "name_en": "Papaya (Pawpaw)",
        "name_sw": "Papai",
        "aliases": ["papaya", "pawpaw", "papai", "mapapai"],
        "category": "fruit",
        "default_kc_initial": 0.50,
        "default_kc_mid": 0.90,
        "default_kc_late": 0.80,
        "root_depth_m": 0.8,
        "water_demand_level": "MEDIUM",
        "common_stages": ["vegetative", "flowering", "fruit_filling", "ripening"]
    },
    {
        "name": "groundnuts",
        "name_en": "Groundnuts (Peanuts)",
        "name_sw": "Njugu Karanga",
        "aliases": ["groundnuts", "peanuts", "njugu", "njugu karanga"],
        "category": "legume",
        "default_kc_initial": 0.40,
        "default_kc_mid": 1.10,
        "default_kc_late": 0.60,
        "root_depth_m": 0.6,
        "water_demand_level": "MEDIUM",
        "common_stages": ["germination", "vegetative", "flowering", "pod_bulking", "maturity"]
    }
]

# Quick index by all lowercased terms
INDEX: dict[str, dict[str, Any]] = {}
for entry in CROP_MULTILINGUAL_CATALOG:
    INDEX[entry["name"].lower()] = entry
    INDEX[entry["name_en"].lower()] = entry
    INDEX[entry["name_sw"].lower()] = entry
    for alias in entry["aliases"]:
        INDEX[alias.lower()] = entry

# Helper to detect whether a word is more likely Swahili or English
SWAHILI_MARKERS = [
    "mahindi", "nyanya", "parachichi", "viazi", "vitunguu", "kitunguu",
    "kahawa", "chai", "ndizi", "muhogo", "mtama", "wimbi", "ngano", "mpunga",
    "miwa", "sukuma", "mchicha", "kunde", "njegere", "tikitimaji", "karoti",
    "pilipili", "pasheni", "nanasi", "papai", "njugu", "managu", "terere", "mrenda"
]

def detect_crop_multilingual(raw_input: str) -> dict[str, Any]:
    """
    Intelligently identifies any crop in English or Swahili,
    detecting language, primary and counterpart translations,
    and associated FAO-56 agronomic parameters.
    """
    clean = (raw_input or "").strip().lower()
    if not clean:
        clean = "maize"

    # 1. Exact or Alias match in comprehensive dictionary
    if clean in INDEX:
        match = INDEX[clean]
        is_swahili = clean in [match["name_sw"].lower()] or any(
            clean == a.lower() for a in match["aliases"] if a in SWAHILI_MARKERS
        ) or any(clean.startswith(p) for p in ["ma", "m-", "ki", "vi", "u"])

        detected_lang = "sw" if is_swahili else "en"
        counterpart = match["name_en"] if detected_lang == "sw" else match["name_sw"]
        return {
            "matched": True,
            "canonical_name": match["name"],
            "detected_language": detected_lang,
            "name_en": match["name_en"],
            "name_sw": match["name_sw"],
            "counterpart_name": counterpart,
            "display_name": f"{match['name_en']} / {match['name_sw']}",
            "category": match["category"],
            "default_kc_initial": match["default_kc_initial"],
            "default_kc_mid": match["default_kc_mid"],
            "default_kc_late": match["default_kc_late"],
            "root_depth_m": match["root_depth_m"],
            "water_demand_level": match["water_demand_level"],
            "common_stages": match["common_stages"],
            "aliases": match["aliases"]
        }

    # 2. Multi-word compound matching (e.g. "french beans" or "viazi mviringo")
    for key, match in INDEX.items():
        if " " in key and (key in clean or clean in key):
            detected_lang = "sw" if any(w in clean for w in SWAHILI_MARKERS) else "en"
            counterpart = match["name_en"] if detected_lang == "sw" else match["name_sw"]
            return {
                "matched": True,
                "canonical_name": match["name"],
                "detected_language": detected_lang,
                "name_en": match["name_en"],
                "name_sw": match["name_sw"],
                "counterpart_name": counterpart,
                "display_name": f"{match['name_en']} / {match['name_sw']}",
                "category": match["category"],
                "default_kc_initial": match["default_kc_initial"],
                "default_kc_mid": match["default_kc_mid"],
                "default_kc_late": match["default_kc_late"],
                "root_depth_m": match["root_depth_m"],
                "water_demand_level": match["water_demand_level"],
                "common_stages": match["common_stages"],
                "aliases": match["aliases"]
            }

    # 3. Novel / Unknown crop: deduce language and construct bidirectional naming
    is_swahili_heuristics = (
        clean.startswith("m") and len(clean) > 3 and clean[1] not in ["a", "o"]
    ) or clean.startswith("ki") or clean.startswith("vi") or clean.endswith("ji")

    cap = clean.capitalize()
    if is_swahili_heuristics:
        detected_lang = "sw"
        name_sw = cap
        name_en = f"{cap} (Local Crop)"
        counterpart = name_en
    else:
        detected_lang = "en"
        name_en = cap
        name_sw = f"{cap} (Zao)"
        counterpart = name_sw

    # Classify category and FAO-56 defaults by keywords
    if any(k in clean for k in ["bean", "pea", "lentil", "gram", "kunde", "maharage"]):
        cat = "legume"
        kc_init, kc_mid, kc_late = 0.40, 1.15, 0.45
        water = "MEDIUM"
        stages = ["vegetative", "flowering", "pod_filling", "maturity"]
    elif any(k in clean for k in ["corn", "grain", "cereal", "millet", "oat", "barley", "ngano", "mtama"]):
        cat = "cereal"
        kc_init, kc_mid, kc_late = 0.35, 1.20, 0.55
        water = "HIGH"
        stages = ["emergence", "vegetative", "flowering", "grain_filling", "maturity"]
    elif any(k in clean for k in ["fruit", "berry", "melon", "tunda", "embe"]):
        cat = "fruit"
        kc_init, kc_mid, kc_late = 0.60, 0.95, 0.80
        water = "MEDIUM"
        stages = ["vegetative", "flowering", "fruit_set", "maturity"]
    elif any(k in clean for k in ["root", "tuber", "potato", "yam", "viazi", "muhogo"]):
        cat = "root_tuber"
        kc_init, kc_mid, kc_late = 0.45, 1.10, 0.70
        water = "MEDIUM"
        stages = ["sprouting", "vegetative", "tuber_bulking", "maturity"]
    else:
        cat = "horticultural"
        kc_init, kc_mid, kc_late = 0.50, 1.10, 0.80
        water = "MEDIUM"
        stages = ["transplanting", "vegetative", "flowering", "maturity"]

    return {
        "matched": False,
        "canonical_name": clean,
        "detected_language": detected_lang,
        "name_en": name_en,
        "name_sw": name_sw,
        "counterpart_name": counterpart,
        "display_name": f"{name_en} / {name_sw}",
        "category": cat,
        "default_kc_initial": kc_init,
        "default_kc_mid": kc_mid,
        "default_kc_late": kc_late,
        "root_depth_m": 0.6,
        "water_demand_level": water,
        "common_stages": stages,
        "aliases": [clean]
    }
