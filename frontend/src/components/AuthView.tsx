import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Lock,
  Mail,
  User,
  MapPin,
  Droplets,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Compass,
  Layers,
  Leaf
} from 'lucide-react';
import {
  loginUser,
  registerUser,
  demoLogin,
  adminLogin,
  getKenyaLocations,
  getCrops,
  detectCrop,
  CropItem,
  setAuthToken,
  AuthResponse
} from '../lib/api';

interface AuthViewProps {
  onAuthSuccess: (authData: AuthResponse) => void;
  onBackToLanding?: () => void;
  initialMode?: 'signin' | 'register';
}

const POPULAR_LOCATIONS = [
  'Kutus, Kirinyaga',
  'Eldoret, Uasin Gishu',
  'Nanyuki, Laikipia',
  'Naivasha, Nakuru',
  'Kitale, Trans Nzoia',
  'Mwea, Kirinyaga',
  'Thika, Kiambu',
  'Embu, Embu'
];

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  onBackToLanding,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode === 'register' ? 'register' : 'signin');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Sign In Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFarmName, setRegFarmName] = useState('');
  const [regLocation, setRegLocation] = useState('Kutus, Kirinyaga County, Kenya');
  const [regCrop, setRegCrop] = useState('maize');
  const [customCropActive, setCustomCropActive] = useState(false);
  const [customCropName, setCustomCropName] = useState('');
  const [availableCrops, setAvailableCrops] = useState<CropItem[]>([]);
  const [detectedCropInfo, setDetectedCropInfo] = useState<any>(null);
  const [regWaterAvailability, setRegWaterAvailability] = useState('LIMITED');

  // Kenya locations for auto-complete datalist
  const [kenyaLocations, setKenyaLocations] = useState<Array<{ name: string; key: string }>>([]);

  useEffect(() => {
    getKenyaLocations()
      .then((data) => {
        if (Array.isArray(data)) {
          setKenyaLocations(data);
        }
      })
      .catch(() => {});

    getCrops()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableCrops(data);
        }
      })
      .catch(() => {});
  }, []);

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please provide both your email address and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await loginUser({
        email: loginEmail,
        password: loginPassword
      });
      setAuthToken(res.access_token);
      try {
        localStorage.setItem('agriguide_user', JSON.stringify(res.user));
      } catch {}
      onAuthSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in your name, email, and password.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    const finalCrop = customCropActive
      ? (customCropName.trim().toLowerCase() || 'maize')
      : regCrop;

    setError('');
    setLoading(true);
    try {
      const res = await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        farm_name: regFarmName.trim() || `${regName.trim()}'s Shamba`,
        location_name: regLocation,
        water_availability: regWaterAvailability,
        initial_crop: finalCrop,
        language: 'en'
      });
      setAuthToken(res.access_token);
      try {
        localStorage.setItem('agriguide_user', JSON.stringify(res.user));
      } catch {}
      onAuthSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setDemoLoading(true);
    try {
      const res = await demoLogin();
      setAuthToken(res.access_token);
      try {
        localStorage.setItem('agriguide_user', JSON.stringify(res.user));
      } catch {}
      onAuthSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Could not load demo farmer account.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleAdminSignIn = async () => {
    setError('');
    setDemoLoading(true);
    try {
      const res = await adminLogin();
      setAuthToken(res.access_token);
      try {
        localStorage.setItem('agriguide_user', JSON.stringify(res.user));
      } catch {}
      onAuthSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Could not load administrator account.');
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode === 'register' ? 'register' : 'signin');
    }
  }, [initialMode]);

  return (
    <div className="auth-container">
      {/* Background decoration */}
      <div className="auth-backdrop-accent" />

      <div className="auth-box">
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="auth-back-to-landing-btn"
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: 'none',
              color: '#2d6a4f',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '12px',
              padding: '4px 0'
            }}
          >
            ← Back to AgriGuide Overview
          </button>
        )}
        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Sprout size={32} />
          </div>
          <h1>AgriGuide</h1>
          <p className="auth-subtitle">Sign in or create your farm account</p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setMode('signin');
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Sign In */}
        {mode === 'signin' && (
          <form className="auth-form" onSubmit={handleSignIn}>
            <div className="form-group">
              <label htmlFor="login-email">
                <Mail size={15} />
                <span>Email Address</span>
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="edwin@kilimobora.co.ke"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">
                <Lock size={15} />
                <span>Password</span>
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-primary-btn" disabled={loading || demoLoading}>
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {/* Quick Direct Access */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #e1e8e3', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={handleDemoSignIn}
                disabled={loading || demoLoading}
                style={{
                  width: '100%',
                  background: '#eaf5ee',
                  border: '1px solid #bce2c7',
                  color: '#1e5a32',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Sprout size={16} />
                <span>1-Click Demo Shamba</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Register & Shamba Onboarding */}
        {mode === 'register' && (
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-section-divider">
              <User size={15} />
              <span>1. FARMER CREDENTIALS</span>
            </div>

            <div className="form-group">
              <label htmlFor="reg-name">
                <User size={15} />
                <span>Full Name</span>
              </label>
              <input
                id="reg-name"
                type="text"
                placeholder="Grace Wanjiku"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="reg-email">
                  <Mail size={15} />
                  <span>Email Address</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="grace@wanjikuhighlands.co.ke"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">
                  <Lock size={15} />
                  <span>Password</span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-section-divider">
              <Sprout size={15} />
              <span>2. SHAMBA & FIELD TWIN SETUP</span>
            </div>

            <div className="form-group">
              <label htmlFor="reg-farm-name">
                <Layers size={15} />
                <span>Farm Name</span>
              </label>
              <input
                id="reg-farm-name"
                type="text"
                placeholder="e.g. Wanjiku Highlands Shamba"
                value={regFarmName}
                onChange={(e) => setRegFarmName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-location">
                <MapPin size={15} />
                <span>Farm Location (All 81 Kenya Agricultural Hubs Supported)</span>
              </label>
              <input
                id="reg-location"
                list="kenya-locations-list"
                type="text"
                placeholder="Type or select: e.g. Eldoret, Uasin Gishu"
                value={regLocation}
                onChange={(e) => setRegLocation(e.target.value)}
                required
              />
              <datalist id="kenya-locations-list">
                {kenyaLocations.map((loc) => (
                  <option key={loc.key || loc.name} value={loc.name} />
                ))}
              </datalist>

              <div className="quick-location-chips">
                <span className="chips-label">Popular:</span>
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    className="location-chip-btn"
                    onClick={() => setRegLocation(loc)}
                  >
                    {loc.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label htmlFor="reg-crop" style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                    <Leaf size={15} />
                    <span>Initial Crop</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomCropActive(!customCropActive);
                      if (!customCropActive) setCustomCropName('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1e5a32',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    {customCropActive ? 'Choose from list' : '+ Add missing crop'}
                  </button>
                </div>

                {customCropActive ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Enter crop name in English or Kiswahili (e.g. Avocado / Parachichi, Mahindi, Nyanya...)"
                      value={customCropName}
                      onChange={(e) => setCustomCropName(e.target.value)}
                      required
                      autoFocus
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
                  </div>
                ) : (
                  <select
                    id="reg-crop"
                    value={regCrop}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setCustomCropActive(true);
                        setCustomCropName('');
                      } else {
                        setRegCrop(e.target.value);
                      }
                    }}
                  >
                    {availableCrops.length > 0 ? (
                      availableCrops.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
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
                        <option value="cabbage">Cabbage / Kabichi</option>
                        <option value="onions">Onions / Vitunguu</option>
                        <option value="avocado">Avocado / Parachichi</option>
                        <option value="banana">Banana / Ndizi</option>
                      </>
                    )}
                    <option value="__custom__">+ Other / Custom Crop...</option>
                  </select>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reg-water">
                  <Droplets size={15} />
                  <span>Water Reserve</span>
                </label>
                <select
                  id="reg-water"
                  value={regWaterAvailability}
                  onChange={(e) => setRegWaterAvailability(e.target.value)}
                >
                  <option value="RELIABLE">Reliable (River / Borehole)</option>
                  <option value="LIMITED">Limited (Tank / Storage)</option>
                  <option value="HIGHLY_LIMITED">Highly Limited (Scarcity / Rationed)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="auth-primary-btn" disabled={loading || demoLoading}>
              {loading ? (
                <span>Configuring Field Twin & Weather...</span>
              ) : (
                <>
                  <span>Create Account & Launch Shamba Twin</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
