import React, { useState } from 'react';
import {
  Droplets,
  CloudRain,
  Thermometer,
  Leaf,
  Send,
  Sparkles,
  CheckCircle,
  Clock,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  Sun,
  Activity,
  ArrowRight
} from 'lucide-react';
import { observe, decide } from '../lib/api';

interface ObservationStationProps {
  field: any;
  state: any;
  evidence: any[];
  busy: boolean;
  onObservationRecorded: () => void;
  onNavigateTab: (tab: string) => void;
}

export const ObservationStation: React.FC<ObservationStationProps> = ({
  field,
  state,
  evidence,
  busy: globalBusy,
  onObservationRecorded,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<'soil' | 'rain' | 'temp' | 'crop' | 'freeform'>('soil');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Deduplicate and aggregate facts by predicate + source
  const groupedEvidence = React.useMemo(() => {
    const map = new Map<string, { latest: any; count: number; history: any[] }>();
    for (const e of (evidence || [])) {
      const key = `${e.predicate}_${e.source_type}`;
      if (!map.has(key)) {
        map.set(key, { latest: e, count: 1, history: [] });
      } else {
        const item = map.get(key)!;
        item.count += 1;
        item.history.push(e);
      }
    }
    return Array.from(map.values());
  }, [evidence]);

  // Form states
  // 1. Soil Moisture
  const [soilMoisturePct, setSoilMoisturePct] = useState('14.5');
  const [soilDepth, setSoilDepth] = useState('15cm (Active Root Zone)');
  const [soilMethod, setSoilMethod] = useState('Tensiometer / Capacitance Probe');

  // 2. Rainfall
  const [rainEvent, setRainEvent] = useState('Heavy Downpour');
  const [rainAmountMm, setRainAmountMm] = useState('12.0');
  const [rainDuration, setRainDuration] = useState('45 minutes');

  // 3. Temperature
  const [tempVal, setTempVal] = useState('29.5');
  const [sunIntensity, setSunIntensity] = useState('Intense Direct Sun (Midday)');

  // 4. Crop Condition
  const [selectedCropSigns, setSelectedCropSigns] = useState<string[]>(['Leaves curling under heat']);
  const [cropStageNote, setCropStageNote] = useState('');

  // 5. Freeform Natural Observation
  const [naturalNote, setNaturalNote] = useState('');

  const submitObservation = async (messageText: string) => {
    if (!field?.id || !messageText.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const parsed = await observe(field.id, messageText.trim());
      // Re-evaluate field decision immediately
      const dec = await decide(field.id, 'FARMER_OBSERVATION');
      onObservationRecorded();

      const valStr = typeof parsed?.value === 'object' && parsed?.value?.value != null
        ? `${parsed.value.value}${parsed.value.unit ? ' ' + parsed.value.unit : ''}`
        : messageText;

      setFeedback({
        text: `Recorded: "${parsed?.predicate?.replaceAll('_', ' ')} (${valStr})". Advisory updated to ${dec.recommendation}!`,
        type: 'success'
      });
      setTimeout(() => setFeedback(null), 6000);
    } catch (err: any) {
      setFeedback({
        text: `Error logging observation: ${err.message}`,
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoilSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitObservation(`measured soil moisture is ${soilMoisturePct}% at ${soilDepth} using ${soilMethod}`);
  };

  const handleRainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitObservation(`${rainEvent} occurred with ${rainAmountMm}mm rainfall over ${rainDuration}`);
  };

  const handleTempSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitObservation(`temperature is ${tempVal}°C with ${sunIntensity}`);
  };

  const handleCropSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const signs = selectedCropSigns.join(', ');
    const note = cropStageNote ? ` (${cropStageNote})` : '';
    submitObservation(`crop observation: ${signs}${note}`);
  };

  const handleFreeformSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalNote.trim()) return;
    submitObservation(naturalNote);
    setNaturalNote('');
  };

  const toggleCropSign = (sign: string) => {
    if (selectedCropSigns.includes(sign)) {
      setSelectedCropSigns(selectedCropSigns.filter((s) => s !== sign));
    } else {
      setSelectedCropSigns([...selectedCropSigns, sign]);
    }
  };

  return (
    <div className="tab-container observation-station-view">
      {/* Header */}
      <section className="overview-welcome-card">
        <div className="welcome-left">
          <div className="greeting-eyebrow">
            <PlusCircle size={15} style={{ color: '#1e5a32' }} />
            <span>OBSERVATION & TELEMETRY STATION</span>
          </div>
          <h1>Record What You See in the Field</h1>
          <p className="welcome-subtitle">
            Ground AgriGuide in your real-world observations. Enter direct soil readings, storm rainfall,
            temperature, or qualitative crop symptoms. AgriGuide instantly recalculates its decision.
          </p>
        </div>

        <div className="field-context-summary-pill">
          <div>
            <span className="label">ACTIVE FIELD</span>
            <b>{field?.name || 'Selected Field'}</b>
            <small>{field?.crop} · {field?.growth_stage}</small>
          </div>
        </div>
      </section>

      {feedback && (
        <div className={`status-banner ${feedback.type}`}>
          {feedback.type === 'success' && <CheckCircle size={16} />}
          {feedback.type === 'error' && <AlertCircle size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main Grid: Observation Workbench + Recent Timeline */}
      <div className="observation-grid">
        {/* Left: Input Station */}
        <div className="obs-workbench-card">
          {/* Observation Mode Tabs */}
          <div className="obs-tab-bar">
            <button
              type="button"
              className={`obs-tab-btn ${activeTab === 'soil' ? 'active' : ''}`}
              onClick={() => setActiveTab('soil')}
            >
              <Droplets size={16} />
              <span>1. Soil Moisture</span>
            </button>

            <button
              type="button"
              className={`obs-tab-btn ${activeTab === 'rain' ? 'active' : ''}`}
              onClick={() => setActiveTab('rain')}
            >
              <CloudRain size={16} />
              <span>2. Rain & Precipitation</span>
            </button>

            <button
              type="button"
              className={`obs-tab-btn ${activeTab === 'temp' ? 'active' : ''}`}
              onClick={() => setActiveTab('temp')}
            >
              <Thermometer size={16} />
              <span>3. Temperature</span>
            </button>

            <button
              type="button"
              className={`obs-tab-btn ${activeTab === 'crop' ? 'active' : ''}`}
              onClick={() => setActiveTab('crop')}
            >
              <Leaf size={16} />
              <span>4. Crop Symptoms</span>
            </button>

            <button
              type="button"
              className={`obs-tab-btn ${activeTab === 'freeform' ? 'active' : ''}`}
              onClick={() => setActiveTab('freeform')}
            >
              <Sparkles size={16} />
              <span>5. Natural Note</span>
            </button>
          </div>

          <div className="obs-form-body">
            {/* Tab 1: Soil Moisture */}
            {activeTab === 'soil' && (
              <form onSubmit={handleSoilSubmit} className="obs-form">
                <div className="form-info-callout">
                  <Droplets size={18} color="#1e5a32" />
                  <div>
                    <strong>Record Soil Moisture Telemetry</strong>
                    <p>Enter a calibrated sensor probe reading or hand-feel test result.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Soil Moisture Percentage (%)</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={soilMoisturePct}
                      onChange={(e) => setSoilMoisturePct(e.target.value)}
                      required
                    />
                    <span className="unit-label">% volumetric</span>
                  </div>
                </div>

                <div className="quick-chip-row">
                  <span className="chips-label">Quick Values:</span>
                  <button type="button" className="quick-chip" onClick={() => setSoilMoisturePct('10.2')}>10.2% (Wilting)</button>
                  <button type="button" className="quick-chip" onClick={() => setSoilMoisturePct('15.5')}>15.5% (Marginal)</button>
                  <button type="button" className="quick-chip" onClick={() => setSoilMoisturePct('22.0')}>22.0% (Hydrated)</button>
                  <button type="button" className="quick-chip" onClick={() => setSoilMoisturePct('28.5')}>28.5% (Field Capacity)</button>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Measurement Depth</label>
                    <select value={soilDepth} onChange={(e) => setSoilDepth(e.target.value)}>
                      <option value="15cm (Active Root Zone)">15cm (Active Root Zone)</option>
                      <option value="30cm (Deep Root Buffer)">30cm (Deep Root Buffer)</option>
                      <option value="5cm (Surface Crust)">5cm (Surface Crust)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Reading Source</label>
                    <select value={soilMethod} onChange={(e) => setSoilMethod(e.target.value)}>
                      <option value="Tensiometer / Capacitance Probe">Tensiometer / Digital Probe</option>
                      <option value="Hand-Feel Ball Squeeze Test">Hand-Feel Ball Squeeze Test</option>
                      <option value="Soil Corer / Laboratory Analysis">Soil Corer / Lab Analysis</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="primary-submit-btn" disabled={submitting || globalBusy}>
                  <Send size={15} />
                  <span>{submitting ? 'Recording & Evaluating...' : 'Log Soil Moisture & Re-evaluate'}</span>
                </button>
              </form>
            )}

            {/* Tab 2: Rain & Precipitation */}
            {activeTab === 'rain' && (
              <form onSubmit={handleRainSubmit} className="obs-form">
                <div className="form-info-callout">
                  <CloudRain size={18} color="#0f52ba" />
                  <div>
                    <strong>Record Rainfall Event / Storm</strong>
                    <p>Report rain observed on the farm to verify weather forecast accuracy.</p>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Precipitation Intensity</label>
                    <select value={rainEvent} onChange={(e) => setRainEvent(e.target.value)}>
                      <option value="Heavy Downpour">Heavy Downpour / Torrential</option>
                      <option value="Moderate Steady Rain">Moderate Steady Rain</option>
                      <option value="Light Drizzle">Light Drizzle / Mist</option>
                      <option value="No Rain Despite Forecast">No Rain (Forecast Failed)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Rain Gauge Accumulation (mm)</label>
                    <div className="input-with-unit">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={rainAmountMm}
                        onChange={(e) => setRainAmountMm(e.target.value)}
                        required
                      />
                      <span className="unit-label">mm</span>
                    </div>
                  </div>
                </div>

                <div className="quick-chip-row">
                  <span className="chips-label">Quick Amounts:</span>
                  <button type="button" className="quick-chip" onClick={() => { setRainAmountMm('0'); setRainEvent('No Rain'); }}>0 mm</button>
                  <button type="button" className="quick-chip" onClick={() => { setRainAmountMm('3.5'); setRainEvent('Light Drizzle'); }}>3.5 mm</button>
                  <button type="button" className="quick-chip" onClick={() => { setRainAmountMm('12.0'); setRainEvent('Moderate Steady Rain'); }}>12.0 mm</button>
                  <button type="button" className="quick-chip" onClick={() => { setRainAmountMm('25.0'); setRainEvent('Heavy Downpour'); }}>25.0 mm</button>
                </div>

                <div className="form-group">
                  <label>Duration of Rain</label>
                  <input
                    type="text"
                    value={rainDuration}
                    onChange={(e) => setRainDuration(e.target.value)}
                    placeholder="e.g. 45 minutes, 2 hours"
                  />
                </div>

                <button type="submit" className="primary-submit-btn" disabled={submitting || globalBusy}>
                  <Send size={15} />
                  <span>{submitting ? 'Recording & Evaluating...' : 'Log Rain Event & Re-evaluate'}</span>
                </button>
              </form>
            )}

            {/* Tab 3: Temperature */}
            {activeTab === 'temp' && (
              <form onSubmit={handleTempSubmit} className="obs-form">
                <div className="form-info-callout">
                  <Thermometer size={18} color="#d95a00" />
                  <div>
                    <strong>Record Real-Time Ambient Temperature</strong>
                    <p>Thermal conditions directly drive crop evapotranspiration (ETc).</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Current Temperature (°C)</label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      step="0.5"
                      min="5"
                      max="50"
                      value={tempVal}
                      onChange={(e) => setTempVal(e.target.value)}
                      required
                    />
                    <span className="unit-label">°C</span>
                  </div>
                </div>

                <div className="quick-chip-row">
                  <span className="chips-label">Common Thermal States:</span>
                  <button type="button" className="quick-chip" onClick={() => { setTempVal('19.0'); setSunIntensity('Cool Morning'); }}>19.0°C (Cool Morning)</button>
                  <button type="button" className="quick-chip" onClick={() => { setTempVal('25.5'); setSunIntensity('Mild Afternoon'); }}>25.5°C (Mild Afternoon)</button>
                  <button type="button" className="quick-chip" onClick={() => { setTempVal('32.0'); setSunIntensity('High Heat Stress'); }}>32.0°C (Heat Stress)</button>
                  <button type="button" className="quick-chip" onClick={() => { setTempVal('36.0'); setSunIntensity('Extreme Heatwave'); }}>36.0°C (Extreme Heat)</button>
                </div>

                <div className="form-group">
                  <label>Sunlight & Sky Condition</label>
                  <select value={sunIntensity} onChange={(e) => setSunIntensity(e.target.value)}>
                    <option value="Intense Direct Sun (Midday)">Intense Direct Sun (Midday)</option>
                    <option value="Clear Sky Warm Sun">Clear Sky Warm Sun</option>
                    <option value="Overcast / Cloud Covered">Overcast / Cloud Covered</option>
                    <option value="Cool Morning Light">Cool Morning Light</option>
                  </select>
                </div>

                <button type="submit" className="primary-submit-btn" disabled={submitting || globalBusy}>
                  <Send size={15} />
                  <span>{submitting ? 'Recording & Evaluating...' : 'Log Temperature & Re-evaluate'}</span>
                </button>
              </form>
            )}

            {/* Tab 4: Crop Symptoms */}
            {activeTab === 'crop' && (
              <form onSubmit={handleCropSubmit} className="obs-form">
                <div className="form-info-callout">
                  <Leaf size={18} color="#257038" />
                  <div>
                    <strong>Visual Crop Phenology & Stress Symptoms</strong>
                    <p>Select physiological signals observed in your crop canopy.</p>
                  </div>
                </div>

                <div className="checkbox-symptom-grid">
                  {[
                    'Leaves curling under heat',
                    'Lower leaves yellowing (chlorosis)',
                    'Canopy wilting in afternoon',
                    'Vigorous dark green growth',
                    'Flowering in full bloom',
                    'Silking / Tasseling underway',
                    'Early signs of pest damage',
                    'Cracked dry soil surface'
                  ].map((sign) => {
                    const checked = selectedCropSigns.includes(sign);
                    return (
                      <label
                        key={sign}
                        className={`symptom-checkbox-card ${checked ? 'checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCropSign(sign)}
                        />
                        <span>{sign}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Additional Agronomic Notes</label>
                  <input
                    type="text"
                    value={cropStageNote}
                    onChange={(e) => setCropStageNote(e.target.value)}
                    placeholder="e.g. 30% of field shows curling, irrigation drippers active yesterday"
                  />
                </div>

                <button type="submit" className="primary-submit-btn" disabled={submitting || globalBusy || selectedCropSigns.length === 0}>
                  <Send size={15} />
                  <span>{submitting ? 'Recording & Evaluating...' : 'Log Crop Symptoms & Re-evaluate'}</span>
                </button>
              </form>
            )}

            {/* Tab 5: Natural Language Observation */}
            {activeTab === 'freeform' && (
              <form onSubmit={handleFreeformSubmit} className="obs-form">
                <div className="form-info-callout">
                  <Sparkles size={18} color="#b26b00" />
                  <div>
                    <strong>Tell AgriGuide What You See in Natural Language</strong>
                    <p>AgriGuide's perception parser will extract moisture, weather, or crop status automatically.</p>
                  </div>
                </div>

                <div className="form-group">
                  <label>Your Observation</label>
                  <textarea
                    rows={4}
                    value={naturalNote}
                    onChange={(e) => setNaturalNote(e.target.value)}
                    placeholder="e.g. 'Dark storm clouds rolling over the mountain, wind picking up fast, rain expected within an hour' or 'Checked soil around roots at 15cm, feels very dry like powder, moisture probe read 11%'"
                    required
                  />
                </div>

                <div className="quick-chip-row">
                  <span className="chips-label">Sample Statements:</span>
                  <button
                    type="button"
                    className="quick-chip"
                    onClick={() => setNaturalNote("Dark storm clouds gathering over Mt Kenya ridge; wind picking up.")}
                  >
                    ⛈️ Dark storm clouds gathering
                  </button>
                  <button
                    type="button"
                    className="quick-chip"
                    onClick={() => setNaturalNote("Measured soil moisture is 10.5% in root zone, leaves are wilting.")}
                  >
                    💧 Soil moisture 10.5%, wilting
                  </button>
                  <button
                    type="button"
                    className="quick-chip"
                    onClick={() => setNaturalNote("Heavy rain fell for 1 hour, field is saturated with puddles.")}
                  >
                    🌧️ Heavy rain fell for 1 hour
                  </button>
                </div>

                <button type="submit" className="primary-submit-btn" disabled={submitting || globalBusy || !naturalNote.trim()}>
                  <Send size={15} />
                  <span>{submitting ? 'Parsing & Evaluating...' : 'Submit Observation to AgriGuide'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right: Active Field Evidence Context */}
        <div className="evidence-timeline-card">
          <div className="timeline-header">
            <div>
              <h3>Active Evidence Log</h3>
              <p>Auditable sensory and observation records</p>
            </div>
            <span className="evidence-counter-badge">
              {groupedEvidence.length} unique facts · {evidence.length} events
            </span>
          </div>

          <div className="evidence-feed-list">
            {groupedEvidence.length === 0 ? (
              <div className="empty-feed">
                <p>No observations recorded yet. Submit your first observation on the left!</p>
              </div>
            ) : (
              groupedEvidence.slice(0, 10).map(({ latest: e, count }) => (
                <div key={e.id} className="evidence-item-card">
                  <div className="item-head">
                    <span className="item-pred">{e.predicate?.replaceAll('_', ' ').toUpperCase()}</span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {count > 1 && (
                        <span style={{ fontSize: '10px', background: '#e0efe4', color: '#165e32', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                          {count} events
                        </span>
                      )}
                      <span className="item-source-tag">{e.source_type}</span>
                    </div>
                  </div>
                  <div className="item-val">
                    {typeof e.value === 'object'
                      ? (e.value.text || (e.value.value != null ? `${e.value.value} ${e.value.unit || ''}` : JSON.stringify(e.value)))
                      : String(e.value)}
                  </div>
                  <div className="item-meta">
                    <span>Confidence: {Math.round(e.confidence * 100)}%</span>
                    <span>{new Date(e.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="timeline-actions">
            <button
              className="ghost-action-btn"
              onClick={() => onNavigateTab('decision-diff')}
            >
              See Decision Diff ("What Changed?") →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
