import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { Sidebar, TabType } from './components/Sidebar';
import { HomeOverview } from './components/HomeOverview';
import { MyFarmView } from './components/MyFarmView';
import { FieldIntelligence } from './components/FieldIntelligence';
import { ObservationStation } from './components/ObservationStation';
import { DecisionDiffViewer } from './components/DecisionDiffViewer';
import { FieldProfileManager } from './components/FieldProfileManager';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AuditTrailView } from './components/AuditTrailView';
import { LearningCenter } from './components/LearningCenter';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { ScientificBenchmarkView } from './components/ScientificBenchmarkView';
import { MultiDomainFarmView } from './components/MultiDomainFarmView';
import { WeatherClimateSensorsView } from './components/WeatherClimateSensorsView';
import { AdminFarmersView } from './components/AdminFarmersView';
import { UserProfileView } from './components/UserProfileView';
import { AuthView } from './components/AuthView';
import {
  getFields,
  getField,
  getState,
  getEvidence,
  getDecisions,
  decide,
  observe,
  syncWeather,
  consultField,
  clearAuthToken,
  AuthResponse
} from './lib/api';
import { RefreshCw, Sprout, Compass } from 'lucide-react';

export interface ConsultMessage {
  id: string;
  role: 'farmer' | 'agent';
  text: string;
  grounded?: boolean;
  timestamp: string;
}

