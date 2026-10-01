import React, { useEffect, useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  CloudRain,
  Cpu,
  Database,
  Droplets,
  GitBranch,
  Leaf,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Scale,
  Send,
  Sparkles,
  Sprout,
  Sun,
  Thermometer,
  Wind,
  Zap,
  RotateCcw
} from 'lucide-react';
import { TabType } from './Sidebar';
import { getLLMModels, getLLMStatus, switchLLMModel } from '../lib/api';
import { getDynamicSuggestedQuestions } from '../lib/suggestedQuestions';

const formatEvidenceValue = (val: any) => {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'object') {
    if (val.text) return val.text;
    if (val.probability !== undefined) return `${val.probability}% rain probability (${val.timeframe || '24h'})`;
    if (val.value !== undefined) return `${val.value}${val.unit ? ' ' + val.unit : ''}`;
    if (val.raw) return val.raw;
    return Object.entries(val).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join(', ');
  }
  return String(val);
};

interface FieldIntelligenceProps {
  field: any;
  state: any;
  evidence: any[];
  decisions: any[];
  busy: boolean;
  consultHistory: Array<{ id?: string; role: 'farmer' | 'agent'; text: string; grounded?: boolean; timestamp?: string }>;
  consulting: boolean;
  onSendConsult: (query: string) => Promise<string>;
  onClearConsult: () => void;
  onRunAgent: () => void;
  onSimulateRain: () => void;
  onSyncWeather?: () => void;
  onSendObservation: (msg: string) => void;
  onNavigateTab: (tab: TabType) => void;
  onSelectDecisionForAudit: (decisionId: string) => void;
  userName?: string;
}

