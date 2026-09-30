from app.services.reasoning import IrrigationReasoner

def test_irrigate():
    r=IrrigationReasoner().decide({"soil_moisture":17,"rain_probability_24h":18,"water_availability":"LIMITED","current_rainfall":False,"crop_water_demand":"HIGH","weather_confidence":.71,"soil_confidence":.94})
    assert r.recommendation == "IRRIGATE"

def test_wait():
    r=IrrigationReasoner().decide({"soil_moisture":17,"rain_probability_24h":81,"water_availability":"LIMITED","current_rainfall":False,"crop_water_demand":"HIGH","weather_confidence":.71,"soil_confidence":.94})
    assert r.recommendation == "WAIT"

def test_reassess_missing():
    r=IrrigationReasoner().decide({"soil_moisture":None,"rain_probability_24h":81})
    assert r.recommendation == "REASSESS"
