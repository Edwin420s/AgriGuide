import React, { useEffect, useState } from 'react';
import { Award, Check, CloudRain, Droplet, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import { learning, outcome, getSourceReliability } from '../lib/api';

interface LearningCenterProps {
  fieldId: string;
  latestDecisionId?: string;
  onOutcomeAdded: () => void;
}

export const LearningCenter: React.FC<LearningCenterProps> = ({
  fieldId,
  latestDecisionId,
  onOutcomeAdded
}) => {
  const [learningEvents, setLearningEvents] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rainMm, setRainMm] = useState<number>(8.5);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const loadData = async () => {
    if (!fieldId) return;
    setLoading(true);
    try {
      const [events, srcList] = await Promise.all([
        learning(fieldId),
        getSourceReliability()
      ]);
      setLearningEvents(events);
      setSources(srcList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fieldId]);

  const handleRecordRainfall = async (mmValue: number) => {
    if (!latestDecisionId) {
      alert('Please run a cognitive decision on the field first before recording outcomes.');
      return;
    }
    setSubmitting(true);
    try {
      await outcome(latestDecisionId, {
        type: 'ACTUAL_RAINFALL',
        observed_value: {
          millimeters: Number(mmValue),
          rained: Number(mmValue) > 1.0,
          source: 'manual-rain-gauge'
        },
        confidence: 0.95,
        observed_at: new Date().toISOString()
      });
      setNotice(`Recorded ${mmValue}mm rainfall! Closed loop updated & source reliability calibrated.`);
      setTimeout(() => setNotice(''), 4000);
      await loadData();
      onOutcomeAdded();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div>
          <span className="pill pill-mode">CLOSED-LOOP VERIFICATION</span>
          <h2>Learning & Source Calibration</h2>
          <p className="subtitle">
            AgriGuide compares real-world ground truth (actual rain & soil moisture) against prior decisions,
            dynamically calibrating weather and sensor reliability weights.
          </p>
        </div>
      </div>

      {notice && <div className="notice success">{notice}</div>}

      <div className="two-col-grid">
        {/* Ground Truth Logger */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <CloudRain size={18} />
              <h3>Record Ground Truth Outcome</h3>
            </div>
          </div>

          <div className="outcome-box">
            <p>
              When a rain event passes or an irrigation cycle concludes, log the measured rainfall to close the
              cognitive loop:
            </p>

            <div className="quick-outcome-buttons">
              <button
                className="secondary"
                disabled={submitting}
                onClick={() => handleRecordRainfall(9.4)}
              >
                <Droplet size={15} />
                <span>Rain Occurred (9.4 mm)</span>
              </button>
              <button
                className="secondary"
                disabled={submitting}
                onClick={() => handleRecordRainfall(0.0)}
              >
                <span>No Rain (0.0 mm / False Alarm)</span>
              </button>
            </div>

            <div className="custom-outcome-row">
              <label>
                <span>Custom Measured Rainfall (mm):</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rainMm}
                  onChange={(e) => setRainMm(Number(e.target.value))}
                />
              </label>
              <button
                className="primary"
                disabled={submitting}
                onClick={() => handleRecordRainfall(rainMm)}
              >
                Log Outcome
              </button>
            </div>
          </div>

          {/* Calibrated Source Reliability Table */}
          <div className="source-reliability-section" style={{ marginTop: '1.5rem' }}>
            <div className="sub-header">
              <Award size={16} />
              <b>Calibrated Source Reliability Weights</b>
            </div>

            <table className="reliability-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Reliability Score</th>
                  <th>Samples</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.source_id}</strong>
                    </td>
                    <td>
                      <span className="source-type-tag">{s.source_type}</span>
                    </td>
                    <td>
                      <div className="score-cell">
                        <div className="score-bar-bg">
                          <div
                            className="score-bar-fill"
                            style={{ width: `${Math.round(s.score * 100)}%` }}
                          />
                        </div>
                        <span>{Math.round(s.score * 100)}%</span>
                      </div>
                    </td>
                    <td>{s.samples}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Learning Events Stream */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <TrendingUp size={18} />
              <h3>Learning History & Calibration Events</h3>
            </div>
            <span className="count-badge">{learningEvents.length} events</span>
          </div>

          <div className="learning-events-list">
            {learningEvents.length === 0 ? (
              <div className="empty-learning">
                <Sparkles size={28} />
                <p>No calibration events recorded yet.</p>
                <small>Record an outcome on the left to trigger Bayesian source calibration.</small>
              </div>
            ) : (
              learningEvents.map((evt) => (
                <div key={evt.id} className="learning-card">
                  <div className="learning-card-top">
                    <span className="event-type-badge">{evt.type}</span>
                    <small>{new Date(evt.created_at).toLocaleString()}</small>
                  </div>

                  <p className="learning-pattern">{evt.pattern}</p>

                  {evt.old_value !== null && evt.new_value !== null && (
                    <div className="calibration-shift">
                      <span className="shift-old">{evt.old_value}</span>
                      <span>→</span>
                      <span className="shift-new">{evt.new_value}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
