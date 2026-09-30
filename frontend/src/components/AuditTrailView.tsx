import React, { useEffect, useState } from 'react';
import { CheckCircle, Database, FileText, GitBranch, GitCompare, Layers, Scale, ShieldCheck } from 'lucide-react';
import { audit } from '../lib/api';

interface AuditTrailViewProps {
  decisionId?: string;
  decisions: any[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ decisionId, decisions }) => {
  const [selectedId, setSelectedId] = useState<string>(decisionId || (decisions[0]?.id ?? ''));
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (decisionId) {
      setSelectedId(decisionId);
    } else if (decisions[0]?.id && !selectedId) {
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

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div>
          <span className="pill pill-mode">TRANSPARENT REASONING PROOF</span>
          <h2>Explainable Audit Trail</h2>
          <p className="subtitle">
            Every recommendation is fully auditable from raw evidence through symbolic MeTTa rules down to final action.
          </p>
        </div>

        {/* Decision Selector */}
        {decisions.length > 1 && (
          <div className="decision-selector">
            <label>
              <span>Inspect Decision:</span>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
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

      {loading && <div className="loading-box">Loading audit proof trace...</div>}

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
                <small>Decision ID: {auditData.decision.id} · Issued {new Date(auditData.decision.created_at).toLocaleString()}</small>
              </div>
            </div>
            <div className="summary-right">
              <ShieldCheck size={28} className="shield-good" />
              <span>Audited & Verified</span>
            </div>
          </div>

          {/* Counterfactual Trade-off Analysis */}
          {auditData.counterfactuals && (
            <div className="audit-counterfactual-banner">
              <div className="title-row">
                <GitCompare size={18} />
                <h3>MeTTa Counterfactual Trade-off Proof (Branch Evaluation)</h3>
              </div>
              <p className="counterfactual-desc">
                MeTTa symbolically evaluated both candidate actions (IRRIGATE vs. WAIT) against the current Atomspace state to determine comparative efficiency and risk before deriving the recommendation.
              </p>
              <div className="counterfactual-grid">
                {auditData.counterfactuals.if_irrigate && (
                  <div className="counterfactual-card branch-irrigate">
                    <div className="branch-title">
                      <span>Hypothetical: IRRIGATE</span>
                      <span className="branch-tag tag-irrigate">
                        Efficiency: {auditData.counterfactuals.if_irrigate.efficiency}
                      </span>
                    </div>
                    <div className="branch-metrics">
                      <span><strong>Risk:</strong> {auditData.counterfactuals.if_irrigate.risk?.replaceAll('_', ' ')}</span>
                      {auditData.counterfactuals.if_irrigate.water_loss_risk && (
                        <span><strong>Water Loss:</strong> {auditData.counterfactuals.if_irrigate.water_loss_risk}</span>
                      )}
                    </div>
                    <p className="branch-rationale">{auditData.counterfactuals.if_irrigate.rationale}</p>
                  </div>
                )}
                {auditData.counterfactuals.if_wait && (
                  <div className="counterfactual-card branch-wait">
                    <div className="branch-title">
                      <span>Hypothetical: WAIT</span>
                      <span className="branch-tag tag-wait">
                        Efficiency: {auditData.counterfactuals.if_wait.efficiency}
                      </span>
                    </div>
                    <div className="branch-metrics">
                      <span><strong>Risk:</strong> {auditData.counterfactuals.if_wait.risk?.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="branch-rationale">{auditData.counterfactuals.if_wait.rationale}</p>
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
                  <h3>Symbolic Reasoning Derivation Steps</h3>
                </div>
                <span className="count-badge">{auditData.reasoning?.length || 0} steps</span>
              </div>

              <div className="audit-steps-list">
                {auditData.reasoning?.map((r: any) => (
                  <div key={r.sequence} className="audit-step-row">
                    <div className="step-number">{r.sequence}</div>
                    <div className="step-main">
                      <div className="step-header-line">
                        <span className="step-type-pill">{r.type}</span>
                        {r.rule_id && <span className="step-rule-pill">{r.rule_id}</span>}
                        <span className="step-conf-pill">{Math.round(r.confidence * 100)}%</span>
                      </div>
                      <div className="step-io">
                        {r.input && (
                          <div className="io-box">
                            <span className="io-tag">Input:</span>
                            <code>{JSON.stringify(r.input)}</code>
                          </div>
                        )}
                        {r.output && (
                          <div className="io-box">
                            <span className="io-tag">Output / Deduction:</span>
                            <code>{JSON.stringify(r.output)}</code>
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
                <span className="count-badge">{auditData.evidence?.length || 0} items</span>
              </div>

              <div className="audit-evidence-list">
                {auditData.evidence?.map((e: any) => (
                  <div key={e.id} className="audit-evidence-row">
                    <div className="ev-icon-wrapper">
                      <CheckCircle size={16} />
                    </div>
                    <div className="ev-details">
                      <b>{e.predicate?.replaceAll('_', ' ').toUpperCase()}</b>
                      <p>Value: <strong>{String(e.value?.value ?? JSON.stringify(e.value))}</strong></p>
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
