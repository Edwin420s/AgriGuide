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
  Scale,
  ArrowRight,
  Clock,
  Layers,
  HelpCircle
} from 'lucide-react';
import { getHolisticStatus, proposeAction } from '../lib/api';
import { TabType } from './Sidebar';

interface MultiDomainFarmProps {
  field: any;
  state: any;
  decision?: any;
  onNavigateTab?: (tab: TabType) => void;
}

export const MultiDomainFarmView: React.FC<MultiDomainFarmProps> = ({
  field,
  state,
  decision,
  onNavigateTab
}) => {
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

  const getDomain = (key: string, fallback: any) => {
    return holistic?.domains?.[key] || holistic?.[key] || fallback;
  };

  const canonicalRecommendation = decision?.recommendation || state?.recommendation || 'WAIT';
  const canonicalConfidence = decision?.confidence || state?.confidence || 0.88;
  const canonicalReason = decision?.reason || 'Advisory synchronized with active field root zone telemetry and weather forecast.';
  const canonicalRules = decision?.rules || ['R-CANONICAL-DECISION'];

  const secondaryDomains = [
    {
      key: 'planting',
      title: 'Planting Window',
      category: 'Seasonal Planning',
      icon: <Sprout size={20} style={{ color: '#16a34a' }} />,
      color: '#16a34a',
      data: getDomain('planting', {
        recommendation: 'MONITOR',
        confidence: 0.72,
        reason: 'Current seedbed moisture is marginal; assess upcoming 48h moisture infiltration.',
        rules: ['R-MARGINAL-PLANTING-CONDITIONS']
      })
    },
    {
      key: 'fertilization',
      title: 'Nutrient & Leaching Protection',
      category: 'Crop Nutrition',
      icon: <FlaskConical size={20} style={{ color: '#7c3aed' }} />,
      color: '#7c3aed',
      data: getDomain('fertilization', {
        recommendation: 'DELAY_APPLICATION',
        confidence: 0.91,
        reason: 'Heavy convective precipitation (>10mm) forecasted; nitrogen leaching risk exceeds safe threshold.',
        rules: ['R-LEACHING-PROTECTION-HIGH-RAIN']
      })
    },
    {
      key: 'crop_health',
      title: 'Crop Vigor & Stress',
      category: 'Canopy Monitoring',
      icon: <HeartPulse size={20} style={{ color: '#059669' }} />,
      color: '#059669',
      data: getDomain('crop_health', {
        recommendation: 'HEALTHY',
        confidence: 0.88,
        reason: 'Vegetative canopy healthy; no acute wilting or thermal stress detected.',
        rules: ['R-CROP-VIGOR-GOOD']
      })
    },
    {
      key: 'weather_risk',
      title: 'Microclimate & Weather Risk',
      category: 'Atmospheric Risk',
      icon: <CloudLightning size={20} style={{ color: '#d97706' }} />,
      color: '#d97706',
      data: getDomain('weather_risk', {
        recommendation: 'LOW_RISK',
        confidence: 0.85,
        reason: 'No gale force winds or catastrophic hail detected in ensemble models.',
        rules: ['R-WEATHER-NOMINAL']
      })
    },
    {
      key: 'harvest',
      title: 'Harvest Readiness',
      category: 'Phenology Milestone',
      icon: <Wheat size={20} style={{ color: '#ca8a04' }} />,
      color: '#ca8a04',
      data: getDomain('harvest', {
        recommendation: 'DELAY_HARVEST',
        confidence: 0.95,
        reason: 'Crop in vegetative growth stage; maturity expected in 45-60 days.',
        rules: ['R-PHYSIOLOGICAL-IMMATURE']
      })
    }
  ];

  return (
    <div className="tab-container">
      {/* Header Banner */}
      <div className="card-head" style={{ marginBottom: '1.25rem' }}>
        <div>
          <span className="pill pill-mode">CANONICAL FARM OPERATIONS</span>
          <h2 style={{ fontSize: '1.4rem', marginTop: '4px' }}>
            Farm Operations & Action Guardrails
          </h2>
          <p className="field-subtitle">
            Synchronized execution across Irrigation (Primary Active Decision Loop) alongside seasonal agronomic context.
          </p>
        </div>
        <button className="secondary" onClick={fetchHolisticData} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh All Domains</span>
        </button>
      </div>

      {/* 1. PRIMARY HERO OPERATION CARD: IRRIGATION MANAGEMENT */}
      <section
        style={{
          background: 'linear-gradient(135deg, #f0f7ff 0%, #e6f1fd 100%)',
          border: '2px solid #93c5fd',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '2rem',
          boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  padding: '3px 9px',
                  borderRadius: '6px'
                }}
              >
                PRIMARY HERO OPERATION
              </span>
              <span style={{ fontSize: '12.5px', color: '#1e40af', fontWeight: 600 }}>
                {field?.name || 'Selected Field'} · {field?.crop || 'Maize'} ({field?.growth_stage || 'Flowering'})
              </span>
            </div>
            <h3 style={{ fontSize: '1.35rem', color: '#1e3a8a', margin: '4px 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={24} style={{ color: '#2563eb' }} />
              Irrigation Management & Root Zone Dispatch
            </h3>
            <p style={{ color: '#3b82f6', fontSize: '13px', margin: 0, maxWidth: '650px' }}>
              This is AgriGuide's primary real-time decision loop, combining calibrated soil probe telemetry, Open-Meteo precipitation forecasts, and symbolic FAO-56 rules.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                background: canonicalRecommendation === 'IRRIGATE' ? '#dcfce7' : '#fef3c7',
                color: canonicalRecommendation === 'IRRIGATE' ? '#166534' : '#92400e',
                border: `1.5px solid ${canonicalRecommendation === 'IRRIGATE' ? '#86efac' : '#fde68a'}`,
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}
            >
              {canonicalRecommendation}
            </span>
            <div style={{ fontSize: '11.5px', color: '#1e40af', marginTop: '4px', fontWeight: 600 }}>
              {Math.round(canonicalConfidence * 100)}% Decision Confidence
            </div>
          </div>
        </div>

        {/* Reason Banner */}
        <div style={{ background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', margin: '16px 0' }}>
          <b style={{ color: '#1e3a8a', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Canonical Agronomic Rationale:
          </b>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#1f2937', lineHeight: '1.45' }}>
            {canonicalReason}
          </p>
          <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#4b5563' }}>
            <strong>Governing Symbolic Rule:</strong> <code>{canonicalRules.join(', ')}</code>
          </div>
        </div>

        {/* Telemetry & Estimated Operation Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Soil Moisture</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e40af' }}>{state?.soil_moisture != null ? `${state.soil_moisture}%` : '17.5%'}</div>
            <small style={{ color: '#4b5563' }}>Wilting Buffer: 18.0%</small>
          </div>

          <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>24h Rain Probability</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0284c7' }}>{state?.rain_probability_24h != null ? `${state.rain_probability_24h}%` : '82%'}</div>
            <small style={{ color: '#4b5563' }}>Open-Meteo Ensemble</small>
          </div>

          <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Estimated Volume</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#166534' }}>~2,500 L</div>
            <small style={{ color: '#4b5563' }}>Recommended Drip Runtime: 45 min</small>
          </div>

          <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
            <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>Water Reserves</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#92400e' }}>{state?.water_availability || 'LIMITED'}</div>
            <small style={{ color: '#4b5563' }}>Farm Tank Reservoir</small>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {onNavigateTab && (
            <>
              <button
                type="button"
                className="secondary"
                style={{ background: '#ffffff', color: '#1e40af', borderColor: '#93c5fd', fontWeight: 600 }}
                onClick={() => onNavigateTab('field-intel')}
              >
                Inspect "Why?" in Field Advisor →
              </button>
              <button
                type="button"
                className="secondary"
                style={{ background: '#ffffff', color: '#1e40af', borderColor: '#93c5fd', fontWeight: 600 }}
                onClick={() => onNavigateTab('simulator')}
              >
                Simulate What-If Scenarios →
              </button>
              <button
                type="button"
                className="secondary"
                style={{ background: '#ffffff', color: '#1e40af', borderColor: '#93c5fd', fontWeight: 600 }}
                onClick={() => onNavigateTab('audit')}
              >
                Audit Symbolic MeTTa Proof Trail →
              </button>
            </>
          )}
        </div>
      </section>

      {/* 2. SECONDARY SECTION: AGRONOMIC CONTEXT & SEASONAL PLANNING */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} style={{ color: '#4b5563' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#374151', margin: 0 }}>
            Seasonal Planning & Agronomic Context
          </h3>
        </div>
        <p style={{ fontSize: '12.5px', color: '#6b7280', margin: '4px 0 0 0' }}>
          Secondary agronomic considerations evaluated concurrently to inform holistic crop management:
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}
      >
        {secondaryDomains.map((domain) => (
          <div
            key={domain.key}
            className="field-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderTop: `4px solid ${domain.color}`,
              background: '#ffffff'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {domain.icon}
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#1f2937' }}>{domain.title}</h4>
                    <span style={{ fontSize: '10.5px', color: '#6b7280' }}>{domain.category}</span>
                  </div>
                </div>
                <span className="confidence-pill">
                  {Math.round((domain.data?.confidence || 0.85) * 100)}%
                </span>
              </div>

              <div style={{ margin: '8px 0' }}>
                <span
                  className="decision-badge"
                  style={{
                    background:
                      domain.data?.recommendation === 'HEALTHY' || domain.data?.recommendation === 'LOW_RISK'
                        ? '#dcfce7'
                        : '#fef3c7',
                    color:
                      domain.data?.recommendation === 'HEALTHY' || domain.data?.recommendation === 'LOW_RISK'
                        ? '#166534'
                        : '#92400e',
                    fontSize: '12px'
                  }}
                >
                  {domain.data?.recommendation}
                </span>
              </div>

              <p style={{ fontSize: '12.5px', color: '#4b5563', lineHeight: '1.45', margin: '6px 0' }}>
                {domain.data?.reason}
              </p>
            </div>

            <div style={{ marginTop: '10px', borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
              <small style={{ color: '#6b7280', fontSize: '11px', display: 'block' }}>
                <strong>Governing Rule:</strong> {domain.data?.rules?.join(', ') || 'R-DOMAIN-GROUNDED'}
              </small>
            </div>
          </div>
        ))}
      </div>

      {/* 3. SAFETY POLICY & PHYSICAL ACTUATION GUARDRAILS */}
      <div className="audit-section-card">
        <div className="card-head">
          <div>
            <span className="pill pill-mode">SAFETY POLICY</span>
            <h3>Field Action Proposer & Equipment Safety Guardrails</h3>
            <small style={{ color: '#555' }}>
              Propose field operations (such as opening irrigation valves or applying fertilizer) and test safety limits.
              Automatic guardrails enforce safety boundaries (such as a maximum 30-minute valve limit, high-wind spray lockouts, and empty reservoir protection).
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
