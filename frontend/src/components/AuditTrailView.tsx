import React, { useState, useEffect } from 'react';
import { CheckCircle, Database, FileText, GitBranch, GitCompare, Layers, Scale, ShieldCheck, PlayCircle, Award, HelpCircle } from 'lucide-react';
import { audit, replayDecision } from '../lib/api';

const humanizeRuleId = (ruleId?: string) => {
  if (!ruleId) return '';
  const map: Record<string, string> = {
    'OMEGA-CORE-CYCLE': 'Cognitive Initialization',
    'R-WAIT-HIGH-RAIN': 'Rain Forecast Water Conservation',
    'R-IRRIGATE-DEFICIT': 'Critical Moisture Deficit Trigger',
    'R-DEFAULT-MONITOR': 'Continuous Field Telemetry Monitoring',
    'R-MEM-RECONCILE': 'Historical Memory Reconciler',
    'R-HIGH-RAIN-WATER-CONSERVATION': 'Storm Forecast Water Preservation',
    'R-LOW-MOISTURE-LOW-RAIN': 'Soil Moisture Deficit Relief'
  };
  return map[ruleId] || ruleId.replace(/^R-/, '').replace(/-/g, ' ');
};

const formatStepData = (data: any) => {
  if (data === null || data === undefined) return null;
  if (typeof data === 'string') return <span>{data}</span>;
  if (typeof data !== 'object') return <span>{String(data)}</span>;

  const entries = Object.entries(data);
  if (entries.length === 0) return <span>None</span>;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
      {entries.map(([k, v]) => {
        let valStr = '';
        if (typeof v === 'object' && v !== null) {
          valStr = Object.entries(v).map(([subK, subV]) => `${subK.replace(/_/g, ' ')}: ${subV}`).join(', ');
        } else {
          valStr = String(v);
        }
        const label = k.replace(/_/g, ' ');
        return (
          <span key={k} style={{ background: '#eef5f0', color: '#1f482d', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
            <strong style={{ textTransform: 'capitalize' }}>{label}:</strong> {valStr}
          </span>
        );
      })}
    </div>
  );
};

const formatEvidenceValue = (val: any) => {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'object') {
    if (val.text) return val.text;
    if (val.probability !== undefined) return `${val.probability}% rain likelihood (${val.timeframe || '24h'})`;
    if (val.value !== undefined) return `${val.value}${val.unit ? ' ' + val.unit : ''}`;
    if (val.raw) return val.raw;
    return Object.entries(val).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join(', ');
  }
  return String(val);
};

