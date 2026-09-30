import {
  Activity,
  BrainCircuit,
  CloudRain,
  GitBranch,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Sliders,
  Scale,
  Network,
  Award
} from 'lucide-react';

export type TabType = 'field-intel' | 'decision-diff' | 'rules' | 'simulator' | 'audit' | 'learning' | 'knowledge-graph' | 'scientific-benchmark';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasSuperseded: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, hasSuperseded }) => {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">
          <Sprout size={24} />
        </div>
        <div>
          <h2>AgriGuide</h2>
          <small>MeTTa + Omega Decision Agent</small>
        </div>
      </div>

      <nav className="nav-menu">
        <button
          className={`nav-item ${activeTab === 'field-intel' ? 'active' : ''}`}
          onClick={() => setActiveTab('field-intel')}
        >
          <Activity size={18} />
          <span>Field Intelligence</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'knowledge-graph' ? 'active' : ''}`}
          onClick={() => setActiveTab('knowledge-graph')}
        >
          <Network size={18} />
          <span>Knowledge Graph</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'decision-diff' ? 'active' : ''}`}
          onClick={() => setActiveTab('decision-diff')}
        >
          <Scale size={18} />
          <span>What Changed? (Diff)</span>
          {hasSuperseded && <span className="diff-badge">Active</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <BrainCircuit size={18} />
          <span>The Agent That Grows Up</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <Sliders size={18} />
          <span>What-If Sandbox</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <GitBranch size={18} />
          <span>Explainable Audit</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'learning' ? 'active' : ''}`}
          onClick={() => setActiveTab('learning')}
        >
          <TrendingUp size={18} />
          <span>Closed-Loop Learning</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'scientific-benchmark' ? 'active' : ''}`}
          onClick={() => setActiveTab('scientific-benchmark')}
        >
          <Award size={18} />
          <span>Scientific Benchmark</span>
        </button>
      </nav>

      <div className="sidecard">
        <ShieldCheck size={20} className="icon-shield" />
        <div>
          <b>Auditable By Design</b>
          <p>Evidence → Belief → MeTTa Rules → Audit → Learning</p>
        </div>
      </div>
    </aside>
  );
};
