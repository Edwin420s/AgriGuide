import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  Sprout,
  MapPin,
  Droplets,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Activity,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { getAdminFarmers, FarmerAccount, FarmerProfileField } from '../lib/api';

interface AdminFarmersViewProps {
  onSelectField: (fieldId: string) => void;
}

export const AdminFarmersView: React.FC<AdminFarmersViewProps> = ({ onSelectField }) => {
  const [farmers, setFarmers] = useState<FarmerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'farmer'>('all');

  const fetchFarmers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminFarmers();
      setFarmers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load farmer accounts. Ensure you are signed in as an Admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const totalFarmers = farmers.length;
  const totalFarms = farmers.reduce((acc, f) => acc + f.total_farms, 0);
  const totalFields = farmers.reduce((acc, f) => acc + f.total_fields, 0);
  const totalDecisions = farmers.reduce((acc, f) => acc + f.total_decisions, 0);
  const totalEvidence = farmers.reduce((acc, f) => acc + f.total_evidence, 0);

  const filteredFarmers = farmers.filter((f) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      f.farms.some(
        (fm) =>
          fm.name.toLowerCase().includes(q) ||
          fm.location.toLowerCase().includes(q) ||
          fm.fields.some((fld) => fld.crop.toLowerCase().includes(q) || fld.name.toLowerCase().includes(q))
      );

    if (filterRole === 'admin') {
      return matchesSearch && f.role?.toUpperCase() === 'ADMIN';
    }
    if (filterRole === 'farmer') {
      return matchesSearch && f.role?.toUpperCase() !== 'ADMIN';
    }
    return matchesSearch;
  });

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <div className="badge-row" style={{ marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ebf5ee',
                color: '#1e5a32',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #c2e2cc'
              }}
            >
              <ShieldCheck size={13} />
              ADMINISTRATIVE CONTROL PANEL
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#eef3fc',
                color: '#1a56db',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px'
              }}
            >
              Cross-Account Profiles & Shamba Directory
            </span>
          </div>
          <h2>Farmer Accounts & Digital Twins Directory</h2>
          <p className="subtitle">
            Overview of all registered farmers, their shamba locations in Kenya, active crop twins, and real-time advisory activity.
          </p>
        </div>
        <button
          className="secondary"
          onClick={fetchFarmers}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Aggregate Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          margin: '20px 0'
        }}
      >
        <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e1e8e3' }}>
          <div style={{ fontSize: '11.5px', color: '#667d6e', fontWeight: 600, textTransform: 'uppercase' }}>
            Registered Farmers
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#163b22', marginTop: '4px' }}>
            {totalFarmers}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e1e8e3' }}>
          <div style={{ fontSize: '11.5px', color: '#667d6e', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Farms
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e5a32', marginTop: '4px' }}>
            {totalFarms}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e1e8e3' }}>
          <div style={{ fontSize: '11.5px', color: '#667d6e', fontWeight: 600, textTransform: 'uppercase' }}>
            Monitored Fields
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f52ba', marginTop: '4px' }}>
            {totalFields}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e1e8e3' }}>
          <div style={{ fontSize: '11.5px', color: '#667d6e', fontWeight: 600, textTransform: 'uppercase' }}>
            Evaluated Decisions
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#8e4b10', marginTop: '4px' }}>
            {totalDecisions}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '8px', border: '1px solid #e1e8e3' }}>
          <div style={{ fontSize: '11.5px', color: '#667d6e', fontWeight: 600, textTransform: 'uppercase' }}>
            Telemetry Ingestions
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#255034', marginTop: '4px' }}>
            {totalEvidence}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px',
          background: '#ffffff',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #e1e8e3'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#8a9b90' }}
          />
          <input
            type="text"
            placeholder="Search by farmer name, email, county, shamba, or crop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '6px',
              border: '1px solid #ced8d1',
              fontSize: '13px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={15} color="#5a7864" />
          <span style={{ fontSize: '12.5px', color: '#4a6252', fontWeight: 600 }}>Role:</span>
          {(['all', 'admin', 'farmer'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                borderRadius: '5px',
                border: '1px solid',
                borderColor: filterRole === r ? '#1e5a32' : '#d5eadc',
                background: filterRole === r ? '#1e5a32' : '#ffffff',
                color: filterRole === r ? '#ffffff' : '#385743',
                cursor: 'pointer',
                fontWeight: filterRole === r ? 700 : 500,
                textTransform: 'capitalize'
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ background: '#fdf2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '36px', textAlign: 'center', color: '#5a7864' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px auto' }} />
          <p>Loading farmer profiles and digital twins across Kenya...</p>
        </div>
      )}

      {/* Accounts Directory */}
      {!loading && filteredFarmers.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #e1e8e3' }}>
          <p style={{ color: '#5a7864', margin: 0 }}>No farmer accounts match your search query.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {filteredFarmers.map((f) => {
          const isAdmin = f.role?.toUpperCase() === 'ADMIN';
          return (
            <div
              key={f.id}
              style={{
                background: '#ffffff',
                borderRadius: '8px',
                border: isAdmin ? '2px solid #85c296' : '1px solid #e1e8e3',
                padding: '18px 20px',
                boxShadow: isAdmin ? '0 3px 12px rgba(30, 90, 50, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              {/* Farmer Profile Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '10px',
                  borderBottom: '1px solid #edf2ee',
                  paddingBottom: '12px',
                  marginBottom: '14px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#163b22', fontWeight: 700 }}>
                      {f.name}
                    </h3>
                    {isAdmin ? (
                      <span
                        style={{
                          background: '#e8f4ec',
                          color: '#1e5a32',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: '1px solid #b7e0c5'
                        }}
                      >
                        SYSTEM ADMIN
                      </span>
                    ) : (
                      <span
                        style={{
                          background: '#f2f4f8',
                          color: '#475569',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        FARMER
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: '#52755e', marginTop: '3px' }}>
                    {f.email} · Account ID: <code style={{ fontSize: '11px', color: '#7a9684' }}>{f.id.slice(0, 8)}</code>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', fontSize: '12px', color: '#5a7864' }}>
                  <div>
                    <strong>{f.total_farms}</strong> {f.total_farms === 1 ? 'farm' : 'farms'}
                  </div>
                  <div>
                    <strong>{f.total_fields}</strong> {f.total_fields === 1 ? 'field' : 'fields'}
                  </div>
                  <div>
                    <strong>{f.total_decisions}</strong> decisions
                  </div>
                  {f.created_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      <span>{new Date(f.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Farms & Fields */}
              {f.farms.length === 0 ? (
                <div style={{ fontSize: '12.5px', color: '#7a9684', fontStyle: 'italic' }}>
                  No farms created yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {f.farms.map((fm) => (
                    <div
                      key={fm.id}
                      style={{
                        background: '#f9fbf9',
                        border: '1px solid #e6eee8',
                        borderRadius: '6px',
                        padding: '12px 14px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#163b22' }}>
                            {fm.name}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '11.5px',
                              color: '#476352'
                            }}
                          >
                            <MapPin size={12} color="#0f52ba" />
                            {fm.location || 'Location not specified'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background:
                                fm.water_availability === 'RELIABLE'
                                  ? '#e6f7ec'
                                  : fm.water_availability === 'HIGHLY_LIMITED'
                                  ? '#fef2f2'
                                  : '#fef9ee',
                              color:
                                fm.water_availability === 'RELIABLE'
                                  ? '#1e5a32'
                                  : fm.water_availability === 'HIGHLY_LIMITED'
                                  ? '#991b1b'
                                  : '#92400e',
                              fontWeight: 600
                            }}
                          >
                            Water: {fm.water_availability}
                          </span>
                          {fm.area && (
                            <span style={{ fontSize: '11px', color: '#5a7864' }}>
                              {fm.area} acres
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fields inside this farm */}
                      {fm.fields.length === 0 ? (
                        <div style={{ fontSize: '12px', color: '#8a9b90', fontStyle: 'italic' }}>
                          No plots or crop fields configured yet.
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                            gap: '8px',
                            marginTop: '6px'
                          }}
                        >
                          {fm.fields.map((fld) => (
                            <div
                              key={fld.id}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #d9e6dc',
                                borderRadius: '5px',
                                padding: '10px 12px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#163b22' }}>
                                  {fld.name}
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#52755e', marginTop: '2px' }}>
                                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{fld.crop}</span> ·{' '}
                                  <span>{fld.growth_stage}</span> · <span>{fld.soil_type}</span>
                                </div>
                                <div style={{ fontSize: '10.5px', color: '#7a9684', marginTop: '3px' }}>
                                  {fld.decisions_count} decisions · {fld.evidence_count} telemetry points
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => onSelectField(fld.id)}
                                title="Switch active field to inspect this farm"
                                style={{
                                  background: '#1e5a32',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '5px 8px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <span>Inspect</span>
                                <ArrowRight size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
