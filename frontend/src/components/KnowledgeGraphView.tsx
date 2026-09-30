import React, { useEffect, useState } from 'react';
import { Network, GitFork, Compass, ArrowRight, Code, Shield } from 'lucide-react';
import { getKnowledgeGraph } from '../lib/api';

interface KnowledgeGraphViewProps {
  fieldId: string;
  fieldName: string;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ fieldId, fieldName }) => {
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'causal' | 'metta'>('visual');

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header">
        <div>
          <span className="pill pill-mode">FARM DIGITAL TWIN</span>
          <h2>Agricultural Knowledge Graph</h2>
          <p className="subtitle">
            Relational, temporal, and causal representations of <strong>{fieldName}</strong>.
            Fuses crop lifecycle, soil physics, sensor telemetry, and agronomic causality into MeTTa atom spaces.
          </p>
        </div>

        <div className="button-group">
          <button
            className={`btn-filter ${activeTab === 'visual' ? 'active' : ''}`}
            onClick={() => setActiveTab('visual')}
          >
            <Network size={15} />
            <span>Entities & Relations</span>
          </button>
          <button
            className={`btn-filter ${activeTab === 'causal' ? 'active' : ''}`}
            onClick={() => setActiveTab('causal')}
          >
            <GitFork size={15} />
            <span>Causal Pathways</span>
          </button>
          <button
            className={`btn-filter ${activeTab === 'metta' ? 'active' : ''}`}
            onClick={() => setActiveTab('metta')}
          >
            <Code size={15} />
            <span>MeTTa Atoms</span>
          </button>
        </div>
      </div>

      {loading && <div className="loading-box">Synthesizing Agricultural Knowledge Graph...</div>}

      {graphData && !loading && (
        <div className="graph-content">
          {activeTab === 'visual' && (
            <div className="graph-cards-grid">
              {/* Entities Panel */}
              <div className="panel">
                <div className="panel-header">
                  <div className="title-row">
                    <Compass size={18} />
                    <h3>Graph Entities ({graphData.entities?.length || 0})</h3>
                  </div>
                </div>
                <div className="entity-list">
                  {graphData.entities?.map((e: any) => (
                    <div key={e.id} className="entity-card">
                      <span className={`entity-badge type-${e.type.toLowerCase()}`}>{e.type}</span>
                      <h4>{e.label}</h4>
                      {e.properties && Object.keys(e.properties).length > 0 && (
                        <div className="entity-props">
                          {Object.entries(e.properties).map(([k, v]) => (
                            <span key={k}>
                              {k}: <strong>{String(v)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Relations Panel */}
              <div className="panel">
                <div className="panel-header">
                  <div className="title-row">
                    <Network size={18} />
                    <h3>Relational Triples ({graphData.relations?.length || 0})</h3>
                  </div>
                </div>
                <div className="relation-list">
                  {graphData.relations?.map((r: any, idx: number) => (
                    <div key={idx} className="relation-triple-row">
                      <span className="triple-subject">{r.subject}</span>
                      <div className="triple-predicate">
                        <ArrowRight size={14} />
                        <span>{r.predicate}</span>
                      </div>
                      <span className="triple-object">{r.object}</span>
                      <span className="triple-conf">{Math.round(r.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'causal' && (
            <div className="causal-chains-container">
              <div className="panel">
                <div className="panel-header">
                  <div className="title-row">
                    <GitFork size={18} />
                    <h3>Deterministic Agronomic Causal Pathways</h3>
                  </div>
                </div>
                <div className="causal-list">
                  {graphData.causal_chains?.map((c: any, idx: number) => (
                    <div key={idx} className="causal-chain-card">
                      <div className="chain-path">
                        {c.path.map((node: string, nIdx: number) => (
                          <React.Fragment key={nIdx}>
                            <span className="chain-node">{node.replaceAll('_', ' ')}</span>
                            {nIdx < c.path.length - 1 && <ArrowRight size={16} className="chain-arrow" />}
                          </React.Fragment>
                        ))}
                      </div>
                      <p className="chain-mechanism">
                        <strong>Agronomic Mechanism:</strong> {c.mechanism}
                      </p>
                      <div className="chain-meta">
                        <span className="weight-badge">Causal Weight: {Math.round(c.weight * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'metta' && (
            <div className="panel">
              <div className="panel-header">
                <div className="title-row">
                  <Code size={18} />
                  <h3>MeTTa Atom Space Serialized Representation</h3>
                </div>
                <span className="count-badge">{graphData.metta_atoms?.length || 0} atoms</span>
              </div>
              <pre className="metta-code-block">
                {graphData.metta_atoms?.join('\n')}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
