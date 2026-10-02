import pytest
from app.services.ml_analytics import SensorAnomalyDetector

def test_sensor_anomaly_detection_suite():
    detector = SensorAnomalyDetector()
    
    # Normal stable trend
    normal_history = [20.1, 20.3, 19.8, 20.0]
    res_normal = detector.detect(normal_history, 19.7)
    assert res_normal.is_anomalous is False
    assert res_normal.anomaly_type == "NONE"
    
    # Sudden Spike (jump >= 25%)
    spike_history = [18.0, 18.2, 18.1]
    res_spike = detector.detect(spike_history, 85.0)
    assert res_spike.is_anomalous is True
    assert res_spike.anomaly_type == "SUDDEN_SPIKE"
    
    # Stuck / Flatline Sensor (5 consecutive equal samples)
    frozen_history = [22.0, 22.0, 22.0, 22.0]
    res_flatline = detector.detect(frozen_history, 22.0)
    assert res_flatline.is_anomalous is True
    assert res_flatline.anomaly_type == "STUCK_SENSOR"
