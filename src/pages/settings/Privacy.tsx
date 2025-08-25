import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import tcgraderLogo from '../../assets/tcgrader-logo.png';
import ApiService from '../../services/api';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  type: 'visibility' | 'data' | 'sharing';
}

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDataRequest, setShowDataRequest] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isRequestingData, setIsRequestingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [dataExportSuccess, setDataExportSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([
    // Visibility Settings
    {
      id: 'profile_public',
      title: 'Public Profile',
      description: 'Allow others to view your profile and collection statistics',
      enabled: true,
      type: 'visibility'
    },
    {
      id: 'collection_public',
      title: 'Public Collections',
      description: 'Show your collections in search results and community',
      enabled: false,
      type: 'visibility'
    },
    {
      id: 'activity_visible',
      title: 'Activity Visibility',
      description: 'Show your grading activity and achievements',
      enabled: true,
      type: 'visibility'
    },
    // Data Usage
    {
      id: 'analytics',
      title: 'Analytics & Improvements',
      description: 'Help improve TCGrader by sharing usage analytics',
      enabled: true,
      type: 'data'
    },
    {
      id: 'personalization',
      title: 'Personalized Experience',
      description: 'Use your data to personalize your experience',
      enabled: true,
      type: 'data'
    },
    // Sharing Settings
    {
      id: 'share_market_data',
      title: 'Share Market Data',
      description: 'Contribute anonymized data to market insights',
      enabled: true,
      type: 'sharing'
    },
    {
      id: 'share_grade_data',
      title: 'Share Grade Statistics',
      description: 'Help others by sharing anonymized grade results',
      enabled: false,
      type: 'sharing'
    }
  ]);

  const handleToggle = (id: string) => {
    setPrivacySettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const settingsObject = privacySettings.reduce((acc, setting) => {
        acc[setting.id] = setting.enabled;
        return acc;
      }, {} as Record<string, boolean>);
      
      await ApiService.updatePrivacySettings(settingsObject);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Failed to save privacy settings:', error);
      setError(error.response?.data?.message || 'Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataRequest = async () => {
    setIsRequestingData(true);
    setError(null);
    try {
      await ApiService.requestDataExport();
      setDataExportSuccess(true);
      setShowDataRequest(false);
      
      // Show success message for 5 seconds
      setTimeout(() => {
        setDataExportSuccess(false);
      }, 5000);
    } catch (error: any) {
      console.error('Failed to request data export:', error);
      setError(error.response?.data?.message || 'Failed to request data export. Please try again.');
    } finally {
      setIsRequestingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword) {
      setError('Please enter your password to confirm account deletion');
      return;
    }
    
    setIsDeletingAccount(true);
    setError(null);
    try {
      await ApiService.deleteAccount(deleteAccountPassword);
      // Logout user after successful deletion
      useAuthStore.getState().logout();
      navigate('/login');
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      setError(error.response?.data?.message || 'Failed to delete account. Please check your password and try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const groupedSettings = {
    visibility: privacySettings.filter(s => s.type === 'visibility'),
    data: privacySettings.filter(s => s.type === 'data'),
    sharing: privacySettings.filter(s => s.type === 'sharing')
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
              <h1 className="text-lg font-semibold text-gray-900">Privacy</h1>
            </div>
            <Link to="/profile">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-full pl-3 pr-1 py-1 hover:bg-gray-100 transition-all">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500">{user?.isPremium ? 'Premium' : 'Free'} Plan</p>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 pb-8 pt-20">
        <div className="mb-6">
          <p className="text-gray-600">
            Control how your information is used and shared
          </p>
        </div>

        {/* Profile Visibility */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Profile Visibility
          </h3>
          <div className="space-y-3">
            {groupedSettings.visibility.map(setting => (
              <div key={setting.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900">{setting.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(setting.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      setting.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Usage */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Data Usage
          </h3>
          <div className="space-y-3">
            {groupedSettings.data.map(setting => (
              <div key={setting.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900">{setting.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(setting.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      setting.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sharing */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Data Sharing
          </h3>
          <div className="space-y-3">
            {groupedSettings.sharing.map(setting => (
              <div key={setting.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900">{setting.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(setting.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      setting.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Message */}
        {dataExportSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-800">
              ✓ Data export requested successfully! You'll receive an email when your data is ready to download.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">
              {error}
            </p>
          </div>
        )}

        {/* Data Management */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
            Data Management
          </h3>
          
          <div className="space-y-3">
            {/* Download Data */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Download My Data</p>
                  <p className="text-sm text-gray-600 mt-1">Get a copy of your TCGrader data</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowDataRequest(true)}
                >
                  Request
                </Button>
              </div>
            </div>
            
            {/* Delete Account */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-600">Delete Account</p>
                  <p className="text-sm text-gray-600 mt-1">Permanently delete your account and data</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowDeleteAccount(true)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Policy Link */}
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-5 border border-primary-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Privacy Policy
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            Learn more about how we collect, use, and protect your data.
          </p>
          <a 
            href="https://tcgrader.com/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Read Privacy Policy →
          </a>
        </div>

        {/* Data Request Modal */}
        {showDataRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Your Data</h3>
              <p className="text-sm text-gray-600 mb-5">
                We'll prepare a download of your TCGrader data and email you when it's ready. This usually takes 24-48 hours.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  onClick={handleDataRequest}
                  className="flex-1"
                  loading={isRequestingData}
                  disabled={isRequestingData}
                >
                  Request Data
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDataRequest(false);
                    setError(null);
                  }}
                  className="flex-1"
                  disabled={isRequestingData}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteAccount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-red-600 mb-3">Delete Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone. All your data, collections, and grade history will be permanently deleted.
              </p>
              
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deleteAccountPassword}
                  onChange={(e) => setDeleteAccountPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Password"
                  disabled={isDeletingAccount}
                />
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setDeleteAccountPassword('');
                    setError(null);
                  }}
                  className="flex-1"
                  disabled={isDeletingAccount}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  loading={isDeletingAccount}
                  disabled={isDeletingAccount || !deleteAccountPassword}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100">
            <div className="max-w-md mx-auto">
              <Button 
                fullWidth 
                variant="primary" 
                onClick={handleSave}
                loading={isSaving}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyPage;