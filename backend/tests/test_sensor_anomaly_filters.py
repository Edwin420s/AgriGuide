import pytest
from app.services.ml_analytics import SensorAnomalyDetector

def test_sensor_anomaly_detection_suite():
    detector = SensorAnomalyDetector()
    
    # Normal stable trend
    normal_readings = [20.1, 20.3, 19.8, 20.0, 19.7]
    assert detector.detect_spike(normal_readings)["is_anomaly"] is False
    
    # Massive spike (jump > 35%)
    spike_readings = [18.0, 18.2, 18.1, 85.0]
    res_spike = detector.detect_spike(spike_readings)
    assert res_spike["is_anomaly"] is True
    
    # Frozen line
    frozen_readings = [22.0, 22.0, 22.0, 22.0, 22.0]
    res_frozen = detector.detect_flatline(frozen_readings)
    assert res_frozen["is_anomaly"] is True