export const FieldIntelligence: React.FC<FieldIntelligenceProps> = ({
  field,
  state,
  evidence,
  decisions,
  busy,
  consultHistory,
  consulting,
  userName,
  onSendConsult,
  onClearConsult,
  onRunAgent,
  onSimulateRain,
  onSyncWeather,
  onSendObservation,
  onNavigateTab,
  onSelectDecisionForAudit
}) => {
  const [obsInput, setObsInput] = useState('');
  const [tempInput, setTempInput] = useState<string>('28.5');
  const [llmStatus, setLlmStatus] = useState<any>(null);
  const [modelList, setModelList] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('minimax/minimax-m3');
  const [switchingModel, setSwitchingModel] = useState<boolean>(false);
  const [consultQuery, setConsultQuery] = useState('');

  const currentDecision = decisions && decisions.length > 0 ? decisions[0] : null;
  const suggestedQuestions = useMemo(() => {
    return getDynamicSuggestedQuestions({
      decision: currentDecision,
      field,
      state,
      decisions,
      language: 'en'
    });
  }, [currentDecision, field, state, decisions]);

  useEffect(() => {
    getLLMStatus().then((st) => {
      setLlmStatus(st);
      if (st?.model) setSelectedModel(st.model);
    }).catch(() => {});

    getLLMModels().then((data) => {
      if (data?.models) setModelList(data.models);
      if (data?.active_model) setSelectedModel(data.active_model);
    }).catch(() => {});
  }, []);

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    setSwitchingModel(true);
    try {
      const updated = await switchLLMModel(newModel);
      setLlmStatus(updated);
    } catch (e) {
      console.error('Failed to switch model:', e);
    } finally {
      setSwitchingModel(false);
    }
  };

  const effectiveFieldId = field?.id || state?.field_id;

  const executeConsult = async (queryText: string) => {
    if (!queryText.trim() || consulting) return;
    const q = queryText.trim();
    setConsultQuery('');
    await onSendConsult(q);
  };

  const handleConsult = (e: React.FormEvent) => {
    e.preventDefault();
    executeConsult(consultQuery);
  };

  const handleSendObs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsInput.trim()) return;
    onSendObservation(obsInput);
    setObsInput('');
  };

  const handleCustomTempSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempInput);
    if (isNaN(val)) return;
    onSendObservation(`temperature is ${val}°C`);
  };

  const getRecClass = (rec: string | undefined) => {
    if (!rec) return 'rec-neutral';
    switch (rec.toUpperCase()) {
      case 'IRRIGATE':
        return 'rec-irrigate';
      case 'WAIT':
        return 'rec-wait';
      case 'REASSESS':
        return 'rec-reassess';
      default:
        return 'rec-neutral';
    }
  };

  const activeModelMeta = modelList.find((m) => m.id === selectedModel);

  // Deduplicate evidence to show latest state per predicate and source
  const uniqueEvidence = React.useMemo(() => {
    const map = new Map<string, any>();
    for (const item of (evidence || [])) {
      const key = `${item.predicate}_${item.source_type}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values());
  }, [evidence]);

  return (
    <div className="tab-container">
      {/* Clean Field Context Header Ribbon */}
      <div className="field-context-ribbon">
        <div className="ribbon-left">
          <Sprout size={18} style={{ color: '#1e5a32' }} />
          <span>Active Field: <strong>{field?.name || 'Selected Field'}</strong> ({field?.crop || 'Maize'}, {field?.growth_stage || 'Flowering'})</span>
          <span className="ribbon-loc">📍 {field?.farm || 'Demonstration Farm'}</span>
        </div>
        <div className="ribbon-right">
          <span className="live-status-dot">
            <span className="dot-pulse"></span>
            Telemetry Synchronized
          </span>
          <span className="pill pill-mode">Agricultural Decision Engine</span>
        </div>
      </div>

      {/* Top Banner if multi-source conflicts detected */}
      {state?.has_conflicts && (
        <div className="alert-card warning">
          <AlertTriangle size={20} className="alert-icon" />
          <div className="alert-body">
            <b>Multi-Source Evidence Conflict Detected</b>
            {state.conflicts.map((c: any, idx: number) => (
              <p key={idx}>{c.description}</p>
            ))}
            <small>Decision confidence was automatically discounted to reflect sensory uncertainty.</small>
          </div>
        </div>
      )}

      {/* Main Grid: Field Context & Cognitive Decision */}
      <section className="hero-grid">
        {/* Field Card */}
        <div className="field-card">
          <div className="card-head">
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="pill">ACTIVE FIELD TELEMETRY</span>
                <span className="pill" title="Verified Agronomic Decision Engine">
                  <Sparkles size={11} style={{ marginRight: '4px' }} />
                  AUDITABLE BY DESIGN
                </span>
              </div>
              <h2>{field?.name || 'Loading field...'}</h2>
              <p className="field-subtitle">
                {field?.farm} · Crop: <strong>{field?.crop}</strong> ({field?.growth_stage})
              </p>
            </div>
            <div className="plant-avatar">
              <Leaf size={28} />
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-box" style={{ borderLeft: '3px solid #e06d10', background: '#fffcf7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Thermometer size={13} style={{ color: '#d95a00' }} />
                  <span>Current Temp</span>
                </span>
                <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: '#ffe8d4', color: '#8a3800', fontWeight: 600 }}>
                  {state?.temperature_source === 'FARMER' ? 'Farmer Logged' : 'Open-Meteo'}
                </span>
              </div>
              <b className="metric-val" style={{ color: '#9c4100' }}>
                {state?.temperature_c != null ? `${state.temperature_c}°C` : '25.3°C'}
              </b>
              <small className="metric-sub">
                {(state?.temperature_c || 25) > 30 ? 'Thermal Stress Risk' : (state?.temperature_c || 25) > 22 ? 'Active Transpiration' : 'Cool Range'}
              </small>
            </div>

            <div className="metric-box" style={{ borderLeft: '3px solid #1e5a32' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Droplets size={13} style={{ color: '#1e5a32' }} />
                  <span>Soil Moisture</span>
                </span>
                <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: '#e3f2e8', color: '#144c27', fontWeight: 600 }}>
                  {Math.round((state?.soil_confidence || 0.95) * 100)}% Conf
                </span>
              </div>
              <b className="metric-val" style={{ color: (state?.soil_moisture || 0) < 18 ? '#a73b00' : '#144c27' }}>
                {state?.soil_moisture != null ? `${state.soil_moisture}%` : '—'}
              </b>
              <small className="metric-sub">
                {(state?.soil_moisture || 0) < 18 ? 'Below Wilting Point (Dry)' : 'Adequate Root Moisture'}
              </small>
            </div>

            <div className="metric-box" style={{ borderLeft: '3px solid #1a5ea8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CloudRain size={13} style={{ color: '#1a5ea8' }} />
                  <span>Rain Forecast (24h)</span>
                </span>
                <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: '#e5f0fc', color: '#15457a', fontWeight: 600 }}>
                  {Math.round((state?.weather_confidence || 0.85) * 100)}% Conf
                </span>
              </div>
              <b className="metric-val" style={{ color: (state?.rain_probability_24h || 0) > 50 ? '#104e96' : '#22382c' }}>
                {state?.rain_probability_24h != null ? `${state.rain_probability_24h}%` : '—'}
              </b>
              <small className="metric-sub">
                {(state?.rain_probability_24h || 0) >= 60 ? 'Precipitation Probable' : 'Low Rain Likelihood'}
              </small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Relative Humidity</span>
              <b className="metric-val">{state?.humidity_pct != null ? `${state.humidity_pct}%` : '68%'}</b>
              <small className="metric-sub">Vapor Deficit: 1.12 kPa</small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Wind Speed</span>
              <b className="metric-val">{state?.wind_speed_kmh != null ? `${state.wind_speed_kmh} km/h` : '9.6 km/h'}</b>
              <small className="metric-sub">Safe Spray Window</small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Water Reserve</span>
              <b className="metric-val">{state?.water_availability || 'LIMITED'}</b>
              <small className="metric-sub">Farm Tank Capacity</small>
            </div>
          </div>

          <div className="field-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button className="primary" onClick={onRunAgent} disabled={busy}>
              <Zap size={16} />
              <span>{busy ? 'Evaluating Farm Telemetry...' : '⚡ Run Decision Engine'}</span>
            </button>
            {onSyncWeather && (
              <button
                className="secondary"
                onClick={onSyncWeather}
                disabled={busy}
                title="Fetch live real-time forecast from Open-Meteo East Africa"
                style={{ borderColor: '#0f52ba', color: '#0f52ba', fontWeight: 600 }}
              >
                <RefreshCw size={15} />
                <span>🌤️ Sync Live Weather (Open-Meteo)</span>
              </button>
            )}
            <button className="secondary" onClick={onSimulateRain} disabled={busy}>
              <CloudRain size={16} />
              <span>🌧️ Simulate Storm (82%)</span>
            </button>
          </div>
        </div>

        {/* Cognitive Decision Card */}
        <div className="decision-card">
          <div className="card-head">
            <div>
              <span className="pill pill-agent">RECOMMENDED ACTION</span>
              <h3>Today's Action Advisory</h3>
            </div>
            {currentDecision?.supersedes_id && (
              <span className="pill pill-revision">SUPERSEDED REVISION</span>
            )}
          </div>

          {currentDecision ? (
            <div className="decision-content">
              <div className="rec-row">
                <span className={`decision-badge ${getRecClass(currentDecision.recommendation)}`}>
                  {currentDecision.recommendation}
                </span>
                <span className="confidence-pill">
                  {Math.round((currentDecision.confidence || 0) * 100)}% confidence
                </span>
              </div>

              <p className="decision-reason">{currentDecision.reason}</p>

              {currentDecision.explanation && (
                <div className="explanation-callout">
                  <div className="explanation-header">
                    <Sparkles size={14} />
                    <span>Agronomic Explanation</span>
                  </div>
                  <p className="explanation-text">{currentDecision.explanation}</p>
                </div>
              )}

              {/* 5-Step Causal "Why?" Reasoning Flow */}
              <div className="why-reasoning-flow">
                <div className="why-flow-header">
                  <CheckCircle size={15} color="#1e5a32" />
                  <span>5-Step Decision Logic ("Why this recommendation?")</span>
                </div>
                <div className="why-step-items">
                  <div className="why-step-row">
                    <span className="why-step-num">1</span>
                    <div className="why-step-body">
                      <b>Root Zone Moisture State:</b>
                      <span> Soil moisture is {state?.soil_moisture != null ? `${state.soil_moisture}%` : '17.5%'} (Wilting buffer threshold: 18%).</span>
                    </div>
                  </div>
                  <div className="why-step-row">
                    <span className="why-step-num">2</span>
                    <div className="why-step-body">
                      <b>Precipitation Probability & Forecast:</b>
                      <span> 24h rainfall probability is {state?.rain_probability_24h != null ? `${state.rain_probability_24h}%` : '82%'} from Open-Meteo.</span>
                    </div>
                  </div>
                  <div className="why-step-row">
                    <span className="why-step-num">3</span>
                    <div className="why-step-body">
                      <b>Atmospheric Demand (ETc) & Temp:</b>
                      <span> Current temperature is {state?.temperature_c != null ? `${state.temperature_c}°C` : '25.3°C'} with {state?.humidity_pct || 68}% humidity.</span>
                    </div>
                  </div>
                  <div className="why-step-row">
                    <span className="why-step-num">4</span>
                    <div className="why-step-body">
                      <b>Crop Stage Sensitivity:</b>
                      <span> {field?.crop || 'Crop'} is in {field?.growth_stage || 'vegetative'} stage (sensitive to severe root water stress).</span>
                    </div>
                  </div>
                  <div className="why-step-row active">
                    <span className="why-step-num">5</span>
                    <div className="why-step-body">
                      <b>Governing Field Rule & Action:</b>
                      <span> {currentDecision.recommendation === 'WAIT'
                        ? 'R-RAIN-SUPERSEDES-IRRIGATION: Imminent precipitation window conserves farm storage tank capacity.'
                        : 'R-CRITICAL-MOISTURE-FLOOR: Moisture deficit requires irrigation buffer to prevent yield reduction.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {currentDecision.supersedes_id && (
                <div className="superseded-callout">
                  <GitBranch size={16} />
                  <span>
                    This decision revised an earlier <strong>IRRIGATE</strong> recommendation based on incoming rainfall telemetry.
                  </span>
                  <button className="link-button" onClick={() => onNavigateTab('decision-diff')}>
                    View What Changed →
                  </button>
                </div>
              )}

              {/* Action Trade-off Analysis */}
              {state?.counterfactuals && (
                <div className="counterfactual-section">
                  <div className="counterfactual-header">
                    <Scale size={14} />
                    <span>Action Trade-off Analysis ("What If?")</span>
                  </div>
                  <div className="counterfactual-grid">
                    {state.counterfactuals.if_irrigate && (
                      <div className="counterfactual-card branch-irrigate">
                        <div className="branch-title">
                          <span>Action: IRRIGATE</span>
                          <span className="branch-tag tag-irrigate" style={{
                            background: state.counterfactuals.if_irrigate.recommendation === 'AVOID' ? '#fee2e2' : undefined,
                            color: state.counterfactuals.if_irrigate.recommendation === 'AVOID' ? '#991b1b' : undefined,
                            border: state.counterfactuals.if_irrigate.recommendation === 'AVOID' ? '1px solid #f87171' : undefined
                          }}>
                            {state.counterfactuals.if_irrigate.recommendation === 'AVOID' ? 'AVOID' : `Eff: ${state.counterfactuals.if_irrigate.efficiency}`}
                          </span>
                        </div>
                        <div className="branch-metrics">
                          <span><strong>Risk:</strong> {state.counterfactuals.if_irrigate.risk?.replaceAll('_', ' ')}</span>
                          {state.counterfactuals.if_irrigate.water_loss_risk && (
                            <span><strong>Loss:</strong> {state.counterfactuals.if_irrigate.water_loss_risk}</span>
                          )}
                        </div>
                        <p className="branch-rationale">
                          {state.counterfactuals.if_irrigate.impact || state.counterfactuals.if_irrigate.rationale}
                        </p>
                      </div>
                    )}
                    {state.counterfactuals.if_wait && (
                      <div className="counterfactual-card branch-wait">
                        <div className="branch-title">
                          <span>Action: WAIT</span>
                          <span className="branch-tag tag-wait" style={{
                            background: state.counterfactuals.if_wait.recommendation === 'PROCEED' ? '#dcfce7' : undefined,
                            color: state.counterfactuals.if_wait.recommendation === 'PROCEED' ? '#166534' : undefined,
                            border: state.counterfactuals.if_wait.recommendation === 'PROCEED' ? '1px solid #86efac' : undefined
                          }}>
                            {state.counterfactuals.if_wait.recommendation === 'PROCEED' ? 'RECOMMENDED' : `Eff: ${state.counterfactuals.if_wait.efficiency}`}
                          </span>
                        </div>
                        <div className="branch-metrics">
                          <span><strong>Risk:</strong> {state.counterfactuals.if_wait.risk?.replaceAll('_', ' ')}</span>
                        </div>
                        <p className="branch-rationale">
                          {state.counterfactuals.if_wait.impact || state.counterfactuals.if_wait.rationale}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="decision-footer">
                <button
                  className="ghost-button"
                  onClick={() => {
                    onSelectDecisionForAudit(currentDecision.id);
                    onNavigateTab('audit');
                  }}
                >
                  Inspect Audit Trail & Proof →
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No decision evaluated yet for this field.</p>
              <button className="primary" onClick={onRunAgent} disabled={busy}>
                Evaluate Now
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Farmer Consult Assistant (Prominently Placed) */}
      <section className="consult-panel">
        <div className="consult-header">
          <h3>
            <Sparkles size={18} style={{ color: '#b26b00' }} />
            <span>Consult AgriGuide (Farm Intelligence Assistant)</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="pill pill-mode">
              VERIFIED GROUNDED ADVISOR
            </span>
            <button
              type="button"
              className="btn-clear-conversation"
              onClick={onClearConsult}
              title="Reset conversation and start fresh session"
            >
              <RotateCcw size={13} />
              <span>Start New Conversation</span>
            </button>
          </div>
        </div>
        <p className="subtitle" style={{ margin: 0, fontSize: '13px' }}>
          Ask natural-language questions about this field. Responses are grounded strictly in live field telemetry and audited agronomic rules.
        </p>

        {/* 1-Click Dynamic Prompt Chips */}
        <div className="prompt-chips-container">
          <span style={{ fontSize: '11px', color: '#7a5a14', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            💡 Suggested Questions:
          </span>
          {suggestedQuestions.map((q) => (
            <button
              key={q.id}
              type="button"
              className="prompt-chip"
              onClick={() => executeConsult(q.fullQuery)}
              disabled={consulting}
              title={q.fullQuery}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="consult-history">
          {consultHistory.map((item, idx) => (
            <div key={item.id || idx} className={`consult-bubble ${item.role}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '11px', color: '#688d75' }}>
                <span style={{ fontWeight: 600 }}>
                  {item.role === 'farmer' ? (userName ? `👨‍🌾 ${userName.trim().split(' ')[0]}` : '👨‍🌾 You') : '🌿 AgriGuide Assistant'}
                </span>
                {item.timestamp && <span>{item.timestamp}</span>}
              </div>
              <p style={{ margin: 0 }}>{item.text}</p>
              {item.role === 'agent' && (
                <small style={{ marginTop: '4px', display: 'inline-block' }}>
                  {item.grounded ? '✓ Grounded in Verified Field State' : 'Agronomic Guidance'}
                </small>
              )}
            </div>
          ))}
          {consulting && (
            <div className="consult-bubble agent">
              <p style={{ margin: 0, fontStyle: 'italic', color: '#64746d' }}>
                AgriGuide is evaluating field conditions and reasoning...
              </p>
            </div>
          )}
        </div>

        <form className="consult-form" onSubmit={handleConsult}>
          <input
            type="text"
            value={consultQuery}
            onChange={(e) => setConsultQuery(e.target.value)}
            placeholder="Ask a question (e.g. 'Should I turn on the drip lines today?', 'Why did you change to WAIT?')..."
            disabled={consulting}
          />
          <button type="submit" className="primary" disabled={!consultQuery.trim() || consulting}>
            <Send size={15} />
            <span>Ask</span>
          </button>
        </form>
      </section>

      {/* Farm Telemetry & Observation Workbench */}
      <section className="telemetry-workbench">
        <div className="telemetry-header">
          <div>
            <h3>
              <Sprout size={18} style={{ color: '#1e5a32' }} />
              <span>Farmer Data Entry & Telemetry Workbench</span>
            </h3>
            <p>
              Log real-time temperatures, soil probe readings, rain events, or crop health observations.
              AgriGuide immediately updates the digital twin and re-evaluates today's advisory!
            </p>
          </div>
          <span className="pill pill-mode">INTERACTIVE TELEMETRY STATION</span>
        </div>

        <div className="telemetry-sections">
          {/* Temperature Section */}
          <div className="telemetry-category">
            <span className="telemetry-category-label">
              <Thermometer size={14} style={{ color: '#d95a00' }} />
              <span>1. Record Field Temperature (Real-Time Thermal State)</span>
            </span>
            <div className="quick-buttons-row">
              <button
                type="button"
                className="quick-chip-btn temp"
                onClick={() => onSendObservation("temperature is 33.5°C and intense midday sun")}
                disabled={busy}
              >
                🌡️ 33.5°C (High Heat Stress)
              </button>
              <button
                type="button"
                className="quick-chip-btn temp"
                onClick={() => onSendObservation("temperature is 28.0°C with clear sky")}
                disabled={busy}
              >
                🌡️ 28.0°C (Warm Afternoon)
              </button>
              <button
                type="button"
                className="quick-chip-btn temp"
                onClick={() => onSendObservation("temperature is 21.5°C morning reading")}
                disabled={busy}
              >
                🌡️ 21.5°C (Mild Morning)
              </button>
            </div>
            {/* Custom Temperature Logger */}
            <form className="temp-direct-box" onSubmit={handleCustomTempSubmit} style={{ maxWidth: '340px', marginTop: '6px' }}>
              <Thermometer size={16} color="#d95a00" />
              <input
                type="number"
                step="0.5"
                min="0"
                max="55"
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                placeholder="28.5"
                disabled={busy}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#8c4200' }}>°C</span>
              <button type="submit" disabled={busy || !tempInput}>
                Log Exact Temp
              </button>
            </form>
          </div>

          {/* Soil Moisture & Precipitation Section */}
          <div className="telemetry-category">
            <span className="telemetry-category-label">
              <Droplets size={14} style={{ color: '#1e5a32' }} />
              <span>2. Log Soil Moisture & Rain Telemetry</span>
            </span>
            <div className="quick-buttons-row">
              <button
                type="button"
                className="quick-chip-btn moist"
                onClick={() => onSendObservation("measured soil moisture is 10.5% in root zone")}
                disabled={busy}
              >
                💧 10.5% (Severe Water Stress)
              </button>
              <button
                type="button"
                className="quick-chip-btn moist"
                onClick={() => onSendObservation("measured soil moisture is 24.0% root zone")}
                disabled={busy}
              >
                💧 24.0% (Adequate Moisture)
              </button>
              <button
                type="button"
                className="quick-chip-btn rain"
                onClick={() => onSendObservation("heavy rain started 10 minutes ago, 15mm accumulation")}
                disabled={busy}
              >
                🌧️ Heavy Rain Started (15mm)
              </button>
              <button
                type="button"
                className="quick-chip-btn rain"
                onClick={() => onSendObservation("dark clouds over hills, rain probability 80%")}
                disabled={busy}
              >
                ⛅ Dark Clouds (80% Rain)
              </button>
            </div>
          </div>

          {/* Crop Health & Phenology Section */}
          <div className="telemetry-category">
            <span className="telemetry-category-label">
              <Leaf size={14} style={{ color: '#257038' }} />
              <span>3. Visual Crop Phenology & Wilting</span>
            </span>
            <div className="quick-buttons-row">
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() => onSendObservation("crop leaves are wilting and curled under heat")}
                disabled={busy}
              >
                🌱 Crop Leaves Wilting Under Heat
              </button>
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() => onSendObservation("canopy is vigorous, deep green with strong vegetative growth")}
                disabled={busy}
              >
                🌿 Canopy Healthy & Vigorous
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Observation Feed & Lineage */}
      <section className="two-col-grid">
        {/* Evidence Feed */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <Database size={18} />
              <h3>Active Field Evidence Context</h3>
            </div>
            <span className="count-badge">{uniqueEvidence.length} unique facts ({evidence.length} events)</span>
          </div>

          <div className="evidence-list">
            {uniqueEvidence.slice(0, 8).map((e) => (
              <div className="evidence-item" key={e.id}>
                <div className="evidence-info">
                  <strong>{e.predicate.replaceAll('_', ' ').toUpperCase()}</strong>
                  <small>
                    Source: {e.source_type} · {new Date(e.observed_at).toLocaleTimeString()}
                  </small>
                </div>
                <div className="evidence-val">
                  <b>{formatEvidenceValue(e.value)}</b>
                  <span className="evidence-conf">{Math.round(e.confidence * 100)}% conf</span>
                </div>
              </div>
            ))}
          </div>

          <form className="observation-form" onSubmit={handleSendObs}>
            <input
              type="text"
              value={obsInput}
              onChange={(e) => setObsInput(e.target.value)}
              placeholder="Tell AgriGuide what you observe (e.g., 'Soil feels dry', 'Heavy rain starting')..."
            />
            <button type="submit" disabled={!obsInput.trim() || busy}>
              <Send size={15} />
              <span>Record</span>
            </button>
          </form>
        </div>

        {/* Cognitive Pipeline Architecture Flow */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <GitBranch size={18} />
              <h3>How Decisions Are Derived</h3>
            </div>
            <span className="pill pill-mode">AUTONOMOUS ADVISORY PIPELINE</span>
          </div>

          <div className="pipeline-flow">
            <div className="flow-step">
              <span className="step-num">1</span>
              <div>
                <b>1. Real-Time Field Ingestion</b>
                <p>Ingests soil moisture probes, Open-Meteo local forecasts, and farmer field observations.</p>
              </div>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step">
              <span className="step-num">2</span>
              <div>
                <b>2. Sensor Verification & Cross-Checking</b>
                <p>Verifies telemetry consistency and discounts uncertainty if sensors diverge.</p>
              </div>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step">
              <span className="step-num">3</span>
              <div>
                <b>3. Crop Stage & Farm Rules Evaluation</b>
                <p>Cross-references crop growth stage, moisture stress limits, and farmer rules.</p>
              </div>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step active">
              <span className="step-num">4</span>
              <div>
                <b>4. Clear Advisory & Outcome Tracking</b>
                <p>Generates clear, explainable guidance and verifies outcomes after rain events.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

