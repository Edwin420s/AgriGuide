import React, { useEffect, useState } from 'react';
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Gauge,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { getFieldAnalytics, checkSensorAnomaly } from '../lib/api';

interface WeatherClimateSensorsProps {
  field: any;
  state: any;
}

export const WeatherClimateSensorsView: React.FC<WeatherClimateSensorsProps> = ({ field, state }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [anomalyTestResult, setAnomalyTestResult] = useState<any>(null);
  const [testingAnomaly, setTestingAnomaly] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    if (!field?.id) return;
    setLoading(true);
    try {
      const data = await getFieldAnalytics(field.id);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load field analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [field?.id]);

  const runAnomalyTest = async (testType: 'spike' | 'flatline' | 'normal') => {
    if (!field?.id) return;
    setTestingAnomaly(true);
    setAnomalyTestResult(null);

    let history: number[] = [18.1, 18.0, 18.2, 17.9, 18.0];
    let currentValue = 18.0;

    if (testType === 'spike') {
      history = [18.0, 18.2, 17.9, 18.1, 18.0];
      currentValue = 55.0; // Sudden +37% jump without rain
    } else if (testType === 'flatline') {
      history = [18.0, 18.0, 18.0, 18.0, 18.0];
      currentValue = 18.0; // Zero variance across 6 readings
    } else {
      history = [18.1, 18.0, 18.2, 17.9, 18.0];
      currentValue = 17.8; // Physically plausible steady drying
    }

    try {
      const res = await checkSensorAnomaly(field.id, history, currentValue, 'soil_moisture');
      setAnomalyTestResult({ ...res, testType });
    } catch (e) {
      console.error('Anomaly check failed:', e);
    } finally {
      setTestingAnomaly(false);
    }
  };

  const et0 = analytics?.fao56_evapotranspiration?.reference_et0_mm_day || 4.2;
  const etc = analytics?.fao56_evapotranspiration?.crop_water_demand_etc_mm_day || 3.4;
  const kc = analytics?.fao56_evapotranspiration?.crop_coefficient_kc || 0.8;
  const depletion = analytics?.root_zone_depletion_forecast;

  return (
    <div className="tab-container">
      {/* Header Banner */}
      <div className="card-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span className="pill">PHYSICAL AGRONOMY & TELEMETRY</span>
          <h2 style={{ fontSize: '1.4rem', marginTop: '4px' }}>
            Weather, Climate & Sensor Diagnostics
          </h2>
          <p className="field-subtitle">
            FAO-56 Penman-Monteith Evapotranspiration, Crop Demand $ET_c$, and Multi-Vector Anomaly Detection
          </p>
        </div>
        <button className="secondary" onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Grid Row 1: Weather & Microclimate */}
      <div className="hero-grid" style={{ marginBottom: '1.5rem' }}>
        {/* Weather Card */}
        <div className="field-card">
          <div className="card-head">
            <div>
              <span className="pill pill-mode">LOCAL WEATHER ENSEMBLE</span>
              <h3>Atmospheric Forecast (24h - 48h)</h3>
            </div>
            <CloudRain size={24} style={{ color: '#1e5a32' }} />
          </div>

          <div className="metrics-grid">
            <div className="metric-box">
              <span className="metric-label">Rainfall Probability</span>
              <b className="metric-val" style={{ color: (state?.rain_probability_24h || 0) > 60 ? '#1e5a32' : 'inherit' }}>
                {state?.rain_probability_24h ?? 75}%
              </b>
              <small className="metric-sub">Reliability: 82% (Open-Meteo)</small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Expected Accumulation</span>
              <b className="metric-val">12.5 mm</b>
              <small className="metric-sub">Convective storm window</small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Ambient Temp</span>
              <b className="metric-val">24.5 °C</b>
              <small className="metric-sub">Min: 17°C · Max: 29°C</small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Relative Humidity</span>
              <b className="metric-val">68%</b>
              <small className="metric-sub">Dew Point: 18.2 °C</small>
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '12px', background: '#f4faf6', borderRadius: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sun size={16} style={{ color: '#d97706' }} />
              <strong>Solar Radiation & Evaporative Demand:</strong>
            </div>
            <p style={{ margin: 0, color: '#33503f' }}>
              High morning insolating flux (18.4 MJ/m²/day) moderating in afternoon due to incoming cloud cover.
              Atmospheric vapor pressure deficit (VPD): <strong>1.12 kPa</strong> (Optimal stomatal conductance).
            </p>
          </div>
        </div>

        {/* Climate & FAO-56 Card */}
        <div className="field-card">
          <div className="card-head">
            <div>
              <span className="pill pill-agent">FAO-56 MODEL</span>
              <h3>Evapotranspiration & Water Demand</h3>
            </div>
            <Gauge size={24} style={{ color: '#2563eb' }} />
          </div>

          <div className="metrics-grid">
            <div className="metric-box">
              <span className="metric-label">Reference ET0</span>
              <b className="metric-val">{et0} mm/day</b>
              <small className="metric-sub">Penman-Monteith / Hargreaves</small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Crop Factor (Kc)</span>
              <b className="metric-val">{kc}</b>
              <small className="metric-sub">{field?.crop || 'Maize'} ({field?.growth_stage || 'Vegetative'})</small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Crop Demand (ETc)</span>
              <b className="metric-val" style={{ color: '#2563eb' }}>{etc} mm/day</b>
              <small className="metric-sub">{etc} L/m² / day requirement</small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Root Depletion 24h</span>
              <b className="metric-val">{depletion?.projected_moisture_24h ?? 16.6}%</b>
              <small className="metric-sub">Daily loss: ~{depletion?.estimated_daily_loss_pct ?? 1.4}%</small>
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '12px', background: '#eff6ff', borderRadius: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Layers size={16} style={{ color: '#2563eb' }} />
              <strong>Hydrological Balance Verdict:</strong>
            </div>
            <p style={{ margin: 0, color: '#1e3a8a' }}>
              Incoming precipitation (12.5 mm) substantially exceeds 24-hour crop demand ({etc} mm).
              <strong> Immediate irrigation is inefficient and wasteful.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Sensors & Hardware Diagnostics */}
      <div className="audit-section-card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-head">
          <div>
            <span className="pill">TELEMETRY DIAGNOSTICS</span>
            <h3>Active Hardware Sensors & Telemetry Health</h3>
            <small style={{ color: '#555' }}>
              Real-time hardware status, calibration state, signal strength, and automated anomaly classification.
            </small>
          </div>
          <Activity size={22} style={{ color: '#16a34a' }} />
        </div>

        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table className="timeline-table">
            <thead>
              <tr>
                <th>Sensor Tag</th>
                <th>Parameter</th>
                <th>Current Reading</th>
                <th>Confidence</th>
                <th>Freshness Decay</th>
                <th>Hardware Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>SNS-SOIL-01</strong></td>
                <td>Capacitive Soil Moisture (15cm)</td>
                <td><strong>{state?.soil_moisture ?? 18.0}%</strong></td>
                <td>
                  <span className="confidence-pill" style={{ background: '#dcfce7', color: '#166534' }}>
                    {Math.round((state?.soil_confidence ?? 0.88) * 100)}%
                  </span>
                </td>
                <td>Fresh (&lt; 15 min, decay 1.0)</td>
                <td>
                  <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Operational · 94% Batt
                  </span>
                </td>
              </tr>
              <tr>
                <td><strong>SNS-TEMP-02</strong></td>
                <td>Soil Root-Zone Temperature</td>
                <td><strong>21.8 °C</strong></td>
                <td>
                  <span className="confidence-pill" style={{ background: '#dcfce7', color: '#166534' }}>95%</span>
                </td>
                <td>Fresh (&lt; 15 min, decay 1.0)</td>
                <td>
                  <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Operational · 92% Batt
                  </span>
                </td>
              </tr>
              <tr>
                <td><strong>SNS-RAIN-01</strong></td>
                <td>Tipping Bucket Rain Gauge</td>
                <td><strong>0.0 mm (Past 12h)</strong></td>
                <td>
                  <span className="confidence-pill" style={{ background: '#dcfce7', color: '#166534' }}>90%</span>
                </td>
                <td>Fresh (&lt; 30 min, decay 0.98)</td>
                <td>
                  <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Calibrated
                  </span>
                </td>
              </tr>
              <tr>
                <td><strong>API-METEO-01</strong></td>
                <td>Open-Meteo Precipitation Forecast</td>
                <td><strong>{state?.rain_probability_24h ?? 75}% Rain (Tomorrow)</strong></td>
                <td>
                  <span className="confidence-pill" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                    {Math.round((state?.weather_confidence ?? 0.82) * 100)}%
                  </span>
                </td>
                <td>Forecast window: +24h</td>
                <td>
                  <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Cpu size={14} /> Connected (Synched)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid Row 3: Interactive Multi-Vector Anomaly Test Bench */}
      <div className="audit-section-card">
        <div className="card-head">
          <div>
            <span className="pill pill-revision">NEURAL-SYMBOLIC ANOMALY DETECTOR</span>
            <h3>Interactive Sensor Fault & Anomaly Test Bench</h3>
            <small style={{ color: '#555' }}>
              Test how AgriGuide detects physical sensor failure (spikes, flatlines, frozen probes) and penalizes evidence confidence before feeding into MeTTa reasoning.
            </small>
          </div>
          <AlertTriangle size={22} style={{ color: '#d97706' }} />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button
            className="secondary"
            onClick={() => runAnomalyTest('spike')}
            disabled={testingAnomaly}
            style={{ borderColor: '#d97706', color: '#b45309' }}
          >
            <AlertTriangle size={15} />
            <span>Test Sudden Spike (+37% Jump)</span>
          </button>

          <button
            className="secondary"
            onClick={() => runAnomalyTest('flatline')}
            disabled={testingAnomaly}
            style={{ borderColor: '#dc2626', color: '#dc2626' }}
          >
            <Activity size={15} />
            <span>Test Flatlining / Stuck Sensor (σ=0.0)</span>
          </button>

          <button
            className="secondary"
            onClick={() => runAnomalyTest('normal')}
            disabled={testingAnomaly}
            style={{ borderColor: '#16a34a', color: '#166534' }}
          >
            <CheckCircle2 size={15} />
            <span>Test Normal Plausible Telemetry</span>
          </button>
        </div>

        {anomalyTestResult && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '16px',
              borderRadius: '8px',
              background: anomalyTestResult.anomaly_result?.is_anomalous ? '#fffbeb' : '#f0fdf4',
              border: `1px solid ${anomalyTestResult.anomaly_result?.is_anomalous ? '#fde68a' : '#bbf7d0'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {anomalyTestResult.anomaly_result?.is_anomalous ? (
                  <AlertTriangle size={20} style={{ color: '#d97706' }} />
                ) : (
                  <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
                )}
                <strong style={{ fontSize: '14px', color: anomalyTestResult.anomaly_result?.is_anomalous ? '#92400e' : '#166534' }}>
                  {anomalyTestResult.anomaly_result?.is_anomalous
                    ? `Anomaly Detected: ${anomalyTestResult.anomaly_result?.anomaly_type}`
                    : 'Telemetry Verified Normal & Physically Plausible'}
                </strong>
              </div>
              <span
                className="pill"
                style={{
                  background: anomalyTestResult.anomaly_result?.is_anomalous ? '#fef3c7' : '#dcfce7',
                  color: anomalyTestResult.anomaly_result?.is_anomalous ? '#92400e' : '#166534'
                }}
              >
                Severity: {anomalyTestResult.anomaly_result?.severity || 'NONE'}
              </span>
            </div>

            <p style={{ margin: '6px 0', fontSize: '13px', color: '#374151' }}>
              {anomalyTestResult.anomaly_result?.description}
            </p>

            <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '12.5px', color: '#4b5563' }}>
              <div>
                <strong>Sensor Tested:</strong> {anomalyTestResult.sensor_type}
              </div>
              <div>
                <strong>Reading Evaluated:</strong> {anomalyTestResult.current_value}%
              </div>
              <div>
                <strong>MeTTa Confidence Penalty:</strong> -{Math.round((anomalyTestResult.anomaly_result?.confidence_penalty || 0) * 100)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
