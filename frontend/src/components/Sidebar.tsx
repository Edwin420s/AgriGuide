import React from 'react';
import {
  Activity,
  Award,
  CloudRain,
  Compass,
  FlaskConical,
  GitBranch,
  Layers,
  MapPin,
  Network,
  PlusCircle,
  Scale,
  ShieldCheck,
  Sliders,
  Sprout,
  TrendingUp,
  LogOut,
  User,
  Users
} from 'lucide-react';

export type TabType =
  | 'home'
  | 'my-farm'
  | 'field-intel'
  | 'record-obs'
  | 'weather-sensors'
  | 'multi-domain'
  | 'decision-diff'
  | 'rules'
  | 'simulator'
  | 'audit'
  | 'learning'
  | 'knowledge-graph'
  | 'scientific-benchmark'
  | 'admin-farmers'
  | 'profile';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasSuperseded: boolean;
  currentUser?: { name: string; email: string; role?: string } | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  hasSuperseded,
  currentUser,
  onLogout
}) => {
  const isExpertTab = ['audit', 'rules', 'knowledge-graph', 'scientific-benchmark'].includes(activeTab);
  const [expertOpen, setExpertOpen] = React.useState<boolean>(isExpertTab || true);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">
          <Sprout size={24} />
        </div>
        <div>
          <h2>AgriGuide</h2>
          <small>Agricultural Decision Agent</small>
        </div>
      </div>

      <nav className="nav-menu">
        <div className="nav-section-title">MY FARM</div>

        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <Compass size={18} />
          <span>Home Overview</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'my-farm' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-farm')}
        >
          <MapPin size={18} />
          <span>Farms & Fields</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'record-obs' ? 'active' : ''}`}
          onClick={() => setActiveTab('record-obs')}
        >
          <PlusCircle size={18} />
          <span>Record Observation</span>
        </button>

        <div className="nav-section-title">FIELD INTELLIGENCE</div>

        <button
          className={`nav-item ${activeTab === 'field-intel' ? 'active' : ''}`}
          onClick={() => setActiveTab('field-intel')}
        >
          <Activity size={18} />
          <span>Field Advisor</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'weather-sensors' ? 'active' : ''}`}
          onClick={() => setActiveTab('weather-sensors')}
        >
          <CloudRain size={18} />
          <span>Weather & Sensors</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'multi-domain' ? 'active' : ''}`}
          onClick={() => setActiveTab('multi-domain')}
        >
          <FlaskConical size={18} />
          <span>Farm Operations</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulator')}
        >
          <Sliders size={18} />
          <span>What-If Simulator</span>
        </button>

        <div className="nav-section-title">DECISIONS & LEARNING</div>

        <button
          className={`nav-item ${activeTab === 'decision-diff' ? 'active' : ''}`}
          onClick={() => setActiveTab('decision-diff')}
        >
          <Scale size={18} />
          <span>Decision History & Diff</span>
          {hasSuperseded && <span className="diff-badge">Updated</span>}
        </button>

        <button
          className={`nav-item ${activeTab === 'learning' ? 'active' : ''}`}
          onClick={() => setActiveTab('learning')}
        >
          <TrendingUp size={18} />
          <span>Outcomes & Calibration</span>
        </button>

        {/* Collapsible Expert Tools */}
        <div
          className="nav-section-title"
          onClick={() => setExpertOpen(!expertOpen)}
          style={{
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '10px'
          }}
          title="Click to toggle expert inspection tools"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Layers size={13} />
            <span>EXPERT & AUDIT TOOLS</span>
          </span>
          <span style={{ fontSize: '11px', color: '#688d75', fontWeight: 700 }}>
            {expertOpen ? '▾' : '▸'}
          </span>
        </div>

        {expertOpen && (
          <div style={{ borderLeft: '2px solid #d4e7dc', marginLeft: '6px', paddingLeft: '4px' }}>
            <button
              className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              <GitBranch size={17} />
              <span>Decision Audit Trail</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'rules' ? 'active' : ''}`}
              onClick={() => setActiveTab('rules')}
            >
              <Layers size={17} />
              <span>Custom Field Rules</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'knowledge-graph' ? 'active' : ''}`}
              onClick={() => setActiveTab('knowledge-graph')}
            >
              <Network size={17} />
              <span>Digital Twin & Graph</span>
            </button>

            <button
              className={`nav-item ${activeTab === 'scientific-benchmark' ? 'active' : ''}`}
              onClick={() => setActiveTab('scientific-benchmark')}
            >
              <Award size={17} />
              <span>Verification & Benchmark</span>
            </button>
          </div>
        )}

        {currentUser?.role?.toUpperCase() === 'ADMIN' && (
          <>
            <div className="nav-section-title" style={{ color: '#165e32', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
              <ShieldCheck size={13} color="#165e32" />
              <span>ADMINISTRATION</span>
            </div>

            <button
              className={`nav-item ${activeTab === 'admin-farmers' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin-farmers')}
              style={{
                background: activeTab === 'admin-farmers' ? '#e8f4ec' : undefined,
                color: activeTab === 'admin-farmers' ? '#165e32' : undefined,
                fontWeight: activeTab === 'admin-farmers' ? 700 : undefined
              }}
            >
              <Users size={18} />
              <span>Farmer Directory</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidecard">
        <ShieldCheck size={20} className="icon-shield" />
        <div>
          <b>Auditable By Design</b>
          <p>Sensors → Field Rules → Audit Trail → Verified Outcomes</p>
        </div>
      </div>

      {currentUser && (
        <div className="sidebar-user-card">
          <div
            className={`sidebar-user-info ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            style={{ cursor: 'pointer' }}
            title="View Profile and Account Security"
          >
            <div className="sidebar-user-avatar">
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>
            <div className="sidebar-user-meta">
              <span className="sidebar-user-name" title={currentUser.name}>
                {currentUser.name}
              </span>
              <span
                className="sidebar-user-role"
                style={{
                  color: currentUser.role?.toUpperCase() === 'ADMIN' ? '#165e32' : undefined,
                  fontWeight: currentUser.role?.toUpperCase() === 'ADMIN' ? 700 : undefined
                }}
              >
                {currentUser.role?.toUpperCase() === 'ADMIN' ? 'System Admin' : currentUser.role || 'Farmer'}
              </span>
            </div>
          </div>
          {onLogout && (
            <button
              className="sidebar-logout-btn"
              onClick={onLogout}
              title="Sign Out of AgriGuide"
            >
              <LogOut size={13} />
              <span>Exit</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
