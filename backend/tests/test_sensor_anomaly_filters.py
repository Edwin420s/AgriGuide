import pytest
from app.services.analytics import agronomic_analytics

def test_sensor_anomaly_detection_suite():
    # Normal stable trend
    normal_readings = [20.1, 20.3, 19.8, 20.0, 19.7]
    assert agronomic_analytics.detect_sensor_anomaly(normal_readings)["is_anomaly"] is False
    
    # Massive spike (jump > 35%)
    spike_readings = [18.0, 18.2, 18.1, 85.0]
    res_spike = agronomic_analytics.detect_sensor_anomaly(spike_readings)
    assert res_spike["is_anomaly"] is True
    assert res_spike["anomaly_type"] == "SPIKE"
    
    # Frozen line
    frozen_readings = [22.0, 22.0, 22.0, 22.0, 22.0]
    res_frozen = agronomic_analytics.detect_sensor_anomaly(frozen_readings)
    assert res_frozen["is_anomaly"] is True
    assert res_frozen["anomaly_type"] == "FLATLINE"
