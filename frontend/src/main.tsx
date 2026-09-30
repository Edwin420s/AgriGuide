import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { Sidebar, TabType } from './components/Sidebar';
import { FieldIntelligence } from './components/FieldIntelligence';
import { DecisionDiffViewer } from './components/DecisionDiffViewer';
import { RuleLearningEditor } from './components/RuleLearningEditor';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AuditTrailView } from './components/AuditTrailView';
import { LearningCenter } from './components/LearningCenter';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { ScientificBenchmarkView } from './components/ScientificBenchmarkView';
import { MultiDomainFarmView } from './components/MultiDomainFarmView';
import { WeatherClimateSensorsView } from './components/WeatherClimateSensorsView';
import {
  getFields,
  getField,
  getState,
  getEvidence,
  getDecisions,
  decide,
  observe
} from './lib/api';
import { RefreshCw, Sprout } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('field-intel');
  const [fields, setFields] = useState<any[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [field, setField] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');

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

  useEffect(() => {
    getFields()
      .then((data) => {
        setFields(data);
        if (data && data.length > 0) {
          loadFieldData(data[0].id);
        }
      })
      .catch((err) => {
        setNotice(err.message);
      });
  }, []);

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
        setNotice(`Cognitive decision updated: ${res.recommendation} (superseded earlier decision)`);
      } else {
        setNotice(`Cognitive run completed: ${res.recommendation} (${Math.round(res.confidence * 100)}% conf)`);
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
      setNotice('New weather evidence added! Re-running cognitive agent to demonstrate state revision...');
      const res = await decide(selectedFieldId, 'WEATHER_ALERT', 'reassess_irrigation_due_to_weather');
      await loadFieldData(selectedFieldId);
      setActiveTab('decision-diff');
      setNotice(`State revised! Decision shifted to ${res.recommendation}. Check the diff view.`);
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
      await observe(selectedFieldId, msg);
      await loadFieldData(selectedFieldId);
      setNotice('Observation converted into structured evidence.');
      setTimeout(() => setNotice(''), 3500);
    } catch (err: any) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  };

  const hasSuperseded = decisions.some((d) => d.supersedes_id);

  return (
    <div className="app">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasSuperseded={hasSuperseded}
      />

      <main>
        {/* Top Header */}
        <header className="app-header">
          <div className="app-title">
            <p className="eyebrow">AGRICULTURAL DECISION INTELLIGENCE</p>
            <h1>AgriGuide Operations Center</h1>
          </div>

          <div className="header-controls">
            <div className="field-select-wrapper">
              <span>Field:</span>
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

            <button className="secondary" onClick={refreshCurrentField} disabled={busy}>
              <RefreshCw size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {notice && <div className="notice">{notice}</div>}

        {/* Tab Views */}
        {activeTab === 'field-intel' && (
          <FieldIntelligence
            field={field}
            state={state}
            evidence={evidence}
            decisions={decisions}
            busy={busy}
            onRunAgent={handleRunAgent}
            onSimulateRain={handleSimulateRain}
            onSendObservation={handleSendObservation}
            onNavigateTab={setActiveTab}
            onSelectDecisionForAudit={(id) => setSelectedAuditId(id)}
          />
        )}

        {activeTab === 'multi-domain' && (
          <MultiDomainFarmView
            field={field}
            state={state}
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
          <RuleLearningEditor
            fieldId={selectedFieldId}
            fieldName={field?.name || 'Selected Field'}
            onRuleChanged={refreshCurrentField}
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
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
