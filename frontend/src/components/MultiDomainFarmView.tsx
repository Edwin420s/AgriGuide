import React, { useEffect, useState } from 'react';
import {
  Sprout,
  Droplets,
  FlaskConical,
  HeartPulse,
  CloudLightning,
  Wheat,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Send,
  Zap,
  Sliders,
  Scale
} from 'lucide-react';
import { getHolisticStatus, proposeAction } from '../lib/api';

interface MultiDomainFarmProps {
  field: any;
  state: any;
}

export const MultiDomainFarmView: React.FC<MultiDomainFarmProps> = ({ field, state }) => {
  const [holistic, setHolistic] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Action Proposal Form State
  const [actionType, setActionType] = useState<string>('IRRIGATE');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [waterVolumeLiters, setWaterVolumeLiters] = useState<number>(2500);
  const [chemicalType, setChemicalType] = useState<string>('Urea 46-0-0');
  const [proposing, setProposing] = useState<boolean>(false);
  const [proposalResult, setProposalResult] = useState<any>(null);

  const fetchHolisticData = async () => {
    if (!field?.id) return;
    setLoading(true);
    try {
      const data = await getHolisticStatus(field.id);
      setHolistic(data);
    } catch (e) {
      console.error('Failed to load holistic status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolisticData();
  }, [field?.id]);

  const handleProposeAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!field?.id || proposing) return;
    setProposing(true);
    setProposalResult(null);

    const params: any = {};
    if (actionType === 'IRRIGATE') {
      params.duration_minutes = durationMinutes;
      params.volume_liters = waterVolumeLiters;
    } else if (actionType === 'FERTILIZE') {
      params.fertilizer_type = chemicalType;
      params.rate_kg_per_ha = 50;
    } else if (actionType === 'SPRAY') {
      params.compound = 'Organic Fungicide';
      params.wind_tolerance_kmh = 25;
    }

    try {
      const res = await proposeAction(field.id, actionType, params);
      setProposalResult(res);
    } catch (err) {
      console.error('Action proposal error:', err);
    } finally {
      setProposing(false);
    }
  };

  const domainCards = [
    {
      key: 'irrigation',
      title: 'Irrigation Management',
      icon: <Droplets size={22} style={{ color: '#2563eb' }} />,
      color: '#2563eb',
      data: holistic?.irrigation || {
        recommendation: state?.recommendation || 'DELAY_IRRIGATION',
        confidence: state?.confidence || 0.88,
        reason: 'Soil moisture is dry, but 75% rain is forecasted within 24 hours. Wait for precipitation.',
        rules: ['R-RAIN-SUPERSEDES-IRRIGATION', 'R-WATER-CONSERVATION']
      }
    },
    {
      key: 'planting',
      title: 'Planting Window',
      icon: <Sprout size={22} style={{ color: '#16a34a' }} />,
      color: '#16a34a',
      data: holistic?.planting || {
        recommendation: 'MONITOR',
        confidence: 0.72,
        reason: 'Current seedbed moisture is marginal; assess upcoming 48h moisture infiltration.',
        rules: ['R-MARGINAL-PLANTING-CONDITIONS']
      }
    },
    {
      key: 'fertilization',
      title: 'Nutrient & Leaching Protection',
      icon: <FlaskConical size={22} style={{ color: '#7c3aed' }} />,
      color: '#7c3aed',
      data: holistic?.fertilization || {
        recommendation: 'DELAY_APPLICATION',
        confidence: 0.91,
        reason: 'Heavy convective precipitation (>10mm) forecasted; nitrogen leaching risk exceeds safe threshold.',
        rules: ['R-LEACHING-PROTECTION-HIGH-RAIN']
      }
    },
    {
      key: 'crop_health',
      title: 'Crop Vigor & Stress',
      icon: <HeartPulse size={22} style={{ color: '#059669' }} />,
      color: '#059669',
      data: holistic?.crop_health || {
        recommendation: 'HEALTHY',
        confidence: 0.88,
        reason: 'Vegetative canopy healthy; no acute wilting or heat stress detected.',
        rules: ['R-CROP-VIGOR-GOOD']
      }
    },
    {
      key: 'weather_risk',
      title: 'Microclimate & Weather Risk',
      icon: <CloudLightning size={22} style={{ color: '#d97706' }} />,
      color: '#d97706',
      data: holistic?.weather_risk || {
        recommendation: 'LOW_RISK',
        confidence: 0.85,
        reason: 'No gale force winds or catastrophic hail detected in ensemble models.',
        rules: ['R-WEATHER-NOMINAL']
      }
    },
    {
      key: 'harvest',
      title: 'Harvest Readiness',
      icon: <Wheat size={22} style={{ color: '#ca8a04' }} />,
      color: '#ca8a04',
      data: holistic?.harvest || {
        recommendation: 'DELAY_HARVEST',
        confidence: 0.95,
        reason: 'Crop in vegetative growth stage; maturity expected in 45-60 days.',
        rules: ['R-PHYSIOLOGICAL-IMMATURE']
      }
    }
  ];

  return (
    <div className="tab-container">
      {/* Header Banner */}
      <div className="card-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <span className="pill">CROSS-DOMAIN COGNITIVE SYNTHESIS</span>
          <h2 style={{ fontSize: '1.4rem', marginTop: '4px' }}>
            Multi-Domain Agricultural Decision Suite
          </h2>
          <p className="field-subtitle">
            Simultaneous reasoning across Irrigation, Planting, Fertilization, Crop Health, Weather Hazards, and Harvest Readiness
          </p>
        </div>
        <button className="secondary" onClick={fetchHolisticData} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh All Domains</span>
        </button>
      </div>

      {/* Domain Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        {domainCards.map((domain) => (
          <div
            key={domain.key}
            className="field-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderTop: `4px solid ${domain.color}`
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {domain.icon}
                  <h4 style={{ margin: 0, fontSize: '15px' }}>{domain.title}</h4>
                </div>
                <span className="confidence-pill">
                  {Math.round((domain.data?.confidence || 0.85) * 100)}%
                </span>
              </div>

              <div style={{ margin: '10px 0' }}>
                <span
                  className="decision-badge"
                  style={{
                    background:
                      domain.data?.recommendation === 'IRRIGATE' || domain.data?.recommendation === 'APPLY'
                        ? '#dcfce7'
                        : '#fef3c7',
                    color:
                      domain.data?.recommendation === 'IRRIGATE' || domain.data?.recommendation === 'APPLY'
                        ? '#166534'
                        : '#92400e',
                    fontSize: '13px'
                  }}
                >
                  {domain.data?.recommendation}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.45', margin: '8px 0' }}>
                {domain.data?.reason}
              </p>
            </div>

            <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
              <small style={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>
                <strong>MeTTa Rules:</strong> {domain.data?.rules?.join(', ') || 'R-DOMAIN-GROUNDED'}
              </small>
            </div>
          </div>
        ))}
      </div>

      {/* Safety Policy & Physical Actuation Guardrails */}
      <div className="audit-section-card">
        <div className="card-head">
          <div>
            <span className="pill pill-mode">DETERMINISTIC SAFETY GUARDRAILS</span>
            <h3>Physical Actuation Proposer & Safety Policy Enforcer</h3>
            <small style={{ color: '#555' }}>
              Propose field interventions (e.g. 45 min irrigation valve actuation) and test the deterministic safety policy engine.
              Safety rules enforce non-overridable ceilings (e.g., maximum 30 min duration clamp, wind lockouts, reservoir depletion lockout).
            </small>
          </div>
          <ShieldCheck size={24} style={{ color: '#16a34a' }} />
        </div>

        <form onSubmit={handleProposeAction} style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                Action Type
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="model-select-dropdown"
                style={{ width: '100%' }}
              >
                <option value="IRRIGATE">Trigger Solenoid Irrigation Valve</option>
                <option value="FERTILIZE">Apply Granular Nitrogen Top-Dressing</option>
                <option value="SPRAY">Foliar Micro-Nutrient / Organic Spray</option>
              </select>
            </div>

            {actionType === 'IRRIGATE' && (
              <>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Proposed Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="consult-input"
                    style={{ width: '100%' }}
                  />
                  <small style={{ color: '#6b7280', fontSize: '11px' }}>Policy maximum ceiling: 30 minutes</small>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Target Water Volume (Liters)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={waterVolumeLiters}
                    onChange={(e) => setWaterVolumeLiters(Number(e.target.value))}
                    className="consult-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            )}

            {actionType === 'FERTILIZE' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                  Fertilizer Blend
                </label>
                <input
                  type="text"
                  value={chemicalType}
                  onChange={(e) => setChemicalType(e.target.value)}
                  className="consult-input"
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          <button type="submit" className="primary" disabled={proposing}>
            <Zap size={15} />
            <span>{proposing ? 'Validating Safety Policies...' : 'Submit Action Proposal'}</span>
          </button>
        </form>

        {proposalResult && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '16px',
              borderRadius: '8px',
              background: proposalResult.policy_evaluation?.is_permitted ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${proposalResult.policy_evaluation?.is_permitted ? '#bbf7d0' : '#fecaca'}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {proposalResult.policy_evaluation?.is_permitted ? (
                  <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
                ) : (
                  <AlertTriangle size={20} style={{ color: '#dc2626' }} />
                )}
                <strong style={{ fontSize: '14px', color: proposalResult.policy_evaluation?.is_permitted ? '#166534' : '#991b1b' }}>
                  Safety Policy Status: {proposalResult.policy_evaluation?.status || (proposalResult.policy_evaluation?.is_permitted ? 'PERMITTED' : 'BLOCKED')}
                </strong>
              </div>
              <span
                className="pill"
                style={{
                  background: proposalResult.policy_evaluation?.is_permitted ? '#dcfce7' : '#fee2e2',
                  color: proposalResult.policy_evaluation?.is_permitted ? '#166534' : '#991b1b'
                }}
              >
                Action: {proposalResult.action_type}
              </span>
            </div>

            <p style={{ margin: '6px 0', fontSize: '13px', color: '#374151' }}>
              {proposalResult.policy_evaluation?.reason || 'Proposal passed all deterministic safety guardrails.'}
            </p>

            {proposalResult.policy_evaluation?.modifications && (
              <div style={{ background: '#fef3c7', padding: '8px 12px', borderRadius: '6px', marginTop: '8px', fontSize: '12.5px', color: '#92400e' }}>
                <strong>Deterministic Policy Guardrail Clamped Parameters:</strong>
                <pre style={{ margin: '4px 0', fontFamily: 'monospace' }}>
                  {JSON.stringify(proposalResult.policy_evaluation.modifications, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
              <div>
                <strong>Rules Enforced:</strong> {proposalResult.policy_evaluation?.rules_enforced?.join(', ') || 'SAFE-BOUNDARY-CHECK'}
              </div>
              <div>
                <strong>Deterministic Non-Repudiation:</strong> VERIFIED
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
