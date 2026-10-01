import React, { useEffect, useState } from 'react';
import {
  Network,
  GitFork,
  Compass,
  ArrowRight,
  Code,
  Shield,
  Sprout,
  Droplets,
  MapPin,
  Cpu,
  CheckCircle2,
  Info,
  Layers,
  Sparkles,
  BarChart3,
  Thermometer,
  CloudRain,
  Wind,
  Gauge,
  HelpCircle,
  Database,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { getKnowledgeGraph } from '../lib/api';

interface KnowledgeGraphViewProps {
  fieldId: string;
  fieldName: string;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ fieldId, fieldName }) => {
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'visual' | 'causal' | 'triples'>('analytics');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showRawMetta, setShowRawMetta] = useState<boolean>(false);
  const [tripleSearch, setTripleSearch] = useState<string>('');

  useEffect(() => {
    if (fieldId) {
      loadGraph(fieldId);
    }
  }, [fieldId]);

  const loadGraph = async (id: string) => {
    setLoading(true);
    try {
      const data = await getKnowledgeGraph(id);
      setGraphData(data);
      if (data?.entities?.length > 0) {
        const fieldNode = data.entities.find((e: any) => e.type === 'Field') || data.entities[0];
        setSelectedNodeId(fieldNode.id);
      }
    } catch (e) {
      console.error('Failed to load knowledge graph:', e);
    } finally {
      setLoading(false);
    }
  };

  // Node color helper
  const getNodeColor = (type: string) => {
    switch (type) {
      case 'Field':
        return { bg: '#1e5a32', border: '#12391e', text: '#ffffff', icon: '🌾' };
      case 'Farm':
        return { bg: '#2b5a7a', border: '#183c54', text: '#ffffff', icon: '🏡' };
      case 'Location':
        return { bg: '#5c4880', border: '#3f305a', text: '#ffffff', icon: '📍' };
      case 'Crop':
        return { bg: '#2e7d32', border: '#1b5e20', text: '#ffffff', icon: '🌱' };
      case 'GrowthStage':
        return { bg: '#00796b', border: '#004d40', text: '#ffffff', icon: '🌸' };
      case 'SoilType':
        return { bg: '#8d6e63', border: '#5d4037', text: '#ffffff', icon: '🪴' };
      case 'Sensor':
        return { bg: '#00838f', border: '#006064', text: '#ffffff', icon: '📡' };
      case 'Belief':
        return { bg: '#455a64', border: '#263238', text: '#ffffff', icon: '📊' };
      case 'Decision':
        return { bg: '#e65100', border: '#b23c00', text: '#ffffff', icon: '⚡' };
      default:
        return { bg: '#4f6b58', border: '#334739', text: '#ffffff', icon: '🔹' };
    }
  };

  // Create human-readable entity map
  const entityMap = new Map<string, { label: string; type: string }>();
  if (graphData?.entities) {
    for (const e of graphData.entities) {
      entityMap.set(e.id, { label: e.label || e.id, type: e.type });
    }
  }

  const getEntityLabel = (id: string) => {
    const ent = entityMap.get(id);
    if (!ent) {
      if (id.startsWith('crop_')) return id.replace('crop_', '').toUpperCase();
      if (id.startsWith('soil_')) return id.replace('soil_', '').toUpperCase();
      if (id.startsWith('stage_')) return id.replace('stage_', '').toUpperCase();
      return id.length > 18 ? `${id.slice(0, 8)}...` : id;
    }
    let lbl = ent.label;
    if (lbl.startsWith('Field: ')) lbl = lbl.replace('Field: ', '');
    if (lbl.startsWith('Farm: ')) lbl = lbl.replace('Farm: ', '');
    if (lbl.startsWith('Decision: ')) lbl = lbl.replace('Decision: ', '');
    return lbl;
  };

  const getEntityType = (id: string) => {
    const ent = entityMap.get(id);
    return ent ? ent.type : 'Entity';
  };

  // Compute Layout Positions for visual SVG network diagram (Zero overlap guarantee)
  const getLayoutNodes = () => {
    if (!graphData?.entities) return [];
    const entities = graphData.entities;

    const fieldEntity = entities.find((e: any) => e.type === 'Field');
    const farmEntity = entities.find((e: any) => e.type === 'Farm');
    const locEntity = entities.find((e: any) => e.type === 'Location');
    const cropEntity = entities.find((e: any) => e.type === 'Crop');
    const stageEntity = entities.find((e: any) => e.type === 'GrowthStage');
    const soilEntity = entities.find((e: any) => e.type === 'SoilType');
    const decEntity = entities.find((e: any) => e.type === 'Decision');
    const sensors = entities.filter((e: any) => e.type === 'Sensor');
    const beliefs = entities.filter((e: any) => e.type === 'Belief');

    const positions: Record<string, { x: number; y: number }> = {};

    // 1. Center: Field
    if (fieldEntity) positions[fieldEntity.id] = { x: 460, y: 200 };

    // 2. West: Farm & Location
    if (farmEntity) positions[farmEntity.id] = { x: 260, y: 150 };
    if (locEntity) positions[locEntity.id] = { x: 110, y: 150 };

    // 3. North: Active Decision
    if (decEntity) positions[decEntity.id] = { x: 460, y: 65 };

    // 4. East: Crop, Stage, and Soil
    if (cropEntity) positions[cropEntity.id] = { x: 670, y: 140 };
    if (stageEntity) positions[stageEntity.id] = { x: 810, y: 140 };
    if (soilEntity) positions[soilEntity.id] = { x: 670, y: 250 };

    // 5. South-West: Sensors
    sensors.forEach((s: any, idx: number) => {
      const step = sensors.length > 1 ? 220 / (sensors.length - 1) : 0;
      positions[s.id] = { x: 160 + idx * step, y: 340 };
    });

    // 6. South-East: Beliefs
    beliefs.forEach((b: any, idx: number) => {
      // 2 rows if more than 4 beliefs
      const isSecondRow = idx >= 4;
      const colIdx = isSecondRow ? idx - 4 : idx;
      const count = isSecondRow ? Math.max(1, beliefs.length - 4) : Math.min(4, beliefs.length);
      const step = count > 1 ? 360 / (count - 1) : 0;
      const x = 460 + colIdx * step;
      const y = isSecondRow ? 395 : 335;
      positions[b.id] = { x, y };
    });

    return entities.map((ent: any) => ({
      ...ent,
      pos: positions[ent.id] || { x: 460, y: 200 }
    }));
  };

  const layoutNodes = getLayoutNodes();
  const selectedNode = layoutNodes.find((n: any) => n.id === selectedNodeId);

  // Connected relations for selected node
  const connectedRelations = graphData?.relations?.filter(
    (r: any) => r.subject === selectedNodeId || r.object === selectedNodeId
  ) || [];

  const analytics = graphData?.analytics || {
    soil_moisture: 17.5,
    wilting_point: 18.0,
    field_capacity: 34.0,
    mad_threshold: 24.0,
    rain_probability_24h: 14.0,
    temperature_c: 25.3,
    humidity_pct: 65.0,
    wind_speed_kmh: 9.6,
    crop_coefficient_kc: 1.15,
    etc_daily_mm: 5.2,
    water_status: 'CRITICAL_DEFICIT',
    readily_available_water_pct: 0.0,
    recommendation_action: 'IRRIGATE'
  };

  const filteredRelations = (graphData?.relations || []).filter((r: any) => {
    if (!tripleSearch.trim()) return true;
    const q = tripleSearch.toLowerCase();
    const subj = getEntityLabel(r.subject).toLowerCase();
    const pred = r.predicate.toLowerCase();
    const obj = getEntityLabel(r.object).toLowerCase();
    return subj.includes(q) || pred.includes(q) || obj.includes(q);
  });

  return (
    <div className="tab-container">
      {/* View Header */}
      <div className="tab-header">
        <div>
          <span className="pill pill-mode">FARM DIGITAL TWIN</span>
          <h2>Agricultural Digital Twin & Knowledge Graph</h2>
          <p className="subtitle">
            Living computational twin of <strong>{fieldName}</strong>. Integrates soil moisture physics, 
            FAO-56 evapotranspiration models, atmospheric telemetry, and symbolic semantic triples into an explainable graph.
          </p>
        </div>

        <div className="button-group">
          <button
            className={`btn-filter ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={15} />
            <span>Field Physics & Analytics</span>
          </button>
          <button
            className={`btn-filter ${activeTab === 'visual' ? 'active' : ''}`}
            onClick={() => setActiveTab('visual')}
          >
            <Network size={15} />
            <span>Interactive Network Topology</span>
          </button>
          <button
            className={`btn-filter ${activeTab === 'causal' ? 'active' : ''}`}
            onClick={() => setActiveTab('causal')}
          >
            <GitFork size={15} />
            <span>Causal Pathways</span>
          </button>
          <button
            className={`btn-filter ${activeTab === 'triples' ? 'active' : ''}`}
            onClick={() => setActiveTab('triples')}
          >
            <Code size={15} />
            <span>Semantic Triples ({graphData?.relations?.length || 0})</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-box">
          <RefreshCw size={18} className="spin" />
          <span>Synchronizing Farm Digital Twin and Relational Knowledge Graph...</span>
        </div>
      )}

      {graphData && !loading && (
        <div className="graph-content">
          {/* =========================================================================
              1. FIELD PHYSICS & WATER ANALYTICS TAB
              ========================================================================= */}
          {activeTab === 'analytics' && (
            <div className="analytics-view-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Primary Soil Water Depletion vs Wilting Floor Gauge */}
              <div
                className="panel"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #cbe3d4',
                  borderRadius: '12px',
                  padding: '22px 24px',
                  boxShadow: '0 3px 12px rgba(25, 60, 35, 0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e5a32', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      SOIL WATER DEPLETION & WILTING BUFFER
                    </span>
                    <h3 style={{ margin: '3px 0 0 0', fontSize: '18px', color: '#153d23' }}>
                      Root Zone Hydration State vs 18% Wilting Floor
                    </h3>
                  </div>

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: analytics.soil_moisture < 18 ? '#fdf0ed' : (analytics.soil_moisture < 24 ? '#fef7e0' : '#e6f4ea'),
                      color: analytics.soil_moisture < 18 ? '#c5221f' : (analytics.soil_moisture < 24 ? '#b06000' : '#137333'),
                      border: `1px solid ${analytics.soil_moisture < 18 ? '#f6c0b3' : (analytics.soil_moisture < 24 ? '#feefc3' : '#ceead6')}`
                    }}
                  >
                    {analytics.soil_moisture < 18 ? '🚨 CRITICAL MOISTURE DEFICIT' : (analytics.soil_moisture < 24 ? '⚠️ DEPLETING BUFFER' : '✅ OPTIMAL PLANT AVAILABLE WATER')}
                  </span>
                </div>

                {/* Visual Gauge Bar */}
                <div style={{ margin: '20px 0 14px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', color: '#557563', fontWeight: 600 }}>
                    <span>0% (Oven Dry)</span>
                    <span style={{ color: '#c5221f', fontWeight: 700 }}>18% Wilting Point (PWP)</span>
                    <span style={{ color: '#b06000' }}>24% Stress Floor (MAD)</span>
                    <span style={{ color: '#137333' }}>34% Field Capacity (FC)</span>
                    <span>45% (Saturation)</span>
                  </div>

                  {/* Meter Track */}
                  <div
                    style={{
                      height: '24px',
                      borderRadius: '8px',
                      background: '#edf3ee',
                      display: 'flex',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid #d4e5da'
                    }}
                  >
                    {/* Zone 1: Severe Stress Zone (0 - 18%) */}
                    <div style={{ width: '40%', background: 'linear-gradient(90deg, #f8d7da 0%, #f5c6cb 100%)', borderRight: '2px dashed #dc3545' }} title="Permanent Wilting Point Zone (Crop damage)"></div>
                    {/* Zone 2: Buffer Depletion Zone (18 - 24%) */}
                    <div style={{ width: '13.3%', background: '#fff3cd', borderRight: '2px dashed #ffc107' }} title="Management Allowed Depletion"></div>
                    {/* Zone 3: Readily Available Water (24 - 34%) */}
                    <div style={{ width: '22.2%', background: '#d4edda', borderRight: '2px solid #28a745' }} title="Optimal Hydration Zone"></div>
                    {/* Zone 4: Saturated / Hypoxia (> 34%) */}
                    <div style={{ width: '24.5%', background: '#cce5ff' }} title="Field Capacity to Saturation"></div>

                    {/* Active Needle Indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${Math.min(100, Math.max(3, (analytics.soil_moisture / 45) * 100))}%`,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: '#111e17',
                        transform: 'translateX(-50%)',
                        boxShadow: '0 0 6px rgba(0,0,0,0.6)',
                        zIndex: 2
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '-18px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#111e17',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {analytics.soil_moisture}% Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Metric Mini Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  <div style={{ background: '#fbfdfc', border: '1px solid #dcebe1', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#557563' }}>
                      <Droplets size={14} color="#1e5a32" />
                      <span>Current Volumetric Moisture</span>
                    </div>
                    <b style={{ display: 'block', fontSize: '20px', color: analytics.soil_moisture < 18 ? '#c5221f' : '#1e5a32', margin: '4px 0' }}>
                      {analytics.soil_moisture}%
                    </b>
                    <small style={{ fontSize: '11px', color: '#688c77' }}>
                      {analytics.soil_moisture < 18 ? 'Below 18% permanent wilting point' : 'Above critical wilting floor'}
                    </small>
                  </div>

                  <div style={{ background: '#fbfdfc', border: '1px solid #dcebe1', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#557563' }}>
                      <Gauge size={14} color="#0f52ba" />
                      <span>Readily Available Water (RAW)</span>
                    </div>
                    <b style={{ display: 'block', fontSize: '20px', color: '#0f52ba', margin: '4px 0' }}>
                      {analytics.readily_available_water_pct}%
                    </b>
                    <small style={{ fontSize: '11px', color: '#688c77' }}>
                      Available buffer before cell plasmolysis
                    </small>
                  </div>

                  <div style={{ background: '#fbfdfc', border: '1px solid #dcebe1', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#557563' }}>
                      <Compass size={14} color="#b26b00" />
                      <span>Governing Action Advisory</span>
                    </div>
                    <b style={{ display: 'block', fontSize: '20px', color: '#b26b00', margin: '4px 0' }}>
                      {analytics.recommendation_action}
                    </b>
                    <small style={{ fontSize: '11px', color: '#688c77' }}>
                      Evaluated by closed-loop agronomic engine
                    </small>
                  </div>
                </div>
              </div>

              {/* Two-Column: FAO-56 Evapotranspiration & Atmospheric Precipitation Risk */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                {/* FAO-56 ETc Crop Water Loss Panel */}
                <div
                  className="panel"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cfe2d5',
                    borderRadius: '12px',
                    padding: '20px 22px',
                    boxShadow: '0 3px 10px rgba(25, 60, 35, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Thermometer size={18} color="#d95a00" />
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#153d23' }}>
                      FAO-56 Crop Water Demand (ETc)
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#4a6f58', lineHeight: 1.4 }}>
                    Crop evapotranspiration rate calculated via Penman-Monteith physical models based on active ambient temperature, solar radiation, and crop phenology factor (Kc).
                  </p>

                  <div style={{ background: '#fbfdfc', border: '1px solid #dbeae0', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#314b3a', fontWeight: 600 }}>Daily Crop Water Loss (ETc):</span>
                      <b style={{ fontSize: '18px', color: '#a84300' }}>{analytics.etc_daily_mm} mm/day</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#557563' }}>
                      <span>Phenological Crop Coefficient (Kc):</span>
                      <span style={{ fontWeight: 600, color: '#1e5a32' }}>{analytics.crop_coefficient_kc} (Flowering Peak)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px', color: '#4d715a' }}>
                    <span>🌡️ Temp: <strong>{analytics.temperature_c}°C</strong></span>
                    <span>💧 Humidity: <strong>{analytics.humidity_pct}%</strong></span>
                    <span>💨 Wind: <strong>{analytics.wind_speed_kmh} km/h</strong></span>
                  </div>
                </div>

                {/* Atmospheric Rain Forecast & Holding Logic Panel */}
                <div
                  className="panel"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cfe2d5',
                    borderRadius: '12px',
                    padding: '20px 22px',
                    boxShadow: '0 3px 10px rgba(25, 60, 35, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <CloudRain size={18} color="#0f52ba" />
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#153d23' }}>
                      Atmospheric Precipitation Forecast & Risk
                    </h3>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#4a6f58', lineHeight: 1.4 }}>
                    Open-Meteo GFS convective forecast for this farm's latitude & longitude coordinates. Evaluates rain certainty against reservoir conservation policy.
                  </p>

                  <div style={{ background: '#fbfdfc', border: '1px solid #dbeae0', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#314b3a', fontWeight: 600 }}>24h Rain Forecast Probability:</span>
                      <b style={{ fontSize: '18px', color: '#0f52ba' }}>{analytics.rain_probability_24h}%</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#557563' }}>
                      <span>Irrigation Holding Threshold:</span>
                      <span style={{ fontWeight: 600, color: '#1e5a32' }}>≥ 60% Rain Forecast</span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: '#557563', fontStyle: 'italic' }}>
                    {analytics.rain_probability_24h >= 60
                      ? '🌧️ Rain probability exceeds 60%. Holding irrigation preserves limited water reservoir and avoids nutrient leaching.'
                      : '☀️ Dry forecast window. Low probability of rain requires supplemental irrigation to replenish root zone water deficit.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              2. INTERACTIVE NETWORK TOPOLOGY TAB
              ========================================================================= */}
          {activeTab === 'visual' && (
            <div className="visual-graph-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                className="panel"
                style={{
                  background: 'linear-gradient(180deg, #fbfdfb 0%, #f4f8f5 100%)',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #d2e4d8',
                  boxShadow: '0 4px 14px rgba(30, 90, 50, 0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Network size={18} color="#1e5a32" />
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#1e5a32' }}>Interactive Farm Network Topology</h3>
                    <span style={{ fontSize: '12px', color: '#526b5d' }}>
                      ({graphData.entities?.length || 0} nodes · {graphData.relations?.length || 0} relationships)
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#557563', fontStyle: 'italic' }}>
                    💡 Click any entity node to inspect live properties and connections
                  </span>
                </div>

                <div style={{ overflowX: 'auto', textAlign: 'center' }}>
                  <svg
                    viewBox="0 0 940 440"
                    style={{
                      width: '100%',
                      maxWidth: '940px',
                      height: 'auto',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid #d8e8de'
                    }}
                  >
                    <defs>
                      <marker
                        id="arrow"
                        viewBox="0 0 10 10"
                        refX="22"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#8cb399" />
                      </marker>
                      <marker
                        id="arrow-active"
                        viewBox="0 0 10 10"
                        refX="22"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#1e5a32" />
                      </marker>
                    </defs>

                    {/* Relationship Lines */}
                    {graphData.relations?.map((rel: any, idx: number) => {
                      const source = layoutNodes.find((n: any) => n.id === rel.subject);
                      const target = layoutNodes.find((n: any) => n.id === rel.object);
                      if (!source || !target) return null;

                      const isConnectedToSelected =
                        selectedNodeId && (rel.subject === selectedNodeId || rel.object === selectedNodeId);

                      const strokeColor = isConnectedToSelected ? '#1e5a32' : '#d2e4d8';
                      const strokeWidth = isConnectedToSelected ? 2.5 : 1.2;
                      const midX = (source.pos.x + target.pos.x) / 2;
                      const midY = (source.pos.y + target.pos.y) / 2;

                      return (
                        <g key={idx}>
                          <line
                            x1={source.pos.x}
                            y1={source.pos.y}
                            x2={target.pos.x}
                            y2={target.pos.y}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={isConnectedToSelected ? 'none' : '3,3'}
                            markerEnd={isConnectedToSelected ? 'url(#arrow-active)' : 'url(#arrow)'}
                          />
                          {isConnectedToSelected && (
                            <g transform={`translate(${midX}, ${midY})`}>
                              <rect
                                x="-45"
                                y="-10"
                                width="90"
                                height="20"
                                rx="4"
                                fill="#ffffff"
                                stroke="#1e5a32"
                                strokeWidth="1"
                              />
                              <text
                                textAnchor="middle"
                                dy="4"
                                fontSize="10"
                                fill="#1e5a32"
                                fontWeight="700"
                              >
                                {rel.predicate.replaceAll('_', ' ')}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {layoutNodes.map((node: any) => {
                      const color = getNodeColor(node.type);
                      const isSelected = selectedNodeId === node.id;
                      const isField = node.type === 'Field';
                      const radius = isField ? 28 : 22;

                      let shortLabel = node.label || node.id;
                      if (shortLabel.startsWith('Field: ')) shortLabel = shortLabel.replace('Field: ', '');
                      if (shortLabel.startsWith('Farm: ')) shortLabel = shortLabel.replace('Farm: ', '');
                      if (shortLabel.startsWith('Decision: ')) shortLabel = shortLabel.replace('Decision: ', '');
                      if (shortLabel.length > 18) shortLabel = shortLabel.substring(0, 16) + '...';

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${node.pos.x}, ${node.pos.y})`}
                          onClick={() => setSelectedNodeId(node.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {isSelected && (
                            <circle
                              r={radius + 8}
                              fill="none"
                              stroke="#1e5a32"
                              strokeWidth="3"
                              strokeDasharray="4,2"
                              opacity="0.9"
                            />
                          )}

                          <circle
                            r={radius}
                            fill={color.bg}
                            stroke={color.border}
                            strokeWidth={isSelected ? 3 : 1.5}
                            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                          />

                          <text
                            textAnchor="middle"
                            dy={isField ? 6 : 5}
                            fontSize={isField ? 16 : 13}
                            fill={color.text}
                          >
                            {color.icon}
                          </text>

                          <rect
                            x="-65"
                            y={radius + 5}
                            width="130"
                            height="18"
                            rx="3"
                            fill="#ffffff"
                            stroke="#d2dfd7"
                            strokeWidth="1"
                            opacity="0.95"
                          />
                          <text
                            textAnchor="middle"
                            y={radius + 17}
                            fontSize="10"
                            fontWeight={isSelected ? 'bold' : 'normal'}
                            fill="#213a28"
                          >
                            {shortLabel}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Node Inspector Details Card */}
              {selectedNode && (
                <div
                  className="panel"
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cfe2d5',
                    borderRadius: '10px',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5eee8', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '22px',
                          background: '#f0f7f2',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #d2e4d8'
                        }}
                      >
                        {getNodeColor(selectedNode.type).icon}
                      </span>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#eaf4ed', color: '#1e5a32' }}>
                          {selectedNode.type}
                        </span>
                        <h3 style={{ margin: '4px 0 0 0', color: '#1e5a32', fontSize: '16px' }}>
                          {selectedNode.label}
                        </h3>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#688273', fontFamily: 'monospace' }}>
                      ID: {selectedNode.id}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#314b3a' }}>Properties & Telemetry:</h4>
                      {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {Object.entries(selectedNode.properties).map(([k, v]) => (
                            <span
                              key={k}
                              style={{
                                background: '#f5faf6',
                                border: '1px solid #d9eae0',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: '#274b33'
                              }}
                            >
                              <strong>{k.replace('_', ' ')}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ margin: 0, fontSize: '12px', color: '#728a7b', fontStyle: 'italic' }}>
                          No specific properties attached.
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#314b3a' }}>
                        Connected Graph Links ({connectedRelations.length}):
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
                        {connectedRelations.map((r: any, idx: number) => {
                          const isSubject = r.subject === selectedNode.id;
                          const otherId = isSubject ? r.object : r.subject;
                          const otherLabel = getEntityLabel(otherId);
                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '12px',
                                background: '#f9fcf9',
                                padding: '5px 8px',
                                borderRadius: '4px',
                                border: '1px solid #e1ece5'
                              }}
                            >
                              <span style={{ fontWeight: 600, color: '#1e5a32' }}>
                                {r.predicate.replaceAll('_', ' ')}
                              </span>
                              <ArrowRight size={12} color="#759381" />
                              <span style={{ color: '#2e4e37' }}>
                                {otherLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              3. AGRONOMIC CAUSAL PATHWAYS TAB
              ========================================================================= */}
          {activeTab === 'causal' && (
            <div className="causal-chains-container">
              <div className="panel" style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #cfe2d5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <GitFork size={18} color="#1e5a32" />
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#1e5a32' }}>Agronomic Causal Pathways & Dynamics</h3>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#557563' }}>
                  Deterministic agronomic logic governing how environmental shifts propagate through soil moisture physics to crop yield outcomes.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {graphData.causal_chains?.map((c: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        background: '#fbfdfc',
                        border: '1px solid #dcebe1',
                        borderRadius: '10px',
                        padding: '16px 18px'
                      }}
                    >
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        {c.path.map((node: string, nIdx: number) => (
                          <React.Fragment key={nIdx}>
                            <span
                              style={{
                                background: '#eaf4ed',
                                border: '1px solid #cce5d4',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#1b562e'
                              }}
                            >
                              {node.replaceAll('_', ' ')}
                            </span>
                            {nIdx < c.path.length - 1 && <ArrowRight size={14} color="#759381" />}
                          </React.Fragment>
                        ))}
                        <span
                          style={{
                            marginLeft: 'auto',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: '#fef7e0',
                            color: '#b06000'
                          }}
                        >
                          Causal Confidence: {Math.round(c.weight * 100)}%
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#2e4a37', lineHeight: 1.4 }}>
                        <strong>Agronomic Mechanism:</strong> {c.mechanism}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              4. VERIFIED SEMANTIC TRIPLES TAB
              ========================================================================= */}
          {activeTab === 'triples' && (
            <div className="panel" style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #cfe2d5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} color="#1e5a32" />
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#1e5a32' }}>Verified Semantic Triples (Digital Twin Knowledge Base)</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    value={tripleSearch}
                    onChange={(e) => setTripleSearch(e.target.value)}
                    placeholder="Search facts (e.g. 'crop', 'soil', 'rain')..."
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #b7dfc6',
                      fontSize: '12px'
                    }}
                  />
                  <button
                    className="btn-filter"
                    onClick={() => setShowRawMetta(!showRawMetta)}
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                  >
                    <Code size={13} />
                    <span>{showRawMetta ? 'Human-Readable Mode' : 'View MeTTa Atoms'}</span>
                  </button>
                </div>
              </div>

              {showRawMetta ? (
                /* Raw MeTTa s-expression view */
                <div>
                  <p style={{ fontSize: '12px', color: '#557563', margin: '0 0 10px 0' }}>
                    Symbolic MeTTa representations loaded into the OpenCog Hyperon neural-symbolic reasoner:
                  </p>
                  <pre
                    style={{
                      background: '#111e17',
                      color: '#a7e3b8',
                      padding: '14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      maxHeight: '380px',
                      overflowY: 'auto'
                    }}
                  >
                    {graphData.metta_atoms?.join('\n')}
                  </pre>
                </div>
              ) : (
                /* Human-readable semantic triples */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
                  {filteredRelations.map((r: any, idx: number) => {
                    const subjLbl = getEntityLabel(r.subject);
                    const subjType = getEntityType(r.subject);
                    const objLbl = getEntityLabel(r.object);
                    const objType = getEntityType(r.object);

                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#fbfdfc',
                          border: '1px solid #dcebe1',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#1e5a32', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {r.predicate.replaceAll('_', ' ')}
                          </span>
                          <span style={{ fontSize: '10px', color: '#668774', background: '#eaf3ed', padding: '1px 5px', borderRadius: '4px' }}>
                            {Math.round(r.confidence * 100)}% verified
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: '#153823', display: 'block', fontSize: '12.5px' }}>{subjLbl}</strong>
                            <small style={{ color: '#688c77', fontSize: '10.5px' }}>({subjType})</small>
                          </div>
                          <ArrowRight size={14} color="#85a892" />
                          <div style={{ flex: 1, textAlign: 'right' }}>
                            <strong style={{ color: '#0f52ba', display: 'block', fontSize: '12.5px' }}>{objLbl}</strong>
                            <small style={{ color: '#688c77', fontSize: '10.5px' }}>({objType})</small>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
