import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Sprout,
  Droplets,
  CloudRain,
  Thermometer,
  Compass,
  CheckCircle,
  Plus,
  Layers,
  Search,
  RefreshCw,
  ArrowRight,
  Sun,
  ShieldCheck,
  AlertCircle,
  Trash2
} from 'lucide-react';
import {
  getFarms,
  createFarm,
  getFields,
  createField,
  deleteField,
  resolveLocation,
  syncWeather,
  getKenyaLocations,
  getCrops,
  addCrop,
  detectCrop,
  CropItem
} from '../lib/api';

interface MyFarmViewProps {
  currentFieldId: string;
  onSelectField: (fieldId: string) => void;
  onFarmOrFieldCreated: () => void;
}

export const MyFarmView: React.FC<MyFarmViewProps> = ({
  currentFieldId,
  onSelectField,
  onFarmOrFieldCreated
}) => {
  const [farms, setFarms] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Farm Form State
  const [farmName, setFarmName] = useState('Green Valley Farm');
  const [locationQuery, setLocationQuery] = useState('Kutus, Kirinyaga');
  const [farmArea, setFarmArea] = useState('2.5');
  const [waterAvailability, setWaterAvailability] = useState<'RELIABLE' | 'LIMITED' | 'HIGHLY_LIMITED'>('LIMITED');
  const [waterSource, setWaterSource] = useState('Farm Storage Tank (10,000L)');

  // Resolved Location Info
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState<any>({
    name: 'Kutus, Kirinyaga County, Kenya',
    latitude: -0.528,
    longitude: 37.283,
    elevation: 1250,
    preview_weather: {
      temperature_c: 24.5,
      weather_code: 2,
      weather_description: 'Partly Cloudy',
      rain_probability: 25
    }
  });

  // Field Form State
  const [fieldName, setFieldName] = useState('East Terrace - Maize');
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [crop, setCrop] = useState('maize');
  const [customCropActive, setCustomCropActive] = useState(false);
  const [customCropName, setCustomCropName] = useState('');
  const [availableCrops, setAvailableCrops] = useState<CropItem[]>([]);
  const [detectedCropInfo, setDetectedCropInfo] = useState<any>(null);
  const [growthStage, setGrowthStage] = useState('flowering');
  const [soilType, setSoilType] = useState('loam');
  const [irrigationMethod, setIrrigationMethod] = useState('drip');
  const [fieldArea, setFieldArea] = useState('1.2');

  const [kenyaLocations, setKenyaLocations] = useState<Array<{ key: string; name: string; latitude: number; longitude: number }>>([]);
  const [showQuickFarmModal, setShowQuickFarmModal] = useState(false);
  const [quickFarmName, setQuickFarmName] = useState('');
  const [quickFarmLocation, setQuickFarmLocation] = useState('Kutus, Kirinyaga');

  useEffect(() => {
    if (!customCropActive || !customCropName.trim() || customCropName.trim().length < 2) {
      setDetectedCropInfo(null);
      return;
    }
    const timer = setTimeout(() => {
      detectCrop(customCropName.trim())
        .then((data) => setDetectedCropInfo(data))
        .catch(() => setDetectedCropInfo(null));
    }, 250);
    return () => clearTimeout(timer);
  }, [customCropName, customCropActive]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [farmList, fieldList, cropsList] = await Promise.all([
        getFarms(),
        getFields(),
        getCrops().catch(() => [])
      ]);
      setFarms(farmList || []);
      setFields(fieldList || []);
      if (cropsList && cropsList.length > 0) {
        setAvailableCrops(cropsList);
      }
      if (farmList && farmList.length > 0 && !selectedFarmId) {
        setSelectedFarmId(farmList[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching farm data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    getKenyaLocations()
      .then((locs) => setKenyaLocations(locs || []))
      .catch((err) => console.error('Error fetching Kenya locations:', err));
  }, []);

  const handleResolveLocation = async (queryText: string) => {
    if (!queryText.trim()) return;
    setResolvingLocation(true);
    try {
      const data = await resolveLocation(queryText);
      setResolvedLocation(data);
      setStatusMessage({
        text: `Resolved location: ${data.name} (${data.latitude.toFixed(3)}°, ${data.longitude.toFixed(3)}°)`,
        type: 'info'
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        text: `Could not resolve location: ${err.message}`,
        type: 'error'
      });
    } finally {
      setResolvingLocation(false);
    }
  };

  const handleQuickCreateFarm = async () => {
    if (!quickFarmName.trim()) return;
    setBusy(true);
    try {
      let lat = -0.528;
      let lon = 37.283;
      let locName = quickFarmLocation.trim() || 'Kutus, Kirinyaga County, Kenya';
      try {
        const resolved = await resolveLocation(locName);
        if (resolved) {
          lat = resolved.latitude;
          lon = resolved.longitude;
          locName = resolved.name;
        }
      } catch {}

      const newFarm = await createFarm({
        name: quickFarmName.trim(),
        location_name: locName,
        latitude: lat,
        longitude: lon,
        area: 2.5,
        water_availability: 'LIMITED'
      });
      await loadData();
      setSelectedFarmId(newFarm.id);
      setShowQuickFarmModal(false);
      setQuickFarmName('');
      setStatusMessage({
        text: `Farm "${newFarm.name}" created and assigned to field!`,
        type: 'success'
      });
      onFarmOrFieldCreated();
    } catch (err: any) {
      setStatusMessage({ text: `Failed to create farm: ${err.message}`, type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim()) return;
    setBusy(true);
    try {
      const newFarm = await createFarm({
        name: farmName.trim(),
        location_name: resolvedLocation?.name || locationQuery,
        latitude: resolvedLocation?.latitude ?? -0.528,
        longitude: resolvedLocation?.longitude ?? 37.283,
        area: parseFloat(farmArea) || 2.5,
        water_availability: waterAvailability
      });
      setStatusMessage({
        text: `Farm "${newFarm.name}" created successfully at ${newFarm.location || resolvedLocation?.name}!`,
        type: 'success'
      });
      await loadData();
      setSelectedFarmId(newFarm.id);
      onFarmOrFieldCreated();
    } catch (err: any) {
      setStatusMessage({ text: `Failed to create farm: ${err.message}`, type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) return;
    setBusy(true);
    try {
      const finalCrop = customCropActive
        ? (customCropName.trim().toLowerCase() || 'maize')
        : crop;

      if (customCropActive && customCropName.trim()) {
        try {
          await addCrop(customCropName.trim());
        } catch {
          // Backend will auto-register upon field creation as well
        }
      }

      const newField = await createField({
        farm_id: selectedFarmId || undefined,
        name: fieldName.trim(),
        crop: finalCrop,
        growth_stage: growthStage,
        soil_type: soilType,
        irrigation_method: irrigationMethod,
        area_ha: parseFloat(fieldArea) || 1.0
      });
      setStatusMessage({
        text: `Field "${newField.name}" (${finalCrop}) created and digital twin initialized with live telemetry!`,
        type: 'success'
      });
      setFieldName('');
      if (customCropActive) {
        setCustomCropName('');
        setCustomCropActive(false);
      }
      await loadData();
      onSelectField(newField.id);
      onFarmOrFieldCreated();
    } catch (err: any) {
      setStatusMessage({ text: `Failed to create field: ${err.message}`, type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteField = async (e: React.MouseEvent, fieldId: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove field "${name}" and all its telemetry history?`)) {
      return;
    }
    setBusy(true);
    try {
      await deleteField(fieldId);
      setStatusMessage({ text: `Field "${name}" removed successfully.`, type: 'info' });
      await loadData();
      onFarmOrFieldCreated();
    } catch (err: any) {
      setStatusMessage({ text: `Failed to remove field: ${err.message}`, type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tab-container my-farm-view">
      {/* View Header */}
      <section className="overview-welcome-card">
        <div className="welcome-left">
          <div className="greeting-eyebrow">
            <MapPin size={15} style={{ color: '#1e5a32' }} />
            <span>FARM & FIELD WORKSPACE</span>
          </div>
          <h1>Farm Setup & Digital Twin Registry</h1>
          <p className="welcome-subtitle">
            Configure your agricultural holdings, pinpoint your micro-climate location with Open-Meteo East Africa,
            and deploy field digital twins with customized soil and irrigation parameters.
          </p>
        </div>
      </section>

      {statusMessage && (
        <div className={`status-banner ${statusMessage.type}`}>
          {statusMessage.type === 'success' && <CheckCircle size={16} />}
          {statusMessage.type === 'error' && <AlertCircle size={16} />}
          {statusMessage.type === 'info' && <Compass size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Two Column Setup: Create Farm & Create Field */}
      <div className="farm-setup-grid">
        {/* Step 1: Create / Configure Farm */}
        <div className="farm-card-panel">
          <div className="panel-title-row">
            <div className="step-badge">STEP 1</div>
            <div>
              <h3>Farm Setup & Climate Location</h3>
              <p className="panel-desc">Pinpoint farm location for automated Open-Meteo telemetry</p>
            </div>
          </div>

          <form onSubmit={handleCreateFarm} className="setup-form">
            <div className="form-group">
              <label>Farm Name</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="e.g. Green Valley Farm"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Farm Location / County (Kenya)</span>
                <span style={{ fontSize: '11px', color: '#1e5a32', fontWeight: 600 }}>
                  🇰🇪 81 Hubs & 47 Counties Supported
                </span>
              </label>
              <div className="location-input-group">
                <input
                  type="text"
                  list="kenya-locations-list"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Type any Kenyan county, town, or agricultural hub (e.g. Eldoret, Kitale, Machakos)..."
                  required
                />
                <datalist id="kenya-locations-list">
                  {kenyaLocations.map((loc) => (
                    <option key={loc.key} value={loc.name} />
                  ))}
                </datalist>
                <button
                  type="button"
                  className="search-btn"
                  onClick={() => handleResolveLocation(locationQuery)}
                  disabled={resolvingLocation || !locationQuery.trim()}
                  title="Detect coordinates and fetch live local weather"
                >
                  {resolvingLocation ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
                  <span>{resolvingLocation ? 'Resolving...' : 'Pinpoint'}</span>
                </button>
              </div>

              {/* Quick Select Dropdown */}
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#4b6f58', fontWeight: 600 }}>Select From 81 Hubs:</span>
                <select
                  style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #bce0cb', background: '#fff', color: '#1e5a32', cursor: 'pointer', maxWidth: '280px' }}
                  onChange={(e) => {
                    if (e.target.value) {
                      setLocationQuery(e.target.value);
                      handleResolveLocation(e.target.value);
                    }
                  }}
                  value=""
                >
                  <option value="" disabled>Choose a verified Kenya location...</option>
                  {kenyaLocations.map((loc) => (
                    <option key={loc.key} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <small className="help-text" style={{ marginTop: '6px' }}>
                Quick picks:
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Kutus, Kirinyaga'); handleResolveLocation('Kutus, Kirinyaga'); }}>Kutus</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Eldoret'); handleResolveLocation('Eldoret'); }}>Eldoret</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Kitale'); handleResolveLocation('Kitale'); }}>Kitale</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Nakuru'); handleResolveLocation('Nakuru'); }}>Nakuru</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Meru'); handleResolveLocation('Meru'); }}>Meru</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Embu'); handleResolveLocation('Embu'); }}>Embu</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Machakos'); handleResolveLocation('Machakos'); }}>Machakos</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Kisumu'); handleResolveLocation('Kisumu'); }}>Kisumu</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Kisii'); handleResolveLocation('Kisii'); }}>Kisii</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Nyeri'); handleResolveLocation('Nyeri'); }}>Nyeri</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Kilifi'); handleResolveLocation('Kilifi'); }}>Kilifi</button>
                <button type="button" className="quick-loc-link" onClick={() => { setLocationQuery('Garissa'); handleResolveLocation('Garissa'); }}>Garissa</button>
              </small>
            </div>

            {/* Resolved Location Preview Box */}
            {resolvedLocation && (
              <div className="resolved-location-card">
                <div className="loc-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} color="#1e5a32" />
                    <strong>{resolvedLocation.name}</strong>
                  </div>
                  <span className="loc-source-pill">Open-Meteo Geocoded</span>
                </div>
                <div className="loc-coords">
                  <span>GPS: {resolvedLocation.latitude?.toFixed(4)}°, {resolvedLocation.longitude?.toFixed(4)}°</span>
                  {resolvedLocation.elevation && <span>Elevation: {resolvedLocation.elevation}m</span>}
                </div>
                {resolvedLocation.preview_weather && (
                  <div className="loc-weather-preview">
                    <span><Thermometer size={12} color="#d95a00" /> {resolvedLocation.preview_weather.temperature_c}°C</span>
                    <span><CloudRain size={12} color="#0f52ba" /> {resolvedLocation.preview_weather.rain_probability}% Rain</span>
                    <span><Sun size={12} color="#d48806" /> {resolvedLocation.preview_weather.weather_description}</span>
                  </div>
                )}
              </div>
            )}

            <div className="form-row-2">
              <div className="form-group">
                <label>Farm Size (Acres)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={farmArea}
                  onChange={(e) => setFarmArea(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Water Availability</label>
                <select
                  value={waterAvailability}
                  onChange={(e: any) => setWaterAvailability(e.target.value)}
                >
                  <option value="RELIABLE">Reliable (Borehole / River)</option>
                  <option value="LIMITED">Limited (Farm Tank / Rainfed)</option>
                  <option value="HIGHLY_LIMITED">Highly Limited (Tension/Scarcity)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Primary Water Source & Storage</label>
              <input
                type="text"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                placeholder="e.g. Farm storage tank (10,000L), borehole pump"
              />
            </div>

            <button type="submit" className="submit-form-btn" disabled={busy}>
              <Plus size={16} />
              <span>{busy ? 'Saving Farm...' : 'Save & Register Farm'}</span>
            </button>
          </form>
        </div>

        {/* Step 2: Create / Configure Field */}
        <div className="farm-card-panel">
          <div className="panel-title-row">
            <div className="step-badge">STEP 2</div>
            <div>
              <h3>Field Setup & Crop Digital Twin</h3>
              <p className="panel-desc">Configure crop phenology, soil texture, and irrigation method</p>
            </div>
          </div>

          <form onSubmit={handleCreateField} className="setup-form">
            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Assign to Farm</span>
                <button
                  type="button"
                  style={{
                    background: '#e8f5ec',
                    border: '1px solid #a8d5b8',
                    color: '#1e5a32',
                    fontWeight: 600,
                    fontSize: '11.5px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => setShowQuickFarmModal(!showQuickFarmModal)}
                >
                  <Plus size={13} /> {showQuickFarmModal ? 'Cancel New Farm' : '+ Register New Farm'}
                </button>
              </label>

              {showQuickFarmModal && (
                <div style={{
                  background: '#f2f9f4',
                  border: '1.5px dashed #7fc497',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '10px',
                  marginTop: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12px', color: '#164828', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={13} /> Quick Register Farm & Assign Below
                    </strong>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#688d75', cursor: 'pointer', fontSize: '11px' }}
                      onClick={() => setShowQuickFarmModal(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#315c41', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Farm Name</label>
                      <input
                        type="text"
                        value={quickFarmName}
                        onChange={(e) => setQuickFarmName(e.target.value)}
                        placeholder="e.g. Rift View Farm"
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #b2dcbe', background: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#315c41', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Location (Kenya Hub)</label>
                      <input
                        type="text"
                        list="kenya-locations-list"
                        value={quickFarmLocation}
                        onChange={(e) => setQuickFarmLocation(e.target.value)}
                        placeholder="e.g. Eldoret, Kitale, Meru"
                        style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #b2dcbe', background: '#fff' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={busy || !quickFarmName.trim()}
                      onClick={handleQuickCreateFarm}
                      style={{
                        background: '#1e5a32',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Plus size={13} /> {busy ? 'Saving Farm...' : 'Save & Select Farm'}
                    </button>
                  </div>
                </div>
              )}

              <select
                value={selectedFarmId}
                onChange={(e) => {
                  if (e.target.value === '__REGISTER_NEW_FARM__') {
                    setShowQuickFarmModal(true);
                  } else {
                    setSelectedFarmId(e.target.value);
                  }
                }}
                required
              >
                {farms.length === 0 ? (
                  <option value="" disabled>No farms available — click "+ Register New Farm" above</option>
                ) : (
                  farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      🏡 {f.name} ({f.location || f.location_name || 'Kenya'})
                    </option>
                  ))
                )}
                <option value="__REGISTER_NEW_FARM__" style={{ fontWeight: 'bold', color: '#1e5a32', background: '#eef8f2' }}>
                  ➕ Register a New Farm...
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Field Name / Plot Identifier</label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. North Plot, Field A, Block 3"
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ margin: 0 }}>Crop Type</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCropActive(!customCropActive);
                      if (!customCropActive && !customCropName) setCustomCropName('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: customCropActive ? '#d97706' : '#1e5a32',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      padding: 0,
                      fontWeight: 600,
                      textDecoration: 'underline'
                    }}
                  >
                    {customCropActive ? '← Choose from list' : '+ Add missing crop'}
                  </button>
                </div>

                {customCropActive ? (
                  <div>
                    <input
                      type="text"
                      value={customCropName}
                      onChange={(e) => setCustomCropName(e.target.value)}
                      placeholder="Enter crop in English or Kiswahili (e.g. Avocado / Parachichi, Mahindi, Nyanya...)"
                      required={customCropActive}
                      autoFocus
                      style={{ borderColor: '#1e5a32' }}
                    />
                    {detectedCropInfo && (
                      <div style={{
                        background: '#f0f9f3',
                        border: '1px solid #b7e2c6',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        marginTop: '6px',
                        fontSize: '0.78rem',
                        color: '#1e5a32'
                      }}>
                        <span style={{ fontWeight: 700 }}>
                          🌐 Auto-detected ({detectedCropInfo.detected_language === 'sw' ? 'Kiswahili ➔ English' : 'English ➔ Kiswahili'}):
                        </span>{' '}
                        <strong>{detectedCropInfo.name_en}</strong> ↔ <strong>{detectedCropInfo.name_sw}</strong>
                        <span style={{ display: 'block', color: '#557563', fontSize: '0.72rem', marginTop: '2px' }}>
                          Category: {detectedCropInfo.category} · Water Demand: {detectedCropInfo.water_demand_level} (Kc: {detectedCropInfo.default_kc_mid})
                        </span>
                      </div>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      🌱 Will be automatically saved in the system catalog with FAO-56 crop parameters.
                    </small>
                  </div>
                ) : (
                  <select value={crop} onChange={(e) => setCrop(e.target.value)}>
                    {availableCrops && availableCrops.length > 0 ? (
                      availableCrops.map((c) => (
                        <option key={c.id || c.name} value={c.name.toLowerCase()}>
                          {c.display_name || `${c.name_en || c.name.charAt(0).toUpperCase() + c.name.slice(1)} (${c.name_sw || c.name})`}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="maize">Maize (Corn) / Mahindi</option>
                        <option value="french beans">French Beans / Maharagwe Mabichi</option>
                        <option value="tomatoes">Tomatoes / Nyanya</option>
                        <option value="potatoes">Irish Potatoes / Viazi Mviringo</option>
                        <option value="coffee">Coffee / Kahawa</option>
                        <option value="tea">Tea / Chai</option>
                        <option value="sukuma wiki">Sukuma Wiki (Collards)</option>
                        <option value="sorghum">Sorghum / Mtama</option>
                        <option value="cassava">Cassava / Muhogo</option>
                        <option value="avocado">Avocado / Parachichi</option>
                        <option value="banana">Banana / Ndizi</option>
                        <option value="onions">Onions / Vitunguu</option>
                        <option value="cabbage">Cabbage / Kabichi</option>
                      </>
                    )}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>Growth Stage</label>
                <select value={growthStage} onChange={(e) => setGrowthStage(e.target.value)}>
                  <option value="germination">Germination & Emergence</option>
                  <option value="vegetative">Vegetative Growth</option>
                  <option value="flowering">Flowering (Peak Water Sensitivity)</option>
                  <option value="grain_filling">Grain / Pod Filling</option>
                  <option value="maturity">Ripening & Maturity</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Soil Type</label>
                <select value={soilType} onChange={(e) => setSoilType(e.target.value)}>
                  <option value="loam">Loam (Optimal Retention)</option>
                  <option value="sandy_loam">Sandy Loam (Rapid Drainage)</option>
                  <option value="clay">Clay (High Water Holding)</option>
                  <option value="silty_clay">Silty Clay</option>
                  <option value="volcanic_ash">Volcanic Ash Loam (Mt Kenya/Rift)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Irrigation System</label>
                <select value={irrigationMethod} onChange={(e) => setIrrigationMethod(e.target.value)}>
                  <option value="drip">Drip Irrigation (High Efficiency 90%)</option>
                  <option value="sprinkler">Sprinkler / Overhead</option>
                  <option value="furrow">Furrow / Flood</option>
                  <option value="manual">Manual / Hose / Bucket</option>
                  <option value="rainfed">Pure Rainfed (No System)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Field Area (Acres)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={fieldArea}
                onChange={(e) => setFieldArea(e.target.value)}
              />
            </div>

            <button type="submit" className="submit-form-btn field-submit" disabled={busy}>
              <Sprout size={16} />
              <span>{busy ? 'Creating Field...' : 'Create Field & Activate Digital Twin'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Step 3: Existing Farm & Field Directory */}
      <section className="farm-directory-section">
        <div className="directory-header">
          <div>
            <h3>
              <Layers size={18} style={{ color: '#1e5a32' }} />
              <span>Registered Farm Fields ({fields.length})</span>
            </h3>
            <p>Click any field to switch active monitoring and decision context</p>
          </div>
          <button className="secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Holdings</span>
          </button>
        </div>

        <div className="field-cards-grid">
          {fields.map((f) => {
            const isSelected = f.id === currentFieldId;
            return (
              <div
                key={f.id}
                className={`field-inventory-card ${isSelected ? 'active-field-card' : ''}`}
                onClick={() => onSelectField(f.id)}
              >
                <div className="card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="crop-icon-box">
                      <Sprout size={20} color={isSelected ? '#1e5a32' : '#4b6b55'} />
                    </div>
                    <div>
                      <h4>{f.name}</h4>
                      <span className="field-location-text">{f.farm || 'Demonstration Farm'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    title={`Delete field "${f.name}"`}
                    onClick={(e) => handleDeleteField(e, f.id, f.name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ba39f',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9ba39f')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="card-chips">
                  <span className="chip crop-chip">🌱 {f.crop}</span>
                  <span className="chip stage-chip">📍 {f.growth_stage}</span>
                  <span className="chip soil-chip">🧱 {f.soil_type}</span>
                  <span className="chip method-chip">💧 {f.irrigation_method}</span>
                </div>

                <div className="card-bottom">
                  <span className="area-stat">{f.area || 1.0} acres</span>
                  {isSelected ? (
                    <span className="active-now-pill">
                      <CheckCircle size={13} /> Active Field
                    </span>
                  ) : (
                    <span className="select-action-link">
                      Switch to this field <ArrowRight size={13} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
