import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Mail,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Save,
  Globe,
  Sprout,
  Activity,
  Layers
} from 'lucide-react';
import {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  UserProfileResponse
} from '../lib/api';

interface UserProfileViewProps {
  onProfileUpdated?: (updatedUser: any) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onProfileUpdated }) => {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Profile Edit State
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('en');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUserProfile();
      setProfile(data);
      setName(data.user.name || '');
      setLanguage(data.user.language || 'en');
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a valid name.');
      return;
    }
    setSavingProfile(true);
    setProfileSuccessMsg('');
    setError('');
    try {
      const res = await updateUserProfile({
        name: name.trim(),
        language
      });
      setProfileSuccessMsg('Profile updated successfully.');
      if (profile) {
        setProfile({
          ...profile,
          user: {
            ...profile.user,
            name: name.trim(),
            language
          }
        });
      }
      try {
        const stored = localStorage.getItem('agriguide_user');
        if (stored) {
          const userObj = JSON.parse(stored);
          userObj.name = name.trim();
          userObj.language = language;
          localStorage.setItem('agriguide_user', JSON.stringify(userObj));
        }
      } catch {}
      if (onProfileUpdated) {
        onProfileUpdated(res.user);
      }
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await changeUserPassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordSuccessMsg('Password updated successfully! You can now use it on next sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccessMsg(''), 5000);
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="view-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#52755e' }}>Loading account details...</p>
      </div>
    );
  }

  const isAdmin = profile?.user.role?.toUpperCase() === 'ADMIN';

  return (
    <div className="view-container">
      {/* Page Header */}
      <div className="view-header">
        <div>
          <div className="badge-row" style={{ marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: isAdmin ? '#e8f4ec' : '#f2f4f8',
                color: isAdmin ? '#1e5a32' : '#334155',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                border: isAdmin ? '1px solid #b7e0c5' : '1px solid #cbd5e1'
              }}
            >
              {isAdmin ? <ShieldCheck size={13} /> : <User size={13} />}
              {isAdmin ? 'SYSTEM ADMINISTRATOR' : 'REGISTERED FARMER'}
            </span>
          </div>
          <h2>My Account & Farmer Profile</h2>
          <p className="subtitle">
            Manage your personal credentials, contact email, preferences, and secure account password.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fdf2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Account Overview Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #d9e6dc',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isAdmin ? '#1e5a32' : '#0f52ba',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 700
            }}
          >
            {profile?.user.name ? profile.user.name[0].toUpperCase() : 'U'}
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#163b22', fontWeight: 700 }}>
                {profile?.user.name}
              </h3>
              {isAdmin && (
                <span
                  style={{
                    background: '#e8f4ec',
                    color: '#1e5a32',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #c2e2cc'
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <div style={{ color: '#52755e', fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} />
              <span>{profile?.user.email}</span>
            </div>
            <div style={{ color: '#7a9684', fontSize: '12px', marginTop: '4px' }}>
              Account ID: <code>{profile?.user.id}</code> ·{' '}
              {profile?.user.created_at && (
                <span>Member since {new Date(profile.user.created_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ background: '#f8faf8', padding: '10px 16px', borderRadius: '6px', border: '1px solid #e2ede5', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#5a7864', fontWeight: 600 }}>FARMS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#163b22' }}>{profile?.stats.total_farms || 0}</div>
            </div>
            <div style={{ background: '#f8faf8', padding: '10px 16px', borderRadius: '6px', border: '1px solid #e2ede5', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#5a7864', fontWeight: 600 }}>FIELDS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f52ba' }}>{profile?.stats.total_fields || 0}</div>
            </div>
            <div style={{ background: '#f8faf8', padding: '10px 16px', borderRadius: '6px', border: '1px solid #e2ede5', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#5a7864', fontWeight: 600 }}>DECISIONS</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#8e4b10' }}>{profile?.stats.total_decisions || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Card 1: Edit Profile Information */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #d9e6dc',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #edf2ee', paddingBottom: '10px' }}>
            <User size={18} color="#1e5a32" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#163b22', fontWeight: 700 }}>
              Edit Profile Details
            </h3>
          </div>

          {profileSuccessMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ebf5ee',
                color: '#1e5a32',
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#274b34', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced8d1',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#274b34', marginBottom: '6px' }}>
                Email Address (Account Identifier)
              </label>
              <input
                type="email"
                value={profile?.user.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e5e2',
                  background: '#f8faf9',
                  color: '#667d6e',
                  fontSize: '14px',
                  cursor: 'not-allowed'
                }}
              />
              <small style={{ fontSize: '11px', color: '#7a9684', marginTop: '4px', display: 'block' }}>
                Your email address is your fixed tenant identifier across AgriGuide.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#274b34', marginBottom: '6px' }}>
                Preferred Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced8d1',
                  fontSize: '14px',
                  background: '#ffffff'
                }}
              >
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: 600
              }}
            >
              <Save size={16} />
              <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Card 2: Security & Change Password */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #d9e6dc',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #edf2ee', paddingBottom: '10px' }}>
            <KeyRound size={18} color="#1e5a32" />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#163b22', fontWeight: 700 }}>
              Change Account Password
            </h3>
          </div>

          {passwordSuccessMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ebf5ee',
                color: '#1e5a32',
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#fdf2f2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '13px'
              }}
            >
              <AlertCircle size={16} />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#274b34', marginBottom: '6px' }}>
                Current Password
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced8d1',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#274b34', marginBottom: '6px' }}>
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced8d1',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#274b34', marginBottom: '6px' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced8d1',
                  fontSize: '14px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                fontSize: '13.5px',
                fontWeight: 600
              }}
            >
              <Lock size={16} />
              <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
