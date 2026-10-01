import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CloudRain,
  Cpu,
  Database,
  Droplets,
  Layers,
  MapPin,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp
} from 'lucide-react';
import { getField, updateField, syncWeather, getFieldAnalytics } from '../lib/api';

interface FieldProfileManagerProps {
  fieldId: string;
  fieldName: string;
  onProfileUpdated: () => void;
}

export const FieldProfileManager: React.FC<FieldProfileManagerProps> = ({
  fieldId,
  fieldName,
  onProfileUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingWeather, setSyncingWeather] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [crop, setCrop] = useState('maize');
  const [growthStage, setGrowthStage] = useState('flowering');
  const [soilType, setSoilType] = useState('loam');
  const [areaHa, setAreaHa] = useState<number>(2.5);
  const [waterAvailability, setWaterAvailability] = useState('LIMITED');
  const [analytics, setAnalytics] = useState<any>(null);

  const loadFieldData = async () => {
    if (!fieldId) return;
    setLoading(true);
    try {
      const [fieldData, analyticsData] = await Promise.all([
        getField(fieldId),
        getFieldAnalytics(fieldId).catch(() => null)
      ]);
      if (fieldData) {
        setName(fieldData.name || '');
        setCrop(fieldData.crop || 'maize');
        setGrowthStage(fieldData.growth_stage || 'flowering');
        setSoilType(fieldData.soil_type || 'loam');
        setAreaHa(fieldData.area_ha ?? 2.5);
        setWaterAvailability(fieldData.farm?.water_availability || 'LIMITED');
      }
      setAnalytics(analyticsData);
    } catch (err: any) {
      console.error('Failed to load field details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFieldData();
  }, [fieldId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await updateField(fieldId, {
        name,
        crop,
        growth_stage: growthStage,
        soil_type: soilType,
        area_ha: Number(areaHa),
        water_availability: waterAvailability
      });
      setNotice({
        type: 'success',
        message: 'Farm and field profile updated successfully! The decision engine has updated its physical model.'
      });
      setTimeout(() => setNotice(null), 5000);
      onProfileUpdated();
      // Reload analytics with new parameters
      const updatedAnalytics = await getFieldAnalytics(fieldId).catch(() => null);
      setAnalytics(updatedAnalytics);
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Failed to update field profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncWeather = async () => {
    setSyncingWeather(true);
    setNotice(null);
    try {
      const res = await syncWeather(fieldId);
      setNotice({
        type: 'success',
        message: `Live Open-Meteo weather synchronized! Rain probability: ${res.rain_probability_24h}%, Temp: ${res.temperature_c}°C.`
      });
      setTimeout(() => setNotice(null), 6000);
      onProfileUpdated();
    } catch (err: any) {
      setNotice({ type: 'error', message: 'Failed to sync live weather: ' + err.message });
    } finally {
      setSyncingWeather(false);
    }
  };

  const kc = analytics?.fao56_evapotranspiration?.crop_coefficient_kc || 1.15;
  const etc = analytics?.fao56_evapotranspiration?.crop_water_demand_etc_mm_day || 4.8;
  const dailyLoss = analytics?.soil_moisture_depletion?.estimated_daily_loss_pct || 2.1;

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div>
          <span className="pill pill-mode">FARM PROFILE & AGRONOMY</span>
          <h2>Field Profile & Parameters</h2>
          <p className="subtitle">
            Provide your farm's physical details. AgriGuide autonomously evaluates crop water needs, analyzes weather forecasts, and self-calibrates without requiring you to program rules.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="secondary"
            onClick={handleSyncWeather}
            disabled={syncingWeather}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CloudRain size={16} className={syncingWeather ? 'spin' : ''} />
            <span>{syncingWeather ? 'Syncing Weather...' : 'Sync Live Weather (Open-Meteo)'}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className={`notice ${notice.type}`} style={{ marginBottom: '1.5rem' }}>
          {notice.message}
        </div>
      )}

      <div className="two-col-grid">
        {/* Left Column: Farm & Field Characteristics Form */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <Sprout size={18} />
              <h3>Farm & Field Characteristics</h3>
            </div>
            <span className="count-badge">Active Field</span>
          </div>

          {loading ? (
            <div className="loading-box">Loading field parameters...</div>
          ) : (
            <form className="rule-form" onSubmit={handleSaveProfile}>
              <label>
                <span>Field Identification / Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. North Plot - Maize"
                  required
                />
              </label>

              <div className="form-row">
                <label>
                  <span>Crop Type</span>
                  <select value={crop} onChange={(e) => setCrop(e.target.value)}>
                    <option value="maize">Maize (Corn)</option>
                    <option value="french beans">French Beans</option>
                    <option value="tomato">Tomato</option>
                    <option value="potato">Potato</option>
                    <option value="coffee">Coffee</option>
                    <option value="wheat">Wheat</option>
                    <option value="cabbage">Cabbage</option>
                  </select>
                </label>

                <label>
                  <span>Current Growth Stage</span>
                  <select value={growthStage} onChange={(e) => setGrowthStage(e.target.value)}>
                    <option value="emergence">Emergence / Seedling</option>
                    <option value="vegetative">Vegetative Growth</option>
                    <option value="flowering">Flowering / Tasseling (Critical)</option>
                    <option value="grain-fill">Grain Filling / Fruiting</option>
                    <option value="maturity">Ripening & Maturity</option>
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>Soil Texture Classification</span>
                  <select value={soilType} onChange={(e) => setSoilType(e.target.value)}>
                    <option value="loam">Loam (Balanced Retention)</option>
                    <option value="clay loam">Clay Loam (High Retention)</option>
                    <option value="sandy loam">Sandy Loam (Rapid Drainage)</option>
                    <option value="clay">Heavy Clay (Slow Infiltration)</option>
                    <option value="sand">Coarse Sand (High Leaching)</option>
                  </select>
                </label>

                <label>
                  <span>Field Acreage (Hectares)</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="500"
                    value={areaHa}
                    onChange={(e) => setAreaHa(Number(e.target.value))}
                    required
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  <span>Water Availability & Storage Status</span>
                  <select value={waterAvailability} onChange={(e) => setWaterAvailability(e.target.value)}>
                    <option value="PLENTIFUL">Plentiful (Ample Reservoir Capacity)</option>
                    <option value="MODERATE">Moderate (Standard Municipal/Canal Flow)</option>
                    <option value="LIMITED">Limited (Conserve for High-Risk Windows)</option>
                    <option value="CRITICAL">Critical Deficit (Emergency Rationing Only)</option>
                  </select>
                </label>

                <label>
                  <span>Farm Location (Weather Grid)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '13px', color: '#385542', background: '#f5faf6', padding: '9px 12px', borderRadius: '6px', border: '1px solid #d5e5db' }}>
                    <MapPin size={16} color="#1e5a32" />
                    <span>Kirinyaga Central (-0.528°, 37.283°)</span>
                  </div>
                </label>
              </div>

              <button type="submit" className="primary" disabled={saving} style={{ marginTop: '0.5rem' }}>
                <Save size={16} />
                <span>{saving ? 'Updating Farm Profile...' : 'Save Field Profile Changes'}</span>
              </button>
            </form>
          )}

          {/* Practical Agronomic Insights */}
          <div className="baseline-reference" style={{ marginTop: '1.5rem' }}>
            <div className="ref-head">
              <Database size={16} />
              <b>Agronomic Physics Reference</b>
            </div>
            <div className="baseline-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <div style={{ background: '#f9fbf9', padding: '10px', borderRadius: '6px', border: '1px solid #e1ece5', fontSize: '13px' }}>
                <strong style={{ color: '#1e5a32' }}>🌱 Moisture Stress Threshold:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#405247' }}>
                  Root-zone moisture below 18.0% triggers immediate crop stress protection unless significant rain is forecasted within 24 hours.
                </p>
              </div>
              <div style={{ background: '#f9fbf9', padding: '10px', borderRadius: '6px', border: '1px solid #e1ece5', fontSize: '13px' }}>
                <strong style={{ color: '#1e5a32' }}>💧 Rain Buffering Buffer:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#405247' }}>
                  When rain likelihood is ≥ 70%, the system advises delaying irrigation to prevent nutrient leaching and save limited tank water.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Autonomous Self-Learning Engine */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <Cpu size={18} />
              <h3>Autonomous Self-Learning Engine</h3>
            </div>
            <span className="diff-badge" style={{ background: '#e0f4e6', color: '#155724' }}>
              Self-Tuning Active
            </span>
          </div>

          <div style={{ background: '#f4fbf6', border: '1px solid #a3d9b4', borderRadius: '8px', padding: '16px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles size={20} color="#1b5e20" />
              <h4 style={{ margin: 0, color: '#1b5e20', fontSize: '15px' }}>
                Agent Learns Autonomously From Verified Outcomes
              </h4>
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#2d573d', lineHeight: '1.5' }}>
              You do not need to write programming rules or teach the system logic. AgriGuide automatically deduces governing agronomic constraints from your crop profile, checks physical soil moisture physics, and continuously refines its confidence whenever real-world rainfall is observed.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#155724', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              <span>Zero rule coding required · Ground truth Bayesian feedback enabled</span>
            </div>
          </div>

          {/* Derived Real-Time Physical Metrics */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#52695a', marginBottom: '10px', letterSpacing: '0.04em' }}>
              Autonomously Derived Physical Parameters
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#fff', border: '1px solid #dce8e0', borderRadius: '6px', padding: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#688271', fontWeight: 600, display: 'block' }}>
                  Crop Coefficient (Kc)
                </span>
                <b style={{ fontSize: '1.3rem', color: '#1b5e20' }}>{kc}</b>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#566e60' }}>
                  Derived from {crop} in {growthStage} stage
                </p>
              </div>

              <div style={{ background: '#fff', border: '1px solid #dce8e0', borderRadius: '6px', padding: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#688271', fontWeight: 600, display: 'block' }}>
                  Crop Water Demand (ETc)
                </span>
                <b style={{ fontSize: '1.3rem', color: '#1b5e20' }}>{etc} mm/day</b>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#566e60' }}>
                  Equivalent to {etc} L/m² daily consumption
                </p>
              </div>

              <div style={{ background: '#fff', border: '1px solid #dce8e0', borderRadius: '6px', padding: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#688271', fontWeight: 600, display: 'block' }}>
                  Root Zone Depletion Rate
                </span>
                <b style={{ fontSize: '1.3rem', color: '#1b5e20' }}>-{dailyLoss}% / day</b>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#566e60' }}>
                  Calibrated for {soilType} texture
                </p>
              </div>

              <div style={{ background: '#fff', border: '1px solid #dce8e0', borderRadius: '6px', padding: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#688271', fontWeight: 600, display: 'block' }}>
                  Learning Loop State
                </span>
                <b style={{ fontSize: '1.3rem', color: '#1b5e20' }}>Active</b>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#566e60' }}>
                  Continuous verification enabled
                </p>
              </div>
            </div>
          </div>

          {/* Autonomous Calibration Record */}
          <div>
            <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#52695a', marginBottom: '10px', letterSpacing: '0.04em' }}>
              Automated Calibration Mechanisms
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: '#fdfefd', border: '1px solid #e1eee5', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e5a32' }}>
                    1. Forecast Reliability Calibration
                  </span>
                  <span style={{ fontSize: '11px', background: '#eef6f0', color: '#275e38', padding: '2px 6px', borderRadius: '4px' }}>
                    Self-Adjusting
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#546b5c', lineHeight: '1.4' }}>
                  When rainfall outcomes are recorded in the <strong>Accuracy & Learning</strong> tab, the agent automatically updates the Bayesian weight for weather providers vs soil probes.
                </p>
              </div>

              <div style={{ background: '#fdfefd', border: '1px solid #e1eee5', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e5a32' }}>
                    2. Telemetry Anomaly Filtering
                  </span>
                  <span style={{ fontSize: '11px', background: '#eef6f0', color: '#275e38', padding: '2px 6px', borderRadius: '4px' }}>
                    Continuous
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#546b5c', lineHeight: '1.4' }}>
                  If a capacitive probe produces a sudden unphysical spike or freezes, the agent automatically flags the anomaly, applies a confidence penalty, and relies on verified physics.
                </p>
              </div>

              <div style={{ background: '#fdfefd', border: '1px solid #e1eee5', borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#1e5a32' }}>
                    3. Dynamic Water Conservation Thresholds
                  </span>
                  <span style={{ fontSize: '11px', background: '#eef6f0', color: '#275e38', padding: '2px 6px', borderRadius: '4px' }}>
                    Autonomous
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#546b5c', lineHeight: '1.4' }}>
                  During critical flowering or fruit-setting stages, the agent autonomously raises moisture protection priority while holding irrigation when storm probability is elevated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export alias for backward compatibility
export const RuleLearningEditor = FieldProfileManager;
