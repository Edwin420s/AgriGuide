import pytest
from app.services.ml_analytics import AgriculturalMLService, SensorAnomalyDetector


def test_et0_hargreaves_calculation():
    ml = AgriculturalMLService()
    et0 = ml.estimate_et0(temp_c=25.0, humidity_pct=50.0, wind_kmh=15.0)
    assert 3.0 <= et0 <= 8.0


def test_crop_water_demand_flowering_maize():
    ml = AgriculturalMLService()
    et0 = 5.0
    demand = ml.calculate_crop_water_demand("maize", "flowering", et0)
    assert demand["crop_coefficient_kc"] >= 1.1
    assert demand["crop_demand_etc_mm_day"] > et0


def test_soil_depletion_forecast():
    ml = AgriculturalMLService()
    res = ml.forecast_soil_depletion(current_moisture=22.0, etc_mm=5.0, soil_type="loam")
    assert res["projected_moisture_24h"] < 22.0
    assert res["projected_moisture_48h"] < res["projected_moisture_24h"]


def test_sensor_anomaly_sudden_jump():
    detector = SensorAnomalyDetector()
    history = [18.0, 18.2, 17.9, 18.1]
    res = detector.detect(history, current=60.0, sensor_type="soil_moisture")
    assert res.is_anomalous is True
    assert res.anomaly_type == "SUDDEN_SPIKE"
    assert res.confidence_penalty > 0.0


def test_sensor_anomaly_frozen_flatline():
    detector = SensorAnomalyDetector()
    history = [20.0, 20.0, 20.0, 20.0, 20.0, 20.0]
    res = detector.detect(history, current=20.0, sensor_type="soil_moisture")
    assert res.is_anomalous is True
    assert res.anomaly_type == "STUCK_SENSOR"
