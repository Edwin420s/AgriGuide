import React, { useEffect, useState } from 'react';
import {
  Award,
  Check,
  CloudRain,
  Droplet,
  RefreshCw,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  ChevronDown,
  Layers
} from 'lucide-react';
import { learning, outcome, getSourceReliability, decide } from '../lib/api';

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
  const [notice, setNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  const handleRecordRainfall = async (mmValue: number, noteLabel?: string) => {
    if (!fieldId) return;
    setSubmitting(true);
    setNotice(null);
    try {
      let targetId = latestDecisionId;
      if (!targetId) {
        const d = await decide(fieldId);
        targetId = d.id;
      }
      await outcome(targetId, {
        type: 'ACTUAL_RAINFALL',
        observed_value: {
          millimeters: Number(mmValue),
          rained: Number(mmValue) > 1.0,
          source: 'manual-rain-gauge',
          label: noteLabel || (Number(mmValue) > 1.0 ? 'Rainfall verified' : 'No rain recorded')
        },
        confidence: 0.95,
        observed_at: new Date().toISOString()
      });
      setNotice({
        text: `Logged outcome: ${mmValue}mm. Cognitive closed-loop completed & Bayesian source reliability recalibrated!`,
        type: 'success'
      });
      setTimeout(() => setNotice(null), 5000);
      await loadData();
      onOutcomeAdded();
    } catch (err: any) {
      setNotice({
        text: `Failed to record outcome: ${err.message}`,
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tab-container">
      {/* Header */}
      <div className="tab-header">
        <div>
          <span className="pill pill-mode">CLOSED-LOOP COGNITIVE LEARNING</span>
          <h2>Field Outcomes & Continuous Learning</h2>
          <p className="subtitle">
            Did it actually rain? Did the soil hold moisture? Record real-world outcomes to close the cognitive loop.
            AgriGuide compares reality against earlier predictions to continuously calibrate weather and sensor reliability weights.
          </p>
        </div>
        <button className="secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh Calibration</span>
        </button>
      </div>

      {notice && (
        <div className={`status-banner ${notice.type}`} style={{ marginBottom: '1.25rem' }}>
          {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="two-col-grid" style={{ marginBottom: '2rem' }}>
        {/* Column 1: What Happened? (Record Ground Truth) */}
        <div className="panel" style={{ background: '#ffffff', border: '1.5px solid #d4e5d9', borderRadius: '12px', padding: '20px' }}>
          <div className="panel-header" style={{ marginBottom: '14px', borderBottom: '1px solid #edf4ef', paddingBottom: '10px' }}>
            <div className="title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CloudRain size={20} style={{ color: '#0f52ba' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#163b24' }}>
                  1. What Happened in the Field?
                </h3>
                <small style={{ color: '#557563' }}>Record verified ground truth after a weather or irrigation event</small>
              </div>
            </div>
          </div>

          <div className="outcome-box">
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.45', margin: '0 0 14px 0' }}>
              Select what took place following AgriGuide's earlier advisory. Logging ground truth directly teaches the neural-symbolic engine:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <button
                type="button"
                className="secondary"
                disabled={submitting}
                onClick={() => handleRecordRainfall(9.4, 'Convective shower verified')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f0f9ff',
                  borderColor: '#bae6fd',
                  color: '#0369a1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CloudRain size={16} />
                  <span>🌧️ Rain Occurred as Forecast (9.4 mm)</span>
                </div>
                <span style={{ fontSize: '11px', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                  Forecast Validated
                </span>
              </button>

              <button
                type="button"
                className="secondary"
                disabled={submitting}
                onClick={() => handleRecordRainfall(0.0, 'Rain forecast false alarm')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#fefce8',
                  borderColor: '#fef08a',
                  color: '#854d0e',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>☀️</span>
                  <span>No Rain Occurred (0.0 mm / False Alarm)</span>
                </div>
                <span style={{ fontSize: '11px', background: '#fef9c3', padding: '2px 8px', borderRadius: '4px' }}>
                  Reliability Discount
                </span>
              </button>

              <button
                type="button"
                className="secondary"
                disabled={submitting}
                onClick={() => handleRecordRainfall(3.2, 'Light drizzle')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderColor: '#e2e8f0',
                  color: '#334155',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Droplet size={16} />
                  <span>🌦️ Light Drizzle Only (3.2 mm)</span>
                </div>
                <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                  Partial Infiltration
                </span>
              </button>
            </div>

            <div style={{ background: '#f9fbf9', border: '1px solid #dcebdf', borderRadius: '8px', padding: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#163b24', marginBottom: '8px' }}>
                Or Log Custom Rain Gauge Measurement:
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={rainMm}
                    onChange={(e) => setRainMm(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #c3decb',
                      fontSize: '14px'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '10px', top: '8px', fontSize: '12px', color: '#688c75' }}>
                    mm
                  </span>
                </div>
                <button
                  type="button"
                  className="primary"
                  disabled={submitting}
                  onClick={() => handleRecordRainfall(rainMm, `Manual rain gauge: ${rainMm}mm`)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Log Gauge Reading
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: What AgriGuide Learned (Calibrated Source Weights) */}
        <div className="panel" style={{ background: '#ffffff', border: '1.5px solid #d4e5d9', borderRadius: '12px', padding: '20px' }}>
          <div className="panel-header" style={{ marginBottom: '14px', borderBottom: '1px solid #edf4ef', paddingBottom: '10px' }}>
            <div className="title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} style={{ color: '#16a34a' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#163b24' }}>
                    2. What AgriGuide Learned
                  </h3>
                  <small style={{ color: '#557563' }}>Calibrated telemetry reliability & closed-loop adjustments</small>
                </div>
              </div>
              <span style={{ fontSize: '11px', background: '#e6f4ea', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                {learningEvents.length} Events Logged
              </span>
            </div>
          </div>

          {/* Calibrated Source Weights Progress List */}
          <div style={{ marginBottom: '1.25rem' }}>
            <b style={{ fontSize: '12.5px', color: '#173b24', display: 'block', marginBottom: '8px' }}>
              Active Telemetry Reliability Weights:
            </b>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sources.map((s) => (
                <div key={s.id} style={{ background: '#f8faf8', border: '1px solid #e1eee4', borderRadius: '8px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={14} style={{ color: '#166534' }} />
                      <strong style={{ fontSize: '13px', color: '#1a3826' }}>{s.source_id}</strong>
                      <span style={{ fontSize: '10.5px', background: '#e5f3eb', color: '#144c27', padding: '1px 6px', borderRadius: '4px' }}>
                        {s.source_type}
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>
                      {Math.round(s.score * 100)}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#e2ece4', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.round(s.score * 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #16a34a, #22c55e)',
                        borderRadius: '3px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10.5px', color: '#668772' }}>
                    <span>Historical Verification Samples: {s.samples}</span>
                    <span>Status: Calibrated Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Events Mini-Feed */}
          <div>
            <b style={{ fontSize: '12.5px', color: '#173b24', display: 'block', marginBottom: '8px' }}>
              Recent Calibration Adjustments:
            </b>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {learningEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#6b8273', fontSize: '12.5px' }}>
                  <Sparkles size={20} style={{ margin: '0 auto 6px auto', display: 'block', color: '#166534' }} />
                  No calibration events recorded yet for this field. Log an outcome on the left!
                </div>
              ) : (
                learningEvents.slice(0, 5).map((evt) => (
                  <div key={evt.id} style={{ background: '#f8faf9', border: '1px solid #e8f0ea', borderRadius: '6px', padding: '8px 12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#557563', fontSize: '10.5px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 700, color: '#1e5a32' }}>{evt.type}</span>
                      <span>{new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ margin: 0, color: '#1f2937' }}>{evt.pattern}</p>
                    {evt.old_value !== null && evt.new_value !== null && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#166534', fontWeight: 600 }}>
                        Score Adjustment: {evt.old_value} → {evt.new_value}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Collapsible Secondary Section: Bayesian Calibration Details */}
      <details
        style={{
          background: '#f8faf8',
          border: '1px solid #d4e5d9',
          borderRadius: '12px',
          padding: '16px 20px'
        }}
      >
        <summary
          style={{
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13.5px',
            color: '#165e32',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            userSelect: 'none'
          }}
        >
          <Calculator size={16} />
          <span>🔬 Mathematical Bayesian Formulation & Calibration Derivation (Click to Expand)</span>
        </summary>

        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #e2ede5', fontSize: '12.5px', color: '#4b5563', lineHeight: '1.5' }}>
          <p>
            AgriGuide employs sequential Bayesian updating to adjust provider reliability without manual weight tuning:
          </p>
          <div style={{ background: '#ffffff', border: '1px solid #d0e4d6', borderRadius: '8px', padding: '12px 16px', fontFamily: 'monospace', margin: '10px 0' }}>
            P(Rain | Sensor) = [ P(Sensor | Rain) · P(Rain) ] / P(Sensor)
          </div>
          <p>
            When a verified rain event is recorded, the likelihood term <code>P(Sensor | Rain)</code> increases for models that correctly predicted precipitation, reducing Brier error scores across all 81 verified Kenyan agricultural hubs.
          </p>
        </div>
      </details>
    </div>
  );
};
