import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Play, ShieldAlert, Cpu, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { runBenchmark, getModelRoutes } from '../lib/api';

export const ScientificBenchmarkView: React.FC = () => {
  const [scorecard, setScorecard] = useState<any>(null);
  const [modelRoutes, setModelRoutes] = useState<any[]>([]);
  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => {
    loadModelRoutes();
    handleRunBenchmark();
  }, []);

  const loadModelRoutes = async () => {
    try {
      const data = await getModelRoutes();
      setModelRoutes(data.routes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunBenchmark = async () => {
    setRunning(true);
    try {
      const res = await runBenchmark();
      setScorecard(res);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div>
          <span className="pill pill-mode">SCIENTIFIC VERIFICATION LABORATORY</span>
          <h2>Platform Benchmark & Task Routing</h2>
          <p className="subtitle">
            Automated 10-point scientific simulation suite verifying reasoning consistency,
            conflict resolution, sensor anomaly detection, safety policies, and model routing.
          </p>
        </div>

        <button className="primary" onClick={handleRunBenchmark} disabled={running}>
          <Play size={16} />
          <span>{running ? 'Executing Scenarios...' : 'Run 10-Point Benchmark'}</span>
        </button>
      </div>

      {scorecard && (
        <div className="benchmark-summary-grid">
          <div className="score-card highlight">
            <Award size={32} className="score-icon" />
            <div>
              <h3>Overall Verification Score</h3>
              <p className="big-score">{scorecard.overall_score_pct}%</p>
              <small>{scorecard.passed_tests} of {scorecard.total_tests} scenarios passed</small>
            </div>
          </div>

          <div className="score-card">
            <Clock size={32} className="score-icon" />
            <div>
              <h3>Execution Latency</h3>
              <p className="big-score">{scorecard.duration_ms} ms</p>
              <small>Local deterministic MeTTa inference</small>
            </div>
          </div>

          <div className="score-card">
            <Cpu size={32} className="score-icon" />
            <div>
              <h3>Active Model Fleet</h3>
              <p className="big-score">5 Models</p>
              <small>SingularityNET ASI Cloud</small>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Results Table */}
      {scorecard && (
        <div className="panel" style={{ marginTop: '24px' }}>
          <div className="panel-header">
            <div className="title-row">
              <CheckCircle2 size={18} />
              <h3>10-Point Agronomic Scenario Results</h3>
            </div>
            <span className="count-badge">{scorecard.passed_tests} / {scorecard.total_tests} Verified</span>
          </div>

          <div className="benchmark-table-wrapper">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Scenario</th>
                  <th>Expected Action</th>
                  <th>Actual Output</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {scorecard.results.map((r: any, idx: number) => (
                  <tr key={idx} className={r.passed ? 'row-passed' : 'row-failed'}>
                    <td>
                      {r.passed ? (
                        <span className="status-tag tag-pass">PASSED</span>
                      ) : (
                        <span className="status-tag tag-fail">FAILED</span>
                      )}
                    </td>
                    <td><strong>{r.category}</strong></td>
                    <td>{r.scenario_name}</td>
                    <td><code>{r.expected}</code></td>
                    <td><code>{r.actual}</code></td>
                    <td>{r.duration_ms} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Model Router Architecture */}
      <div className="panel" style={{ marginTop: '24px' }}>
        <div className="panel-header">
          <div className="title-row">
            <Sparkles size={18} />
            <h3>Intelligent Model Task Router</h3>
          </div>
          <span className="count-badge">5 ASI Cloud Models</span>
        </div>

        <p style={{ color: '#4a6b57', fontSize: '14px', marginBottom: '16px' }}>
          Workloads are automatically dispatched to the optimal model based on operational trade-offs,
          while preserving MeTTa symbolic derivation as the immutable ground truth.
        </p>

        <div className="routes-grid">
          {modelRoutes.map((route, idx) => (
            <div key={idx} className="route-card">
              <span className="route-task-badge">{route.task.toUpperCase()}</span>
              <h4>{route.default_model}</h4>
              <p>{route.rationale}</p>
              <small>Fallback: <code>{route.fallback_model}</code></small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