interface AuditTrailViewProps {
  decisionId?: string;
  decisions: any[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ decisionId, decisions }) => {
  const [selectedId, setSelectedId] = useState<string>(decisionId || (decisions[0]?.id ?? ''));
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [replayCert, setReplayCert] = useState<any>(null);
  const [replaying, setReplaying] = useState<boolean>(false);

  const groupedEvidence = React.useMemo(() => {
    if (!auditData?.evidence) return [];
    const map = new Map<string, { latest: any; count: number }>();
    for (const e of auditData.evidence) {
      const key = `${e.predicate}_${e.source_type}`;
      if (!map.has(key)) {
        map.set(key, { latest: e, count: 1 });
      } else {
        map.get(key)!.count += 1;
      }
    }
    return Array.from(map.values());
  }, [auditData?.evidence]);

  useEffect(() => {
    if (decisionId && decisions.some((d) => d.id === decisionId)) {
      setSelectedId(decisionId);
    } else if (decisions.length > 0) {
      setSelectedId(decisions[0].id);
    }
  }, [decisionId, decisions]);

  useEffect(() => {
    if (selectedId) {
      loadAudit(selectedId);
    }
  }, [selectedId]);

  const loadAudit = async (id: string) => {
    setLoading(true);
    try {
      const data = await audit(id);
      setAuditData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = async () => {
    if (!selectedId) return;
    setReplaying(true);
    try {
      const cert = await replayDecision(selectedId);
      setReplayCert(cert);
    } catch (e) {
      console.error(e);
    } finally {
      setReplaying(false);
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div>
          <span className="pill pill-mode">DECISION VERIFICATION</span>
          <h2>Explainable Decision Audit Trail</h2>
          <p className="subtitle">
            Every farm recommendation is fully auditable. Inspect how real-time sensor measurements, weather forecasts, and field rules combined to derive this decision.
          </p>
        </div>

        {/* Decision Selector */}
        {decisions.length > 0 && (
          <div className="decision-selector">
            <label>
              <span>Select Decision:</span>
              <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setReplayCert(null); }}>
                {decisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.recommendation} ({new Date(d.created_at).toLocaleTimeString()}) {d.supersedes_id ? '· Revised' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {loading && <div className="loading-box">Loading decision audit trace...</div>}

      {!auditData && !loading && (
        <div className="empty-state" style={{ padding: '3rem 1rem', textAlign: 'center', background: '#fcfdfc', borderRadius: '8px', border: '1px dashed #d1e2d7', marginTop: '1rem' }}>
          <HelpCircle size={36} color="#457053" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', color: '#1e5a32' }}>No Decision Available For Audit</h3>
          <p style={{ margin: 0, color: '#566e60', fontSize: '14px' }}>
            Switch to the <strong>Field Advisor</strong> tab and click <strong>"Update Field Recommendation"</strong> to run an advisory check and record an auditable decision.
          </p>
        </div>
      )}

      {auditData && !loading && (
        <div className="audit-content">
          {/* Summary Card */}
          <div className="audit-summary-card">
            <div className="summary-left">
              <span className={`decision-badge rec-${auditData.decision.recommendation.toLowerCase()}`}>
                {auditData.decision.recommendation}
              </span>
              <div>
                <h3>{auditData.decision.reason}</h3>
                {auditData.decision.explanation && (
                  <p style={{ margin: '6px 0 6px 0', fontSize: '13px', color: '#244e33', background: '#f0f8f3', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #1e5a32' }}>
                    <strong>Agronomic Advice:</strong> {auditData.decision.explanation}
                  </p>
                )}
                <small>Decision Reference: #{auditData.decision.id.slice(0, 8)} · Generated {new Date(auditData.decision.created_at).toLocaleString()}</small>
              </div>
            </div>
            <div className="summary-right" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={24} className="shield-good" />
                <span>Audited & Verified</span>
              </div>
              <button
                className="btn-replay"
                onClick={handleReplay}
                disabled={replaying}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#244e33',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <PlayCircle size={15} />
                <span>{replaying ? 'Verifying...' : 'Replay & Verify Decision'}</span>
              </button>
            </div>
          </div>

          {/* Replay Verification Certificate */}
          {replayCert && (
            <div className="replay-cert-banner" style={{ background: '#f4fbf6', border: '1px solid #7bc695', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Award size={20} color="#1b5e20" />
                <h4 style={{ margin: 0, color: '#1b5e20' }}>Independent Verification Audit: {replayCert.status}</h4>
                {replayCert.is_exact_match && (
                  <span style={{ background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                    100% REPRODUCIBLE
                  </span>
                )}
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#2e5b3f' }}>{replayCert.explanation}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '12px', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #d9e9df' }}>
                <div>Original Advice: <strong>{replayCert.original_recommendation}</strong> ({Math.round(replayCert.original_confidence * 100)}%)</div>
                <div>Re-evaluated Advice: <strong>{replayCert.replayed_recommendation}</strong> ({Math.round(replayCert.replayed_confidence * 100)}%)</div>
                <div>Governing Principles: <strong>{replayCert.replayed_rules?.map((rid: string) => humanizeRuleId(rid)).join(', ')}</strong></div>
              </div>
            </div>
          )}

          {/* Counterfactual Trade-off Analysis */}
          {auditData.counterfactuals && (
            <div className="audit-counterfactual-banner">
              <div className="title-row">
                <GitCompare size={18} />
                <h3>Action Trade-off Evaluation (What-If Analysis)</h3>
              </div>
              <p className="counterfactual-desc">
                The system evaluated candidate actions (IRRIGATE vs. WAIT) against field soil moisture and weather forecasts to determine comparative efficiency and crop risk before deriving the recommendation.
              </p>
              <div className="counterfactual-grid">
                {auditData.counterfactuals.if_irrigate && (
                  <div className="counterfactual-card branch-irrigate">
                    <div className="branch-title">
                      <span>Hypothetical: IRRIGATE</span>
                      <span className="branch-tag tag-irrigate" style={{
                        background: auditData.counterfactuals.if_irrigate.recommendation === 'AVOID' ? '#fee2e2' : undefined,
                        color: auditData.counterfactuals.if_irrigate.recommendation === 'AVOID' ? '#991b1b' : undefined,
                        border: auditData.counterfactuals.if_irrigate.recommendation === 'AVOID' ? '1px solid #f87171' : undefined
                      }}>
                        {auditData.counterfactuals.if_irrigate.recommendation === 'AVOID' ? 'AVOID' : `Eff: ${auditData.counterfactuals.if_irrigate.efficiency}`}
                      </span>
                    </div>
                    <div className="branch-metrics">
                      <span><strong>Risk:</strong> {auditData.counterfactuals.if_irrigate.risk?.replaceAll('_', ' ')}</span>
                      {auditData.counterfactuals.if_irrigate.water_loss_risk && (
                        <span><strong>Water Loss:</strong> {auditData.counterfactuals.if_irrigate.water_loss_risk}</span>
                      )}
                    </div>
                    <p className="branch-rationale">
                      {auditData.counterfactuals.if_irrigate.impact || auditData.counterfactuals.if_irrigate.rationale}
                    </p>
                  </div>
                )}
                {auditData.counterfactuals.if_wait && (
                  <div className="counterfactual-card branch-wait">
                    <div className="branch-title">
                      <span>Hypothetical: WAIT</span>
                      <span className="branch-tag tag-wait" style={{
                        background: auditData.counterfactuals.if_wait.recommendation === 'PROCEED' ? '#dcfce7' : undefined,
                        color: auditData.counterfactuals.if_wait.recommendation === 'PROCEED' ? '#166534' : undefined,
                        border: auditData.counterfactuals.if_wait.recommendation === 'PROCEED' ? '1px solid #86efac' : undefined
                      }}>
                        {auditData.counterfactuals.if_wait.recommendation === 'PROCEED' ? 'RECOMMENDED' : `Eff: ${auditData.counterfactuals.if_wait.efficiency}`}
                      </span>
                    </div>
                    <div className="branch-metrics">
                      <span><strong>Risk:</strong> {auditData.counterfactuals.if_wait.risk?.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="branch-rationale">
                      {auditData.counterfactuals.if_wait.impact || auditData.counterfactuals.if_wait.rationale}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="two-col-grid" style={{ marginTop: '1.5rem' }}>
            {/* Reasoning Trace Steps */}
            <div className="panel">
              <div className="panel-header">
                <div className="title-row">
                  <GitBranch size={18} />
                  <h3>Reasoning Derivation Steps</h3>
                </div>
                <span className="count-badge">{auditData.reasoning?.length || 0} steps</span>
              </div>

              <div className="audit-steps-list">
                {auditData.reasoning?.map((r: any) => (
                  <div key={r.sequence} className="audit-step-row">
                    <div className="step-number">{r.sequence}</div>
                    <div className="step-main">
                      <div className="step-header-line">
                        <span className="step-type-pill">{r.type?.replace(/_/g, ' ')}</span>
                        {r.rule_id && <span className="step-rule-pill">{humanizeRuleId(r.rule_id)}</span>}
                        <span className="step-conf-pill">{Math.round(r.confidence * 100)}%</span>
                      </div>
                      <div className="step-io">
                        {r.input && (
                          <div className="io-box">
                            <span className="io-tag">Field Input:</span>
                            {formatStepData(r.input)}
                          </div>
                        )}
                        {r.output && (
                          <div className="io-box">
                            <span className="io-tag">Agronomic Deduction:</span>
                            {formatStepData(r.output)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Lineage Used in Decision */}
            <div className="panel">
              <div className="panel-header">
                <div className="title-row">
                  <Database size={18} />
                  <h3>Evidence Context at Time of Decision</h3>
                </div>
                <span className="count-badge">
                  {groupedEvidence.length} unique facts · {auditData.evidence?.length || 0} events
                </span>
              </div>

              <div className="audit-evidence-list">
                {groupedEvidence.map(({ latest: e, count }) => (
                  <div key={e.id} className="audit-evidence-row">
                    <div className="ev-icon-wrapper">
                      <CheckCircle size={16} />
                    </div>
                    <div className="ev-details" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <b>{e.predicate?.replaceAll('_', ' ').toUpperCase()}</b>
                        {count > 1 && (
                          <span style={{ fontSize: '10px', background: '#e0efe4', color: '#165e32', padding: '1px 6px', borderRadius: '10px', fontWeight: 600 }}>
                            {count} events verified
                          </span>
                        )}
                      </div>
                      <p>Observation: <strong>{formatEvidenceValue(e.value)}</strong></p>
                      <small>Source: {e.source_type} · Confidence: {Math.round(e.confidence * 100)}%</small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Outcomes recorded for this decision */}
              {auditData.outcomes?.length > 0 && (
                <div className="decision-outcomes-section">
                  <h4>Recorded Outcomes (Closed-Loop)</h4>
                  {auditData.outcomes.map((o: any) => (
                    <div key={o.id} className="outcome-row">
                      <span className="outcome-type">{o.type}</span>
                      <code>{JSON.stringify(o.value)}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
