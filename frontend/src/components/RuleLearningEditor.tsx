import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Check,
  Code2,
  Plus,
  Power,
  Trash2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { getFieldRules, createFieldRule, toggleFieldRule, deleteFieldRule } from '../lib/api';

interface RuleLearningEditorProps {
  fieldId: string;
  fieldName: string;
  onRuleChanged: () => void;
}

export const RuleLearningEditor: React.FC<RuleLearningEditorProps> = ({
  fieldId,
  fieldName,
  onRuleChanged
}) => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rainMin, setRainMin] = useState(60);
  const [action, setAction] = useState('WAIT');
  const [mettaExpr, setMettaExpr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  const loadRules = async () => {
    if (!fieldId) return;
    setLoading(true);
    try {
      const data = await getFieldRules(fieldId);
      setRules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [fieldId]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createFieldRule(fieldId, {
        name,
        description: description || `Farmer customized rule: if rain >= ${rainMin}%, action is ${action}`,
        condition: { rain_threshold_min: Number(rainMin) },
        action,
        metta_expr: mettaExpr.trim() || `(= (farmer-rule-$name $soil $rain) (if (>= $rain ${rainMin}) ${action} CONTINUED))`,
        priority: 25,
        is_active: true
      });
      setName('');
      setDescription('');
      setMettaExpr('');
      setSuccessNotice('New MeTTa rule registered into agent space!');
      setTimeout(() => setSuccessNotice(''), 4000);
      await loadRules();
      onRuleChanged();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to save rule');
      setTimeout(() => setErrorNotice(''), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (ruleId: string) => {
    await toggleFieldRule(fieldId, ruleId);
    await loadRules();
    onRuleChanged();
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Delete this custom rule?')) return;
    await deleteFieldRule(fieldId, ruleId);
    await loadRules();
    onRuleChanged();
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div>
          <span className="pill pill-mode">DYNAMIC POLICY EVOLUTION</span>
          <h2>The Agent That Grows Up</h2>
          <p className="subtitle">
            Teach AgriGuide farm-specific rules. The agent evolves from a generic system into a customized expert
            for <strong>{fieldName}</strong>.
          </p>
        </div>
      </div>

      {successNotice && <div className="notice success">{successNotice}</div>}

      <div className="two-col-grid">
        {/* Active Custom Rules Card */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <BrainCircuit size={18} />
              <h3>Custom Field Rules ({rules.length})</h3>
            </div>
          </div>

          <div className="custom-rules-list">
            {loading ? (
              <p className="muted">Loading rules...</p>
            ) : rules.length === 0 ? (
              <div className="empty-rules">
                <Sparkles size={28} />
                <p>No customized rules added yet for this field.</p>
                <small>Use the form on the right to teach the agent your field constraints.</small>
              </div>
            ) : (
              rules.map((r) => (
                <div key={r.id} className={`rule-card ${r.is_active ? 'active' : 'inactive'}`}>
                  <div className="rule-card-header">
                    <div>
                      <h4>{r.name}</h4>
                      <span className={`action-badge ${r.action.toLowerCase()}`}>{r.action}</span>
                    </div>
                    <div className="rule-card-actions">
                      <button
                        className={`icon-button ${r.is_active ? 'on' : 'off'}`}
                        onClick={() => handleToggle(r.id)}
                        title={r.is_active ? 'Disable rule' : 'Enable rule'}
                      >
                        <Power size={15} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => handleDelete(r.id)}
                        title="Delete rule"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="rule-desc">{r.description}</p>

                  <div className="rule-condition-box">
                    <span className="condition-pill">
                      Trigger: <strong>24h Rain Forecast &ge; {r.condition?.rain_threshold_min ?? 60}%</strong>
                    </span>
                    <span className="arrow-sep">→</span>
                    <span className="action-pill">
                      Action: <strong>{r.action}</strong>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Rule Form */}
        <div className="panel">
          <div className="panel-header">
            <div className="title-row">
              <Plus size={18} />
              <h3>Teach The Agent a New Field Rule</h3>
            </div>
          </div>

          <form className="rule-form" onSubmit={handleCreateRule}>
            <label>
              <span>Rule Name</span>
              <input
                type="text"
                placeholder="e.g. Kirinyaga Flowering Rain Buffer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label>
              <span>Description / Farmer Rationale</span>
              <input
                type="text"
                placeholder="e.g. Pause irrigation when rain forecast is above 60% to avoid waterlogging"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="form-row">
              <label>
                <span>Forecast Rain Threshold: {rainMin}%</span>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={rainMin}
                  onChange={(e) => setRainMin(Number(e.target.value))}
                />
              </label>

              <label>
                <span>Recommended Action</span>
                <select value={action} onChange={(e) => setAction(e.target.value)}>
                  <option value="WAIT">WAIT (Conserve Water)</option>
                  <option value="IRRIGATE">IRRIGATE (Protect Crop)</option>
                  <option value="REASSESS">REASSESS (Wait for More Data)</option>
                </select>
              </label>
            </div>

            <button type="submit" className="primary" disabled={submitting || !name.trim()}>
              <Plus size={16} />
              <span>{submitting ? 'Activating Rule...' : 'Save & Activate Field Rule'}</span>
            </button>
          </form>

          {/* Baseline Agronomic Principles */}
          <div className="baseline-reference">
            <div className="ref-head">
              <BookOpen size={16} />
              <b>Standard Agronomic Governing Principles</b>
            </div>
            <div className="baseline-cards-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              <div style={{ background: '#f9fbf9', padding: '10px', borderRadius: '6px', border: '1px solid #e1ece5', fontSize: '13px' }}>
                <strong style={{ color: '#1e5a32' }}>🌱 Crop Sensitivity Hierarchy:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#405247' }}>Flowering & grain filling stages receive highest priority over vegetative stages during water scarcity.</p>
              </div>
              <div style={{ background: '#f9fbf9', padding: '10px', borderRadius: '6px', border: '1px solid #e1ece5', fontSize: '13px' }}>
                <strong style={{ color: '#1e5a32' }}>🌧️ Rain Conservation Policy:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#405247' }}>When rain forecast probability exceeds 70%, immediate irrigation is suspended to conserve reservoir capacity.</p>
              </div>
              <div style={{ background: '#f9fbf9', padding: '10px', borderRadius: '6px', border: '1px solid #e1ece5', fontSize: '13px' }}>
                <strong style={{ color: '#1e5a32' }}>🛡️ Root Zone Moisture Floor:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#405247' }}>If soil moisture drops below critical 18% threshold and rain probability is under 35%, drip irrigation is triggered immediately.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
