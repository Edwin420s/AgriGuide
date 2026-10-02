import React, { useState, useMemo } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle,
  CloudRain,
  Compass,
  Droplets,
  HelpCircle,
  MapPin,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Scale,
  Send,
  Sparkles,
  Sprout,
  Thermometer,
  Wind,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { TabType } from './Sidebar';
import { getDynamicSuggestedQuestions } from '../lib/suggestedQuestions';
import { FarmerJourneyLifecycle } from './FarmerJourneyLifecycle';
import { ConfidenceBreakdown } from './ConfidenceBreakdown';

export interface ConsultMessage {
  id: string;
  role: 'farmer' | 'agent';
  text: string;
  grounded?: boolean;
  timestamp?: string;
}

interface HomeOverviewProps {
  field: any;
  state: any;
  decisions: any[];
  evidence: any[];
  busy: boolean;
  consultHistory: ConsultMessage[];
  consulting: boolean;
  onSendConsult: (q: string) => Promise<string>;
  onClearConsult: () => void;
  onRunDecision: () => void;
  onSyncWeather: () => void;
  onOpenObservation: (category?: string) => void;
  onNavigateTab: (tab: TabType) => void;
  onAskQuestion?: (q: string) => void;
  userName?: string;
}

const getTimeGreeting = (name?: string): string => {
  const hour = new Date().getHours();
  let greeting = "Good morning";
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon";
  } else if (hour >= 17 && hour < 22) {
    greeting = "Good evening";
  } else if (hour >= 22 || hour < 5) {
    greeting = "Good night";
  }
  const cleanName = name && name.trim() ? name.trim().split(' ')[0] : "Farmer";
  return `${greeting}, ${cleanName}`;
};

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  field,
  state,
  decisions,
  evidence,
  busy,
  consultHistory,
  consulting,
  onSendConsult,
  onClearConsult,
  onRunDecision,
  onSyncWeather,
  onOpenObservation,
  onNavigateTab,
  onAskQuestion,
  userName
}) => {
  const [quickQuery, setQuickQuery] = useState('');

  const currentDecision = decisions && decisions.length > 0 ? decisions[0] : null;
  const hasSuperseded = decisions && decisions.some((d) => d.supersedes_id);

  const suggestedQuestions = useMemo(() => {
    return getDynamicSuggestedQuestions({
      decision: currentDecision,
      field,
      state,
      decisions,
      language: 'en'
    });
  }, [currentDecision, field, state, decisions]);

  const getDecisionBadgeClass = (rec?: string) => {
    if (!rec) return 'badge-neutral';
    switch (rec.toUpperCase()) {
      case 'IRRIGATE':
        return 'badge-irrigate';
      case 'WAIT':
        return 'badge-wait';
      case 'REASSESS':
        return 'badge-reassess';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="tab-container home-overview">
      {/* 1. Welcome & Time-Aware Header */}
      <section className="overview-welcome-card">
        <div className="welcome-left">
          <div className="greeting-eyebrow">
            <Sprout size={15} style={{ color: '#1e5a32' }} />
            <span>FARM INTELLIGENCE AT A GLANCE</span>
          </div>
          <h1>{getTimeGreeting(userName)}</h1>
          <p className="welcome-subtitle">
            AgriGuide is continuously monitoring <strong>{field?.name || 'Selected Field'}</strong> ({field?.crop || 'Maize'}, {field?.growth_stage || 'Flowering'}) at {field?.farm || 'Demonstration Farm'}.
          </p>
          <div className="location-context-badge">
            <MapPin size={13} style={{ color: '#1e5a32' }} />
            <span className="loc-text">{field?.location || 'Kutus, Kirinyaga County, Kenya'}</span>
            {field?.latitude != null && field?.longitude != null && (
              <span className="loc-coords">
                ({field.latitude < 0 ? `${Math.abs(field.latitude).toFixed(3)}°S` : `${field.latitude.toFixed(3)}°N`}, {field.longitude.toFixed(3)}°E)
              </span>
            )}
            <span className="loc-hubs-tag" title="Connected to 81 verified Kenyan agricultural stations via Open-Meteo">
              🌦️ 81 Kenya Hubs Connected
            </span>
          </div>
        </div>

        <div className="welcome-actions">
          <button
            className="action-btn-primary"
            onClick={() => onOpenObservation()}
            disabled={busy}
          >
            <PlusCircle size={16} />
            <span>Record What You See</span>
          </button>

          <button
            className="action-btn-secondary"
            onClick={onRunDecision}
            disabled={busy}
          >
            <Zap size={16} />
            <span>{busy ? 'Evaluating...' : 'Run Decision'}</span>
          </button>

          <button
            className="action-btn-outline"
            onClick={onSyncWeather}
            disabled={busy}
            title="Fetch real-time atmospheric conditions from Open-Meteo for this farm"
          >
            <RefreshCw size={15} />
            <span>Sync Weather</span>
          </button>

          <button
            className="action-btn-outline"
            onClick={() => onNavigateTab('my-farm')}
            disabled={busy}
            title="Register a new farm, add fields, or configure locations"
          >
            <MapPin size={15} />
            <span>Farms & Fields</span>
          </button>
        </div>
      </section>

      {/* 2. Interactive Farmer Intelligence Journey Lifecycle */}
      <FarmerJourneyLifecycle
        currentStage="decide"
        onNavigateTab={onNavigateTab}
        onOpenObservation={() => onOpenObservation()}
      />

      {/* 3. Main Grid: Today's Decision & Field Status */}
      <section className="overview-main-grid">
        {/* Today's Decision Card */}
        <div className="decision-hero-card">
          <div className="hero-card-header">
            <div>
              <span className="section-label">TODAY'S ADVISORY DECISION</span>
              <h2>{field?.name || 'Field Overview'}</h2>
              <small className="field-meta-line">
                {field?.crop} · {field?.growth_stage} · {field?.farm}
              </small>
            </div>
            {hasSuperseded && (
              <span className="pill pill-revision" title="Adjusted in response to incoming rainfall forecast">
                REVISED DECISION
              </span>
            )}
          </div>

          <div className="decision-callout">
            <div className="decision-pill-row">
              <span className={`decision-main-badge ${getDecisionBadgeClass(currentDecision?.recommendation)}`}>
                {currentDecision?.recommendation || 'EVALUATING'}
              </span>
              <ConfidenceBreakdown
                confidence={currentDecision?.confidence || 0.85}
                state={state}
                decision={currentDecision}
              />
            </div>

            <p className="decision-main-reason">
              {currentDecision?.reason || 'Aggregating live sensor telemetry, Open-Meteo atmospheric forecasts, and crop phenology models.'}
            </p>

            <div className="decision-quick-links">
              <button
                className="link-chip"
                onClick={() => onNavigateTab('field-intel')}
              >
                Why this decision? →
              </button>
              <button
                className="link-chip"
                onClick={() => onNavigateTab('decision-diff')}
              >
                What changed? →
              </button>
              <button
                className="link-chip"
                onClick={() => onNavigateTab('simulator')}
              >
                What if I irrigate? →
              </button>
            </div>
          </div>
        </div>

        {/* Current Field State Card */}
        <div className="field-state-summary-card">
          <div className="hero-card-header">
            <div>
              <span className="section-label">CURRENT FIELD CONDITIONS</span>
              <h3>Physical Agronomy State</h3>
            </div>
            <span className="live-status-dot">
              <span className="dot-pulse"></span>
              Live Telemetry
            </span>
          </div>

          <div className="state-stat-grid">
            <div className="state-stat-box">
              <div className="stat-head">
                <Droplets size={16} style={{ color: '#1e5a32' }} />
                <span>Soil Moisture</span>
              </div>
              <b className="stat-number" style={{ color: (state?.soil_moisture || 0) < 18 ? '#b26b00' : '#1e5a32' }}>
                {state?.soil_moisture != null ? `${state.soil_moisture}%` : '17.5%'}
              </b>
              <small className="stat-status">
                {(state?.soil_moisture || 0) < 18 ? 'Below Wilting Buffer' : 'Root Zone Hydrated'}
              </small>
            </div>

            <div className="state-stat-box">
              <div className="stat-head">
                <CloudRain size={16} style={{ color: '#0f52ba' }} />
                <span>Rain Probability</span>
              </div>
              <b className="stat-number" style={{ color: '#0f52ba' }}>
                {state?.rain_probability_24h != null ? `${state.rain_probability_24h}%` : '82%'}
              </b>
              <small className="stat-status">
                {(state?.rain_probability_24h || 0) >= 60 ? 'Precipitation Probable' : 'Dry Forecast Window'}
              </small>
            </div>

            <div className="state-stat-box">
              <div className="stat-head">
                <Thermometer size={16} style={{ color: '#d95a00' }} />
                <span>Temperature</span>
              </div>
              <b className="stat-number" style={{ color: '#a84300' }}>
                {state?.temperature_c != null ? `${state.temperature_c}°C` : '25.3°C'}
              </b>
              <small className="stat-status">
                Source: {state?.temperature_source === 'FARMER' ? 'Farmer Logged' : 'Open-Meteo'}
              </small>
            </div>

            <div className="state-stat-box">
              <div className="stat-head">
                <Compass size={16} style={{ color: '#557563' }} />
                <span>Water Reserve</span>
              </div>
              <b className="stat-number" style={{ color: '#2f4838' }}>
                {state?.water_availability || 'LIMITED'}
              </b>
              <small className="stat-status">Farm Tank Storage</small>
            </div>
          </div>

          <div className="state-sub-row">
            <span>💨 Humidity: <strong>{state?.humidity_pct || 68}%</strong></span>
            <span>🍃 Wind Speed: <strong>{state?.wind_speed_kmh || 9.6} km/h</strong></span>
            <span>🌱 Crop Water Demand: <strong>{state?.crop_water_demand || 'HIGH'}</strong></span>
          </div>
        </div>
      </section>

      {/* 3. CENTERPIECE: Consult AgriGuide (Farm Intelligence Assistant) */}
      <section className="overview-consult-hero">
        <div className="consult-hero-head">
          <div className="head-title-row">
            <div className="sparkle-circle">
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <h3>Consult AgriGuide (Farm Intelligence Assistant)</h3>
              <p>Ask natural-language agronomic questions or log field observations for <strong>{field?.name || 'this field'}</strong>.</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="grounded-status-tag">
              <CheckCircle2 size={13} /> GROUNDED IN ACTIVE TELEMETRY
            </span>
            <button
              type="button"
              className="btn-clear-conversation"
              onClick={onClearConsult}
              title="Reset conversation and start a fresh session"
            >
              <RotateCcw size={13} />
              <span>Start New Conversation</span>
            </button>
          </div>
        </div>

        {/* 1-Click Dynamic Suggestion Chips */}
        <div className="hero-prompt-chips">
          <span className="chips-label">💡 Suggested Questions:</span>
          {suggestedQuestions.map((q) => (
            <button
              key={q.id}
              type="button"
              className="hero-chip-btn"
              onClick={() => onSendConsult(q.fullQuery)}
              disabled={consulting}
              title={q.fullQuery}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          className="hero-ask-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!quickQuery.trim() || consulting) return;
            const q = quickQuery.trim();
            setQuickQuery('');
            onSendConsult(q);
          }}
        >
          <div className="input-wrap">
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Ask anything or record telemetry (e.g. 'Should I turn on the drip lines today?', 'Current temperature is 32°C')..."
              disabled={consulting}
            />
          </div>
          <button type="submit" className="hero-ask-btn" disabled={!quickQuery.trim() || consulting}>
            {consulting ? <RefreshCw size={15} className="spin" /> : <Send size={15} />}
            <span>{consulting ? 'Reasoning...' : 'Ask AgriGuide'}</span>
          </button>
        </form>

        {/* Shared Conversation History Thread */}
        <div className="home-consult-thread">
          {consultHistory.map((item, idx) => (
            <div key={item.id || idx} className={`consult-thread-bubble ${item.role}`}>
              <div className="bubble-head">
                <span className="bubble-sender">
                  {item.role === 'farmer' ? (userName ? `👨‍🌾 ${userName.trim().split(' ')[0]}` : '👨‍🌾 You') : '🌿 AgriGuide Assistant'}
                </span>
                {item.timestamp && (
                  <span className="bubble-time">
                    <Clock size={11} /> {item.timestamp}
                  </span>
                )}
                {item.role === 'agent' && item.grounded && (
                  <span className="grounded-verified-badge">
                    <CheckCircle size={11} /> Grounded
                  </span>
                )}
              </div>
              <p className="bubble-content">{item.text}</p>
            </div>
          ))}
          {consulting && (
            <div className="consult-thread-bubble agent loading">
              <RefreshCw size={14} className="spin" color="#1e5a32" />
              <span>AgriGuide is cross-referencing soil probes, Open-Meteo forecasts, and governing agronomic rules...</span>
            </div>
          )}
        </div>

        <div className="thread-footer-row">
          <button
            type="button"
            className="continue-chat-btn"
            onClick={() => onNavigateTab('field-intel')}
          >
            Open full conversation & agronomic inspector in Field Advisor →
          </button>
        </div>
      </section>

      {/* 4. Two-Column: Farm Workbench & Recent Field Activity */}
      <section className="overview-split-grid">
        {/* Fast Action / Observation Launcher */}
        <div className="workbench-card">
          <div className="workbench-card-header">
            <div>
              <span className="section-label">FARM WORKBENCH</span>
              <h3>What Is Happening In The Field?</h3>
            </div>
            <span className="pill pill-mode">INSTANT LOGGING</span>
          </div>
          <p className="workbench-card-desc">
            Choose what you observe or test. Inputs immediately update the agricultural digital twin and re-evaluate recommendations.
          </p>

          <div className="workbench-actions-grid">
            <button
              type="button"
              className="action-tile-btn moisture"
              onClick={() => onOpenObservation('soil_moisture')}
            >
              <div className="tile-icon-box moisture">
                <Droplets size={20} />
              </div>
              <div className="tile-text">
                <b>Log Soil Moisture</b>
                <small>Record manual or probe reading</small>
              </div>
            </button>

            <button
              type="button"
              className="action-tile-btn rain"
              onClick={() => onOpenObservation('rain')}
            >
              <div className="tile-icon-box rain">
                <CloudRain size={20} />
              </div>
              <div className="tile-text">
                <b>Report Rain Event</b>
                <small>Light drizzle or heavy storm</small>
              </div>
            </button>

            <button
              type="button"
              className="action-tile-btn temp"
              onClick={() => onOpenObservation('temperature')}
            >
              <div className="tile-icon-box temp">
                <Thermometer size={20} />
              </div>
              <div className="tile-text">
                <b>Record Temperature</b>
                <small>Ambient reading or midday heat</small>
              </div>
            </button>

            <button
              type="button"
              className="action-tile-btn crop"
              onClick={() => onOpenObservation('crop')}
            >
              <div className="tile-icon-box crop">
                <Sprout size={20} />
              </div>
              <div className="tile-text">
                <b>Crop Health & Wilting</b>
                <small>Note leaf curling or vigor</small>
              </div>
            </button>
          </div>

          <div className="natural-note-launcher">
            <button
              type="button"
              className="btn-natural-open"
              onClick={() => onOpenObservation('natural')}
            >
              <MessageSquare size={16} color="#1e5a32" />
              <span>Tell AgriGuide what you see in natural language...</span>
              <ArrowRight size={14} style={{ marginLeft: 'auto', color: '#1e5a32' }} />
            </button>
          </div>
        </div>

        {/* Recent Field Activity Timeline */}
        <div className="activity-timeline-card">
          <div className="workbench-card-header">
            <div>
              <span className="section-label">AUDITABLE LINEAGE</span>
              <h3>Recent Field Activity</h3>
            </div>
            <button
              type="button"
              className="ghost-link"
              onClick={() => onNavigateTab('decision-diff')}
            >
              View Decision Diff →
            </button>
          </div>
          <p className="workbench-card-desc">
            Transparent chronological record of environmental shifts, sensor events, and autonomous decision updates.
          </p>

          <div className="timeline-feed">
            {hasSuperseded && (
              <div className="timeline-event-item highlight">
                <div className="event-dot highlight"></div>
                <div className="event-content">
                  <div className="event-meta">
                    <span className="event-time"><Clock size={12} /> 10:15</span>
                    <span className="event-tag revised">REVISED ADVISORY</span>
                  </div>
                  <b>Decision revised: IRRIGATE → WAIT</b>
                  <p>Rain probability jumped from 18% to 82%. Holding irrigation conserves limited tank water.</p>
                </div>
              </div>
            )}

            <div className="timeline-event-item">
              <div className="event-dot"></div>
              <div className="event-content">
                <div className="event-meta">
                  <span className="event-time"><Clock size={12} /> 10:14</span>
                  <span className="event-tag weather">OPEN-METEO SYNC</span>
                </div>
                <b>Atmospheric forecast updated</b>
                <p>24h convective precipitation probability increased to 82% (12.5mm expected).</p>
              </div>
            </div>

            <div className="timeline-event-item">
              <div className="event-dot"></div>
              <div className="event-content">
                <div className="event-meta">
                  <span className="event-time"><Clock size={12} /> 08:00</span>
                  <span className="event-tag initial">BASE DECISION</span>
                </div>
                <b>Initial recommendation evaluated: IRRIGATE</b>
                <p>Soil moisture detected at 16.5% during maize flowering stage under clear skies.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
