import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight, GitBranch, RefreshCw, Scale } from 'lucide-react';
import { getDecisionDiff } from '../lib/api';

interface DecisionDiffViewerProps {
  decisions: any[];
}

const humanizeRule = (rule: string) => {
  if (!rule) return '';
  const map: Record<string, string> = {
    'R-LOW-MOISTURE-LOW-RAIN': 'Moisture Deficit (Rain Unlikely)',
    'R-HIGH-RAIN-WATER-CONSERVATION': 'Water Conservation (Rain Imminent)',
    'R-WAIT-HIGH-RAIN': 'Rain Forecast Water Conservation',
    'R-IRRIGATE-DEFICIT': 'Critical Moisture Deficit Trigger',
    'R-DEFAULT-MONITOR': 'Continuous Field Monitoring',
    'R-MEM-RECONCILE': 'Historical Memory Reconciler'
  };
  return map[rule] || rule.replace(/^R-/, '').replace(/-/g, ' ');
};

const formatEvidenceValue = (val: any) => {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'object') {
    if (val.probability !== undefined) return `${val.probability}% rain probability`;
    if (val.value !== undefined) return `${val.value}${val.unit ? ' ' + val.unit : ''}`;
    if (val.text) return val.text;
    return Object.entries(val).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ');
  }
  return String(val);
};

export const DecisionDiffViewer: React.FC<DecisionDiffViewerProps> = ({ decisions }) => {
  const [diffData, setDiffData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Find latest superseded decision
  const supersededDecision = decisions.find((d) => d.supersedes_id);

  useEffect(() => {
    if (supersededDecision) {
      loadDiff(supersededDecision.id);
    } else {
      setDiffData(null);
    }
  }, [supersededDecision]);

  const loadDiff = async (decisionId: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await getDecisionDiff(decisionId);
      setDiffData(data);
    } catch (err: any) {
      setError(err.message || 'No supersession diff found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div>
          <span className="pill">ADVISORY UPDATES</span>
          <h2>Decision History & Changes</h2>
          <p className="subtitle">
            See how new field conditions (such as sudden rainfall or new farmer observations) changed earlier advice.
          </p>
        </div>
      </div>

      {loading && <div className="loading-box">Comparing historical decision records...</div>}

      {error && !loading && (
        <div className="empty-card">
          <p>{error}</p>
        </div>
      )}

      {!loading && !supersededDecision && (
        <div className="empty-card" style={{ padding: '3rem 1rem', textAlign: 'center', background: '#fcfdfc', borderRadius: '8px', border: '1px dashed #d1e2d7', marginTop: '1rem' }}>
          <Scale size={36} color="#457053" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ color: '#1e5a32', margin: '0 0 8px 0' }}>No Decision Changes Recorded Yet</h3>
          <p style={{ maxWidth: '540px', margin: '0 auto', color: '#566e60', fontSize: '14px', lineHeight: '1.5' }}>
            When environmental conditions shift (for example, if you click <strong>"Simulate Rain Event (82%)"</strong> on the <strong>Field Advisor</strong> tab), the system updates its recommendation and displays a clear side-by-side comparison here.
          </p>
        </div>
      )}

      {diffData && !loading && (
        <div className="diff-view">
          {/* Side-by-Side Comparison Hero */}
          <div className="diff-hero-grid">
            <div className="diff-card before">
              <span className="diff-label">EARLIER DECISION</span>
              <div className="diff-rec-tag irrigate">{diffData.previous_recommendation || 'IRRIGATE'}</div>
              <p className="diff-reason">{diffData.previous_reason || 'Initial recommendation'}</p>
              <div className="diff-meta">
                <span>Decision Ref: #{diffData.superseded_id?.slice(0, 8)}</span>
              </div>
            </div>

            <div className="diff-transition">
              <div className="transition-circle">
                <ArrowRight size={24} />
              </div>
              <span className="transition-label">REVISED BY EVIDENCE</span>
            </div>

            <div className="diff-card after">
              <span className="diff-label">NEW REVISED DECISION</span>
              <div className="diff-rec-tag wait">{diffData.recommendation}</div>
              <p className="diff-reason">{diffData.reason}</p>
              <div className="diff-meta">
                <span>Confidence Delta: {diffData.confidence_delta >= 0 ? `+${diffData.confidence_delta}` : diffData.confidence_delta}</span>
              </div>
            </div>
          </div>

          {/* Detailed Changes Breakdown */}
          <div className="two-col-grid" style={{ marginTop: '1.5rem' }}>
            {/* Rule Firing Delta */}
            <div className="panel">
              <div className="panel-header">
                <div className="title-row">
                  <GitBranch size={18} />
                  <h3>Agronomic Rules Shift</h3>
                </div>
              </div>
              <div className="rule-delta-body">
                {diffData.rule_changes?.length > 0 ? (
                  diffData.rule_changes.map((rc: any, idx: number) => (
                    <div key={idx} className="rule-shift-card">
                      <div className="rule-badge-group">
                        <span className="rule-badge old">
                          Prior Rule: {rc.previous_rules?.map(humanizeRule).join(', ') || 'Soil Moisture Deficit'}
                        </span>
                        <ChevronRight size={16} />
                        <span className="rule-badge new">
                          Active Rule: {rc.new_rules?.map(humanizeRule).join(', ') || 'Rain Buffer Conservation'}
                        </span>
                      </div>
                      <p className="rule-explanation">{rc.explanation}</p>
                    </div>
                  ))
                ) : (
                  <p className="muted">No rule transition data recorded.</p>
                )}
              </div>
            </div>

            {/* Evidence That Triggered Revision */}
            <div className="panel">
              <div className="panel-header">
                <div className="title-row">
                  <CheckCircle2 size={18} />
                  <h3>Triggering Evidence Updates</h3>
                </div>
              </div>
              <div className="evidence-delta-list">
                {diffData.evidence_changes?.map((ev: any, idx: number) => (
                  <div key={idx} className="evidence-delta-row">
                    <div>
                      <b>{ev.predicate?.replaceAll('_', ' ').toUpperCase()}</b>
                      <small>Source: {ev.source}</small>
                    </div>
                    <strong>{formatEvidenceValue(ev.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
