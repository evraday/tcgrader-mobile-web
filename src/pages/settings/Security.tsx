import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import tcgraderLogo from '../../assets/tcgrader-logo.png';
import apiService from '../../services/api';

interface SecuritySession {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
}

const SecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    user?.settings?.security?.twoFactorEnabled || false
  );
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    // Initialize 2FA state from user settings
    if (user?.settings?.security?.twoFactorEnabled !== undefined) {
      setTwoFactorEnabled(user.settings.security.twoFactorEnabled);
    }
    
    // Fetch active sessions
    fetchActiveSessions();
  }, [user]);

  const fetchActiveSessions = async () => {
    try {
      // For now, use mock data as the API endpoint might not exist yet
      const mockSessions: SecuritySession[] = [
    {
      id: '1',
      device: 'iPhone 14 Pro',
      browser: 'Safari',
      location: 'San Francisco, CA',
      lastActive: 'Active now',
      current: true
    },
    {
      id: '2',
      device: 'MacBook Pro',
      browser: 'Chrome',
      location: 'San Francisco, CA',
      lastActive: '2 hours ago',
      current: false
    },
    {
      id: '3',
      device: 'iPad Air',
      browser: 'Safari',
      location: 'Los Angeles, CA',
      lastActive: '3 days ago',
      current: false
    }];
      setSessions(mockSessions);
      setSessionsLoading(false);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessionsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const errors: Record<string, string> = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await apiService.updateSecuritySettings({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      alert('Password updated successfully!');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      if (error.response?.data?.message) {
        setPasswordErrors({ currentPassword: error.response.data.message });
      } else {
        alert('Failed to update password. Please try again.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (passwordErrors[e.target.name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [e.target.name]: ''
      }));
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    // TODO: Call API to revoke session
    console.log('Revoking session:', sessionId);
  };

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Security</h1>
            </div>
            <Link to="/profile">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-full pl-3 pr-1 py-1 hover:bg-gray-100 transition-all">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.username || user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.subscription?.type || 'Free'} Plan</p>
                </div>
                {user?.avatar ? (
                  <img 
                    src={`https://www.tcgrader.com${user.avatar}`} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-700">
                      {user?.username?.charAt(0) || user?.name?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 pb-8 pt-20">
        {/* Password Section */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Password
          </h3>
          
          {!showPasswordForm ? (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {user?.settings?.security?.passwordLastChanged 
                      ? `Last changed ${new Date(user.settings.security.passwordLastChanged).toLocaleDateString()}`
                      : 'Last changed: Unknown'
                    }
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Change
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="bg-white rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <Input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInput}
                  error={passwordErrors.currentPassword}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <Input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInput}
                  error={passwordErrors.newPassword}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInput}
                  error={passwordErrors.confirmPassword}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isChangingPassword}
                  className="flex-1"
                >
                  Update Password
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordErrors({});
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Two-Factor Authentication */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
            Two-Factor Authentication
          </h3>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600 mt-1">
                  {twoFactorEnabled 
                    ? 'Extra security for your account' 
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
              <button
                onClick={async () => {
                  const newValue = !twoFactorEnabled;
                  
                  if (newValue) {
                    // Enable 2FA - show setup
                    setShowTwoFactorSetup(true);
                  } else {
                    // Disable 2FA
                    try {
                      await apiService.updateSecuritySettings({
                        twoFactorEnabled: false
                      });
                      setTwoFactorEnabled(false);
                      
                      // Update the user state properly
                      const updatedUser = {
                        ...user,
                        settings: {
                          ...user?.settings,
                          security: {
                            ...user?.settings?.security,
                            twoFactorEnabled: false
                          }
                        }
                      };
                      useAuthStore.getState().updateUser(updatedUser);
                    } catch (error) {
                      console.error('Failed to disable 2FA:', error);
                      alert('Failed to disable 2FA. Please try again.');
                      // Revert the state if API call fails
                      setTwoFactorEnabled(true);
                    }
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
                aria-label="Toggle two-factor authentication"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          
          {showTwoFactorSetup && !twoFactorEnabled && (
            <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-900 mb-3">
                To enable two-factor authentication, you'll need to scan a QR code with your authenticator app.
              </p>
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  try {
                    // In a real app, this would involve QR code scanning and verification
                    await apiService.updateSecuritySettings({
                      twoFactorEnabled: true
                    });
                    setTwoFactorEnabled(true);
                    setShowTwoFactorSetup(false);
                    
                    // Update the user state properly
                    const updatedUser = {
                      ...user,
                      settings: {
                        ...user?.settings,
                        security: {
                          ...user?.settings?.security,
                          twoFactorEnabled: true
                        }
                      }
                    };
                    useAuthStore.getState().updateUser(updatedUser);
                    alert('Two-factor authentication has been enabled!');
                  } catch (error) {
                    console.error('Failed to enable 2FA:', error);
                    alert('Failed to enable 2FA. Please try again.');
                    // Revert the state if API call fails
                    setTwoFactorEnabled(false);
                    setShowTwoFactorSetup(false);
                  }
                }}
              >
                Set Up 2FA
              </Button>
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Active Sessions
          </h3>
          
          <div className="space-y-3">
            {sessionsLoading ? (
              <div className="text-center py-4 text-gray-500">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No active sessions found</div>
            ) : (
              sessions.map(session => (
              <div key={session.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{session.device}</p>
                      {session.current && (
                        <span className="text-xs bg-success-100 text-success-700 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {session.browser} • {session.location}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{session.lastActive}</p>
                  </div>
                  {!session.current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))
            )}
          </div>
          
          <button className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium">
            Sign out of all other sessions
          </button>
        </div>

        {/* Security Tips */}
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-5 border border-primary-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Security Tips
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <svg className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Use a unique, strong password for your account</span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Enable two-factor authentication for extra security</span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Review active sessions regularly</span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Never share your password with anyone</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;