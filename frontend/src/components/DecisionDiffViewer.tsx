import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronRight, GitBranch, RefreshCw, Scale } from 'lucide-react';
import { getDecisionDiff } from '../lib/api';

interface DecisionDiffViewerProps {
  decisions: any[];
}

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
          <span className="pill">STATE REASSESSMENT & ADAPTATION</span>
          <h2>What Changed? (Decision Diff)</h2>
          <p className="subtitle">
            Transparently reveals how new sensory evidence caused the MeTTa agent to revise its recommendation.
          </p>
        </div>
      </div>

      {loading && <div className="loading-box">Computing decision lineage diff...</div>}

      {error && !loading && (
        <div className="empty-card">
          <p>{error}</p>
        </div>
      )}

      {!loading && !supersededDecision && (
        <div className="empty-card">
          <Scale size={32} />
          <h3>No Decision Supersession Recorded Yet</h3>
          <p>
            When field conditions change (such as sudden rainfall or new farmer observations), running the agent
            will record a revised decision superseding the previous one.
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
                <span>Decision ID: {diffData.superseded_id?.slice(0, 8)}...</span>
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
                  <h3>MeTTa Rules Shift</h3>
                </div>
              </div>
              <div className="rule-delta-body">
                {diffData.rule_changes?.length > 0 ? (
                  diffData.rule_changes.map((rc: any, idx: number) => (
                    <div key={idx} className="rule-shift-card">
                      <div className="rule-badge-group">
                        <span className="rule-badge old">
                          Prior Rule: {rc.previous_rules?.join(', ') || 'R-LOW-MOISTURE-LOW-RAIN'}
                        </span>
                        <ChevronRight size={16} />
                        <span className="rule-badge new">
                          Active Rule: {rc.new_rules?.join(', ') || 'R-HIGH-RAIN-WATER-CONSERVATION'}
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
                    <strong>{String(ev.value?.value ?? JSON.stringify(ev.value))}</strong>
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