const createDefaultGreeting = (userName?: string): ConsultMessage => {
  const firstName = userName && userName.trim() ? userName.trim().split(' ')[0] : 'Farmer';
  return {
    id: 'init-msg',
    role: 'agent',
    text: `Hello ${firstName}! I'm your AgriGuide Farm Assistant. Ask me anything about your field's soil moisture, rain forecast, or crop management decisions.`,
    grounded: true,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
};

function App() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('agriguide_user');
      const token = localStorage.getItem('agriguide_token');
      if (saved && token) {
        return JSON.parse(saved);
      }
    } catch {}
    return null;
  });

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [field, setField] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [consulting, setConsulting] = useState<boolean>(false);
  const getConsultStorageKey = (userId?: string) =>
    userId ? `agriguide_consult_history_${userId}` : 'agriguide_consult_history_guest';

  const [consultHistory, setConsultHistory] = useState<ConsultMessage[]>(() => {
    try {
      const savedUser = localStorage.getItem('agriguide_user');
      const u = savedUser ? JSON.parse(savedUser) : null;
      const key = getConsultStorageKey(u?.id);
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      if (u?.name) {
        return [
          {
            id: 'init-msg',
            role: 'agent',
            text: `Hello ${u.name.split(' ')[0]}! I'm your AgriGuide Farm Assistant. Ask me anything about your field's soil moisture, rain forecast, or crop management decisions.`,
            grounded: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
      }
    } catch {}
    return [createDefaultGreeting()];
  });

  useEffect(() => {
    if (currentUser?.id) {
      const key = getConsultStorageKey(currentUser.id);
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          setConsultHistory(JSON.parse(saved));
          return;
        }
      } catch {}
      const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Farmer';
      setConsultHistory([
        {
          id: `init-${Date.now()}`,
          role: 'agent',
          text: `Hello ${firstName}! I'm your AgriGuide Farm Assistant. Ask me anything about your field's soil moisture, rain forecast, or crop management decisions.`,
          grounded: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [currentUser?.id]);

  const handleSendConsult = async (query: string): Promise<string> => {
    if (!query.trim() || !selectedFieldId || consulting) return "";
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ConsultMessage = {
      id: `u-${Date.now()}`,
      role: 'farmer',
      text: query.trim(),
      timestamp: now
    };
    const updatedHistory = [...consultHistory, userMsg];
    setConsultHistory(updatedHistory);
    setConsulting(true);
    try {
      const res = await consultField(selectedFieldId, query.trim());
      // Refresh field data so observations or decision adjustments reflect immediately
      await loadFieldData(selectedFieldId);
      const agentMsg: ConsultMessage = {
        id: `a-${Date.now()}`,
        role: 'agent',
        text: res.answer || "Field state grounded advice provided.",
        grounded: res.grounded,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const finalHistory = [...updatedHistory, agentMsg];
      setConsultHistory(finalHistory);
      try {
        const key = getConsultStorageKey(currentUser?.id);
        localStorage.setItem(key, JSON.stringify(finalHistory));
      } catch {}
      return agentMsg.text;
    } catch (err: any) {
      const errorMsg: ConsultMessage = {
        id: `err-${Date.now()}`,
        role: 'agent',
        text: "Unable to reach AgriGuide reasoning service. Please check telemetry connection.",
        grounded: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const finalHistory = [...updatedHistory, errorMsg];
      setConsultHistory(finalHistory);
      return errorMsg.text;
    } finally {
      setConsulting(false);
    }
  };

  const handleClearConsult = () => {
    const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Farmer';
    const fresh: ConsultMessage[] = [
      {
        id: `init-${Date.now()}`,
        role: 'agent',
        text: `Hello ${firstName}! I'm your AgriGuide Farm Assistant. Ask me anything about your field's soil moisture, rain forecast, or crop management decisions.`,
        grounded: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setConsultHistory(fresh);
    try {
      const key = getConsultStorageKey(currentUser?.id);
      localStorage.removeItem(key);
    } catch {}
  };

  const loadFieldData = async (id: string) => {
    setSelectedFieldId(id);
    setBusy(true);
    try {
      const [f, s, e, d] = await Promise.all([
        getField(id),
        getState(id),
        getEvidence(id),
        getDecisions(id)
      ]);
      setField(f);
      setState(s);
      setEvidence(e);
      setDecisions(d);
      if (d[0]) {
        setSelectedAuditId(d[0].id);
      }
    } catch (err: any) {
      setNotice(err.message || 'Error loading field data');
    } finally {
      setBusy(false);
    }
  };

  const reloadAllFields = (preferredFieldId?: string) => {
    getFields()
      .then((data) => {
        setFields(data);
        if (data && data.length > 0) {
          if (preferredFieldId && data.some((f) => f.id === preferredFieldId)) {
            loadFieldData(preferredFieldId);
          } else {
            const currentExists = data.some((f) => f.id === selectedFieldId);
            if (!currentExists || !selectedFieldId) {
              loadFieldData(data[0].id);
            } else {
              loadFieldData(selectedFieldId);
            }
          }
        } else {
          setSelectedFieldId('');
          setField(null);
          setState(null);
          setEvidence([]);
          setDecisions([]);
        }
      })
      .catch((err) => {
        setNotice(err.message);
      });
  };

  useEffect(() => {
    if (currentUser) {
      reloadAllFields();
    }
  }, [currentUser]);

  const handleAuthSuccess = (authData: AuthResponse) => {
    // Reset any loaded fields/state from previous session to avoid any data bleed
    setField(null);
    setState(null);
    setEvidence([]);
    setDecisions([]);
    setFields([]);
    setSelectedFieldId(authData.field_id || '');

    setCurrentUser(authData.user);
    if (authData.field_id) {
      reloadAllFields(authData.field_id);
    } else {
      reloadAllFields();
    }
    setNotice(`Karibu sana, ${authData.user.name}! Your farm workspace is ready.`);
    setTimeout(() => setNotice(''), 4500);
  };

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setFields([]);
    setSelectedFieldId('');
    setField(null);
    setState(null);
    setEvidence([]);
    setDecisions([]);
    setConsultHistory([createDefaultGreeting()]);
    setActiveTab('home');
    setNotice('You have safely signed out.');
    setTimeout(() => setNotice(''), 3000);
  };

  const refreshCurrentField = () => {
    if (selectedFieldId) {
      loadFieldData(selectedFieldId);
    }
  };

  const handleRunAgent = async () => {
    if (!selectedFieldId) return;
    setBusy(true);
    try {
      const res = await decide(selectedFieldId);
      await loadFieldData(selectedFieldId);
      if (res.diff) {
        setNotice(`Field advice updated: ${res.recommendation} (superseded earlier recommendation)`);
      } else {
        setNotice(`Field advice updated: ${res.recommendation} (${Math.round(res.confidence * 100)}% confidence)`);
      }
      setTimeout(() => setNotice(''), 4500);
    } catch (err: any) {
      setNotice(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleSimulateRain = async () => {
    if (!selectedFieldId) return;
    setBusy(true);
    try {
      await observe(selectedFieldId, 'Dark storm clouds gathering over Mt Kenya ridge; wind picking up.');
      await loadFieldData(selectedFieldId);
      setNotice('New storm forecast recorded! Updating field recommendation...');
      const res = await decide(selectedFieldId, 'WEATHER_ALERT', 'reassess_irrigation_due_to_weather');
      await loadFieldData(selectedFieldId);
      setActiveTab('decision-diff');
      setNotice(`Weather shift recorded! Recommendation adjusted to ${res.recommendation}. Check Decision History.`);
      setTimeout(() => setNotice(''), 5000);
    } catch (err: any) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSendObservation = async (msg: string) => {
    if (!selectedFieldId) return;
    setBusy(true);
    try {
      const parsed = await observe(selectedFieldId, msg);
      // Immediately run decide so recommendation updates live on screen
      const dec = await decide(selectedFieldId, 'FARMER_OBSERVATION');
      await loadFieldData(selectedFieldId);
      const valStr = typeof parsed?.value === 'object' && parsed?.value?.value != null
        ? `${parsed.value.value}${parsed.value.unit ? ' ' + parsed.value.unit : ''}`
        : msg;
      setNotice(`Recorded observation: ${parsed?.predicate?.replaceAll('_', ' ')} (${valStr}). Field state updated & advisory recalculated to ${dec.recommendation}!`);
      setTimeout(() => setNotice(''), 4500);
    } catch (err: any) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSyncWeather = async () => {
    if (!selectedFieldId) return;
    setBusy(true);
    try {
      const w = await syncWeather(selectedFieldId);
      const dec = await decide(selectedFieldId, 'WEATHER_SYNC');
      await loadFieldData(selectedFieldId);
      setNotice(`Synced live Open-Meteo climate data (${w.temperature_c ?? ''}°C, ${w.rain_probability_24h ?? 0}% rain). Advisory recalculated to ${dec.recommendation}!`);
      setTimeout(() => setNotice(''), 4500);
    } catch (err: any) {
      setNotice(err.message || 'Failed to sync weather.');
    } finally {
      setBusy(false);
    }
  };

  const hasSuperseded = decisions.some((d) => d.supersedes_id);

  if (!currentUser) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="app">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasSuperseded={hasSuperseded}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main>
        {/* Top Header */}
        <header className="app-header">
          <div className="app-title">
            <p className="eyebrow">AGRICULTURAL DECISION ASSISTANT</p>
            <h1>AgriGuide Farm Center</h1>
          </div>

          <div className="header-controls">
            <div className="field-select-wrapper">
              <span>Active Field:</span>
              <select
                value={selectedFieldId}
                onChange={(e) => loadFieldData(e.target.value)}
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.crop})
                  </option>
                ))}
              </select>
            </div>

            <button
              className="secondary"
              onClick={() => setShowGuide(!showGuide)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: showGuide ? '#e8f4ec' : 'transparent',
                borderColor: showGuide ? '#235934' : 'inherit',
                color: showGuide ? '#1e5a32' : 'inherit',
                fontWeight: 600
              }}
            >
              <Compass size={15} />
              <span>{showGuide ? 'Hide Guide' : 'Farmer Journey'}</span>
            </button>

            <button className="secondary" onClick={refreshCurrentField} disabled={busy}>
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {notice && <div className="notice">{notice}</div>}

        {/* Quick Start & Farmer Journey Guide Banner */}
        {showGuide && (
          <div
            className="quick-start-guide"
            style={{
              background: 'linear-gradient(135deg, #f4faf6 0%, #eaf4ee 100%)',
              border: '1px solid #b7e0c5',
              borderRadius: '10px',
              padding: '16px 20px',
              margin: '0 24px 20px 24px',
              boxShadow: '0 2px 8px rgba(30, 90, 50, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={20} color="#1e5a32" />
                <h3 style={{ margin: 0, color: '#164626', fontSize: '15px', fontWeight: 700 }}>
                  AgriGuide Closed-Loop Farmer Journey
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                style={{ background: 'transparent', border: 'none', color: '#52755e', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
                title="Dismiss Guide"
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#385743', lineHeight: '1.45' }}>
              AgriGuide operates as an <strong>explainable agricultural decision agent</strong>:
              observe soil & weather → evaluate agronomic rules → emit auditable recommendation → verify outcomes & learn.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px 12px', border: '1px solid #d5eadc' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e5a32', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                  1. Home Overview
                </span>
                <p style={{ margin: 0, fontSize: '12px', color: '#4a6252', lineHeight: '1.35' }}>
                  Check today's clear recommendation (WAIT / IRRIGATE) and live conditions at a glance.
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  style={{ marginTop: '8px', padding: '5px 10px', fontSize: '11.5px', background: '#1e5a32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, width: '100%' }}
                >
                  Go to Home
                </button>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px 12px', border: '1px solid #d5eadc' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f52ba', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                  2. Farm & Fields
                </span>
                <p style={{ margin: 0, fontSize: '12px', color: '#4a6252', lineHeight: '1.35' }}>
                  Set up your farm location (Kutus, Eldoret, Nanyuki) and configure field crop twins.
                </p>
                <button
                  onClick={() => setActiveTab('my-farm')}
                  style={{ marginTop: '8px', padding: '5px 10px', fontSize: '11.5px', background: '#0f52ba', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, width: '100%' }}
                >
                  Manage Farm & Fields
                </button>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px 12px', border: '1px solid #d5eadc' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#b26b00', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                  3. Record What You See
                </span>
                <p style={{ margin: 0, fontSize: '12px', color: '#4a6252', lineHeight: '1.35' }}>
                  Log soil moisture, rain gauges, or wilt signs. The agent recalculates recommendations instantly.
                </p>
                <button
                  onClick={() => setActiveTab('record-obs')}
                  style={{ marginTop: '8px', padding: '5px 10px', fontSize: '11.5px', background: '#b26b00', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, width: '100%' }}
                >
                  Record Observation
                </button>
              </div>

              <div style={{ background: '#ffffff', borderRadius: '6px', padding: '10px 12px', border: '1px solid #d5eadc' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#2b5a7a', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }}>
                  4. What Changed?
                </span>
                <p style={{ margin: 0, fontSize: '12px', color: '#4a6252', lineHeight: '1.35' }}>
                  Inspect side-by-side auditable diffs showing why recommendations shifted from IRRIGATE to WAIT.
                </p>
                <button
                  onClick={() => setActiveTab('decision-diff')}
                  style={{ marginTop: '8px', padding: '5px 10px', fontSize: '11.5px', background: '#255034', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, width: '100%' }}
                >
                  View Decision Diff
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'home' && (
          <HomeOverview
            field={field}
            state={state}
            decisions={decisions}
            evidence={evidence}
            busy={busy}
            consultHistory={consultHistory}
            consulting={consulting}
            onSendConsult={handleSendConsult}
            onClearConsult={handleClearConsult}
            onRunDecision={handleRunAgent}
            onSyncWeather={handleSyncWeather}
            onOpenObservation={() => setActiveTab('record-obs')}
            onNavigateTab={setActiveTab}
            userName={currentUser?.name}
          />
        )}

        {activeTab === 'my-farm' && (
          <MyFarmView
            currentFieldId={selectedFieldId}
            onSelectField={(id) => loadFieldData(id)}
            onFarmOrFieldCreated={reloadAllFields}
          />
        )}

        {activeTab === 'field-intel' && (
          <FieldIntelligence
            field={field}
            state={state}
            evidence={evidence}
            decisions={decisions}
            busy={busy}
            consultHistory={consultHistory}
            consulting={consulting}
            onSendConsult={handleSendConsult}
            onClearConsult={handleClearConsult}
            onRunAgent={handleRunAgent}
            onSimulateRain={handleSimulateRain}
            onSyncWeather={handleSyncWeather}
            onSendObservation={handleSendObservation}
            onNavigateTab={setActiveTab}
            onSelectDecisionForAudit={(id) => setSelectedAuditId(id)}
            userName={currentUser?.name}
          />
        )}

        {activeTab === 'record-obs' && (
          <ObservationStation
            field={field}
            state={state}
            evidence={evidence}
            busy={busy}
            onObservationRecorded={refreshCurrentField}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'multi-domain' && (
          <MultiDomainFarmView
            field={field}
            state={state}
            decision={decisions[0]}
          />
        )}

        {activeTab === 'weather-sensors' && (
          <WeatherClimateSensorsView
            field={field}
            state={state}
          />
        )}

        {activeTab === 'decision-diff' && (
          <DecisionDiffViewer decisions={decisions} />
        )}

        {activeTab === 'rules' && (
          <FieldProfileManager
            fieldId={selectedFieldId}
            fieldName={field?.name || 'Selected Field'}
            onProfileUpdated={refreshCurrentField}
          />
        )}

        {activeTab === 'simulator' && (
          <WhatIfSimulator
            fieldId={selectedFieldId}
            fieldName={field?.name || 'Selected Field'}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView
            decisionId={selectedAuditId}
            decisions={decisions}
          />
        )}

        {activeTab === 'knowledge-graph' && (
          <KnowledgeGraphView
            fieldId={selectedFieldId}
            fieldName={field?.name || 'Selected Field'}
          />
        )}

        {activeTab === 'learning' && (
          <LearningCenter
            fieldId={selectedFieldId}
            latestDecisionId={decisions[0]?.id}
            onOutcomeAdded={refreshCurrentField}
          />
        )}

        {activeTab === 'scientific-benchmark' && (
          <ScientificBenchmarkView />
        )}

        {activeTab === 'admin-farmers' && (
          <AdminFarmersView
            onSelectField={async (fieldId) => {
              setSelectedFieldId(fieldId);
              await loadField(fieldId);
              setActiveTab('home');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfileView
            onProfileUpdated={(updated) => {
              setCurrentUser((prev) => (prev ? { ...prev, name: updated.name } : updated));
            }}
          />
        )}
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
