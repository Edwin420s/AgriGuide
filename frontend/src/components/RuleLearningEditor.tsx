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
      alert(err.message);
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

                  <div className="metta-code-box">
                    <Code2 size={14} />
                    <code>{r.metta_expr || `(if (>= $rain ${r.condition?.rain_threshold_min}) ${r.action})`}</code>
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
              <h3>Teach The Agent a New Rule</h3>
            </div>
          </div>

          <form className="rule-form" onSubmit={handleCreateRule}>
            <label>
              <span>Rule Name</span>
              <input
                type="text"
                placeholder="e.g. Sandy Loam Rain Buffer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label>
              <span>Description / Farmer Rationale</span>
              <input
                type="text"
                placeholder="e.g. Delay irrigation if rain forecast is above 60%"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="form-row">
              <label>
                <span>Forecast Rain Threshold (%): {rainMin}%</span>
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
                <span>Resulting Action</span>
                <select value={action} onChange={(e) => setAction(e.target.value)}>
                  <option value="WAIT">WAIT (Conserve Water)</option>
                  <option value="IRRIGATE">IRRIGATE (Protect Crop)</option>
                  <option value="REASSESS">REASSESS (Wait for More Data)</option>
                </select>
              </label>
            </div>

            <label>
              <span>Custom MeTTa S-Expression (Optional Override)</span>
              <textarea
                rows={2}
                placeholder="(= (kirinyaga-rule $soil $rain) (if (>= $rain 60) WAIT CONTINUED))"
                value={mettaExpr}
                onChange={(e) => setMettaExpr(e.target.value)}
              />
            </label>

            <button type="submit" className="primary" disabled={submitting || !name.trim()}>
              <Plus size={16} />
              <span>{submitting ? 'Registering Rule...' : 'Register Rule in MeTTa Space'}</span>
            </button>
          </form>

          {/* Baseline Knowledge Reference */}
          <div className="baseline-reference">
            <div className="ref-head">
              <BookOpen size={16} />
              <b>Baseline Agriculture Knowledge (Core MeTTa)</b>
            </div>
            <pre>
{`(= (water-demand flowering) high)
(= (water-demand vegetative) medium)
(= (irrigation-decision $soil $rain $water $current-rain)
    (if $current-rain WAIT
        (if (and (< $soil 18) (>= $rain 70) (== $water limited))
            WAIT
            (if (and (< $soil 18) (< $rain 35) (not (== $water unavailable)))
                IRRIGATE
                REASSESS))))`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
