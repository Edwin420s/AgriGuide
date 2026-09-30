import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CloudRain,
  Database,
  Droplets,
  GitBranch,
  Leaf,
  PlusCircle,
  RefreshCw,
  Scale,
  Send,
  Zap
} from 'lucide-react';
import { TabType } from './Sidebar';

interface FieldIntelligenceProps {
  field: any;
  state: any;
  evidence: any[];
  decisions: any[];
  busy: boolean;
  onRunAgent: () => void;
  onSimulateRain: () => void;
  onSendObservation: (msg: string) => void;
  onNavigateTab: (tab: TabType) => void;
  onSelectDecisionForAudit: (decisionId: string) => void;
}

export const FieldIntelligence: React.FC<FieldIntelligenceProps> = ({
  field,
  state,
  evidence,
  decisions,
  busy,
  onRunAgent,
  onSimulateRain,
  onSendObservation,
  onNavigateTab,
  onSelectDecisionForAudit
}) => {
  const [obsInput, setObsInput] = useState('');

  const currentDecision = decisions[0];

  const handleSendObs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsInput.trim()) return;
    onSendObservation(obsInput);
    setObsInput('');
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

  return (
    <div className="tab-container">
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
              <span className="pill">ACTIVE FIELD CONTEXT</span>
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
            <div className="metric-box">
              <span className="metric-label">Soil Moisture</span>
              <b className="metric-val">{state?.soil_moisture != null ? `${state.soil_moisture}%` : '—'}</b>
              <small className="metric-sub">
                Confidence {Math.round((state?.soil_confidence || 0) * 100)}%
              </small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Rain Forecast 24h</span>
              <b className="metric-val">
                {state?.rain_probability_24h != null ? `${state.rain_probability_24h}%` : '—'}
              </b>
              <small className="metric-sub">
                Confidence {Math.round((state?.weather_confidence || 0) * 100)}%
              </small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Water Availability</span>
              <b className="metric-val">{state?.water_availability || 'LIMITED'}</b>
              <small className="metric-sub">Reservoir Constraint</small>
            </div>

            <div className="metric-box">
              <span className="metric-label">Evidence Items</span>
              <b className="metric-val">{state?.evidence_count || 0}</b>
              <small className="metric-sub">Active Sensor/Telemetry</small>
            </div>
          </div>

          <div className="field-actions">
            <button className="primary" onClick={onRunAgent} disabled={busy}>
              <Zap size={16} />
              <span>{busy ? 'Evaluating MeTTa...' : 'Run Cognitive Agent'}</span>
            </button>
            <button className="secondary" onClick={onSimulateRain} disabled={busy}>
              <CloudRain size={16} />
              <span>Simulate Storm Forecast (82%)</span>
            </button>
          </div>
        </div>

        {/* Cognitive Decision Card */}
        <div className="decision-card">
          <div className="card-head">
            <div>
              <span className="pill pill-agent">COGNITIVE OUTPUT</span>
              <h3>Auditable Decision</h3>
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

              {/* MeTTa Counterfactual Trade-off Analysis */}
              {state?.counterfactuals && (
                <div className="counterfactual-section">
                  <div className="counterfactual-header">
                    <Scale size={14} />
                    <span>MeTTa Counterfactual Analysis ("What If?")</span>
                  </div>
                  <div className="counterfactual-grid">
                    {state.counterfactuals.if_irrigate && (
                      <div className="counterfactual-card branch-irrigate">
                        <div className="branch-title">
                          <span>Action: IRRIGATE</span>
                          <span className="branch-tag tag-irrigate">
                            Eff: {state.counterfactuals.if_irrigate.efficiency}
                          </span>
                        </div>
                        <div className="branch-metrics">
                          <span><strong>Risk:</strong> {state.counterfactuals.if_irrigate.risk?.replaceAll('_', ' ')}</span>
                          {state.counterfactuals.if_irrigate.water_loss_risk && (
                            <span><strong>Loss:</strong> {state.counterfactuals.if_irrigate.water_loss_risk}</span>
                          )}
                        </div>
                        <p className="branch-rationale">{state.counterfactuals.if_irrigate.rationale}</p>
                      </div>
                    )}
                    {state.counterfactuals.if_wait && (
                      <div className="counterfactual-card branch-wait">
                        <div className="branch-title">
                          <span>Action: WAIT</span>
                          <span className="branch-tag tag-wait">
                            Eff: {state.counterfactuals.if_wait.efficiency}
                          </span>
                        </div>
                        <div className="branch-metrics">
                          <span><strong>Risk:</strong> {state.counterfactuals.if_wait.risk?.replaceAll('_', ' ')}</span>
                        </div>
                        <p className="branch-rationale">{state.counterfactuals.if_wait.rationale}</p>
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
                  Inspect MeTTa Trace & Proof →
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

      {/* Observation Feed & Lineage */}
      <section className="two-col-grid">
        {/* Evidence Feed */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <Database size={18} />
              <h3>Active Field Evidence Context</h3>
            </div>
            <span className="count-badge">{evidence.length} facts</span>
          </div>

          <div className="evidence-list">
            {evidence.slice(0, 6).map((e) => (
              <div className="evidence-item" key={e.id}>
                <div className="evidence-info">
                  <strong>{e.predicate.replaceAll('_', ' ').toUpperCase()}</strong>
                  <small>
                    Source: {e.source_type} · {new Date(e.observed_at).toLocaleTimeString()}
                  </small>
                </div>
                <div className="evidence-val">
                  <b>{String(e.value?.value ?? JSON.stringify(e.value))}</b>
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
              <h3>Cognitive Decision Pipeline</h3>
            </div>
            <span className="pill pill-mode">LOCAL OMEGA + METTA</span>
          </div>

          <div className="pipeline-flow">
            <div className="flow-step">
              <span className="step-num">1</span>
              <div>
                <b>Evidence Ingestion</b>
                <p>Sensor telemetry, Open-Meteo forecasts, and farmer qualitative observations.</p>
              </div>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step">
              <span className="step-num">2</span>
              <div>
                <b>Belief Revision & Conflict Detection</b>
                <p>Calculates variance across providers and forms grounded beliefs with confidence bounds.</p>
              </div>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step">
              <span className="step-num">3</span>
              <div>
                <b>MeTTa Symbolic Deduction</b>
                <p>Evaluates agricultural rewrite rules and custom farmer field rules in S-expressions.</p>
              </div>
            </div>
            <div className="flow-arrow">↓</div>
            <div className="flow-step active">
              <span className="step-num">4</span>
              <div>
                <b>Auditable Decision & Learning</b>
                <p>Emits recommendation with cryptographic trace and adapts source reliability on outcomes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
