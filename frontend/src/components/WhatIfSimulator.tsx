import React, { useState } from 'react';
import { Play, RotateCcw, Scale, Sliders, Sparkles, Terminal } from 'lucide-react';
import { simulateWhatIf } from '../lib/api';

interface WhatIfSimulatorProps {
  fieldId: string;
  fieldName: string;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ fieldId, fieldName }) => {
  const [soil, setSoil] = useState<number>(17);
  const [rain, setRain] = useState<number>(18);
  const [water, setWater] = useState<string>('LIMITED');
  const [currentRain, setCurrentRain] = useState<boolean>(false);
  const [testCustomRule, setTestCustomRule] = useState<boolean>(false);
  const [customAction, setCustomAction] = useState<string>('WAIT');
  const [customRainThresh, setCustomRainThresh] = useState<number>(60);

  const [loading, setLoading] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);

  const handleSimulate = async () => {
    if (!fieldId) return;
    setLoading(true);
    try {
      const payload: any = {
        soil_moisture: soil,
        rain_probability_24h: rain,
        water_availability: water,
        current_rainfall: currentRain
      };
      if (testCustomRule) {
        payload.custom_rule_action = customAction;
        payload.custom_rule_rain_min = customRainThresh;
      }
      const res = await simulateWhatIf(fieldId, payload);
      setSimResult(res);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetSoil: number, presetRain: number, presetWater: string, presetRaining = false) => {
    setSoil(presetSoil);
    setRain(presetRain);
    setWater(presetWater);
    setCurrentRain(presetRaining);
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div>
          <span className="pill pill-agent">NON-DESTRUCTIVE SANDBOX</span>
          <h2>What-If Scenario Simulator</h2>
          <p className="subtitle">
            Experiment with different weather and soil conditions in real-time. Watch how MeTTa rules deduct
            recommendations without mutating the field database.
          </p>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="presets-bar">
        <span className="preset-label">Test Scenarios:</span>
        <button
          className="preset-btn"
          onClick={() => {
            setPreset(16, 18, 'LIMITED');
            setTestCustomRule(false);
          }}
        >
          Dry Soil + Low Rain (Expect IRRIGATE)
        </button>
        <button
          className="preset-btn"
          onClick={() => {
            setPreset(16, 80, 'LIMITED');
            setTestCustomRule(false);
          }}
        >
          Dry Soil + Storm Expected (Expect WAIT)
        </button>
        <button
          className="preset-btn"
          onClick={() => {
            setPreset(16, 50, 'LIMITED', true);
            setTestCustomRule(false);
          }}
        >
          Rain Currently Falling (Expect WAIT)
        </button>
        <button
          className="preset-btn"
          onClick={() => {
            setPreset(16, 55, 'LIMITED');
            setTestCustomRule(true);
            setCustomRainThresh(50);
          }}
        >
          Custom Farmer Rule Trigger
        </button>
      </div>

      <div className="two-col-grid" style={{ marginTop: '1rem' }}>
        {/* Controls Card */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <Sliders size={18} />
              <h3>Simulated Field Parameters</h3>
            </div>
          </div>

          <div className="slider-control">
            <div className="slider-label-row">
              <span>Soil Moisture</span>
              <b>{soil}%</b>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              step="1"
              value={soil}
              onChange={(e) => setSoil(Number(e.target.value))}
            />
            <small className="muted">Permanent wilting point: &lt;15% · Optimal loam: 22-30%</small>
          </div>

          <div className="slider-control">
            <div className="slider-label-row">
              <span>24h Rain Probability</span>
              <b>{rain}%</b>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rain}
              onChange={(e) => setRain(Number(e.target.value))}
            />
            <small className="muted">Forecast precipitation likelihood over the next 24 hours</small>
          </div>

          <div className="form-row" style={{ marginTop: '1rem' }}>
            <label>
              <span>Water Availability</span>
              <select value={water} onChange={(e) => setWater(e.target.value)}>
                <option value="SURPLUS">SURPLUS (Full Tank)</option>
                <option value="ADEQUATE">ADEQUATE</option>
                <option value="LIMITED">LIMITED (Conserve Water)</option>
                <option value="UNAVAILABLE">UNAVAILABLE (Dry Well)</option>
              </select>
            </label>

            <label className="checkbox-label" style={{ marginTop: '1.6rem' }}>
              <input
                type="checkbox"
                checked={currentRain}
                onChange={(e) => setCurrentRain(e.target.checked)}
              />
              <span>Is it currently raining on the field?</span>
            </label>
          </div>

          {/* Custom Rule Test Toggle */}
          <div className="custom-rule-tester">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={testCustomRule}
                onChange={(e) => setTestCustomRule(e.target.checked)}
              />
              <b>Simulate with Custom Farmer Rule ("The Agent That Grows Up")</b>
            </label>

            {testCustomRule && (
              <div className="custom-rule-subfields">
                <div className="form-row">
                  <label>
                    <span>Threshold Rain %: {customRainThresh}%</span>
                    <input
                      type="range"
                      min="30"
                      max="90"
                      step="5"
                      value={customRainThresh}
                      onChange={(e) => setCustomRainThresh(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    <span>Action</span>
                    <select value={customAction} onChange={(e) => setCustomAction(e.target.value)}>
                      <option value="WAIT">WAIT</option>
                      <option value="IRRIGATE">IRRIGATE</option>
                      <option value="REASSESS">REASSESS</option>
                    </select>
                  </label>
                </div>
              </div>
            )}
          </div>

          <button className="primary" onClick={handleSimulate} disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>
            <Play size={16} />
            <span>{loading ? 'Evaluating MeTTa S-Expressions...' : 'Run Simulation'}</span>
          </button>
        </div>

        {/* Output Card */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <Terminal size={18} />
              <h3>MeTTa Deduction Output</h3>
            </div>
            <span className="pill pill-mode">INSTANT DEDUCTION</span>
          </div>

          {simResult ? (
            <div className="sim-output">
              <div className="sim-rec-banner">
                <span className={`decision-badge rec-${simResult.recommendation.toLowerCase()}`}>
                  {simResult.recommendation}
                </span>
                <span className="confidence-pill">
                  {Math.round(simResult.confidence * 100)}% Confidence
                </span>
              </div>

              <p className="sim-reason">{simResult.reason}</p>

              {/* MeTTa Counterfactual Trade-off Analysis */}
              {simResult.counterfactuals && (
                <div className="counterfactual-section">
                  <div className="counterfactual-header">
                    <Scale size={14} />
                    <span>MeTTa Counterfactual Analysis ("What If?")</span>
                  </div>
                  <div className="counterfactual-grid">
                    {simResult.counterfactuals.if_irrigate && (
                      <div className="counterfactual-card branch-irrigate">
                        <div className="branch-title">
                          <span>Action: IRRIGATE</span>
                          <span className="branch-tag tag-irrigate">
                            Eff: {simResult.counterfactuals.if_irrigate.efficiency}
                          </span>
                        </div>
                        <div className="branch-metrics">
                          <span><strong>Risk:</strong> {simResult.counterfactuals.if_irrigate.risk?.replaceAll('_', ' ')}</span>
                          {simResult.counterfactuals.if_irrigate.water_loss_risk && (
                            <span><strong>Loss:</strong> {simResult.counterfactuals.if_irrigate.water_loss_risk}</span>
                          )}
                        </div>
                        <p className="branch-rationale">{simResult.counterfactuals.if_irrigate.rationale}</p>
                      </div>
                    )}
                    {simResult.counterfactuals.if_wait && (
                      <div className="counterfactual-card branch-wait">
                        <div className="branch-title">
                          <span>Action: WAIT</span>
                          <span className="branch-tag tag-wait">
                            Eff: {simResult.counterfactuals.if_wait.efficiency}
                          </span>
                        </div>
                        <div className="branch-metrics">
                          <span><strong>Risk:</strong> {simResult.counterfactuals.if_wait.risk?.replaceAll('_', ' ')}</span>
                        </div>
                        <p className="branch-rationale">{simResult.counterfactuals.if_wait.rationale}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rules-fired-box">
                <b>Rules Fired:</b>
                <div className="rule-tags">
                  {simResult.rules?.map((r: string, idx: number) => (
                    <span key={idx} className="rule-tag">
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="derivation-steps">
                <b>Symbolic Derivation Steps:</b>
                <div className="steps-list">
                  {simResult.steps?.map((s: any, idx: number) => (
                    <div key={idx} className="step-item">
                      <span className="step-badge">{s.type}</span>
                      <code>{JSON.stringify(s.output || s.result)}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-sim">
              <Sparkles size={32} />
              <p>Adjust the sliders and click "Run Simulation" to test the MeTTa reasoning engine.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
