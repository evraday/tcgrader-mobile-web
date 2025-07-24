import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../store';
import authService from '../services/auth';
import Button from '../components/common/Button';
import { SUBSCRIPTION_LIMITS } from '../constants';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  if (!user) return null;

  const limits = SUBSCRIPTION_LIMITS[user.subscription.type];

  return (
    <div className="min-h-screen px-4 py-8 safe-area-top">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Profile
        </h1>
      </header>

      {/* User Info */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-3xl font-semibold text-primary-600 dark:text-primary-400">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {user.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            <p className="text-sm text-primary-600 dark:text-primary-400 capitalize mt-1">
              {user.subscription.type} Plan
            </p>
          </div>
        </div>

        <Button fullWidth className="mt-4" variant="secondary">
          Edit Profile
        </Button>
      </div>

      {/* Subscription Info */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Subscription</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Plan</span>
            <span className="font-medium capitalize">{user.subscription.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Grades/Month</span>
            <span className="font-medium">
              {limits.gradesPerMonth === -1 ? 'Unlimited' : limits.gradesPerMonth}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Collections</span>
            <span className="font-medium">
              {limits.collectionsAllowed === -1 ? 'Unlimited' : limits.collectionsAllowed}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Price Updates</span>
            <span className="font-medium capitalize">
              {limits.priceTrackingInterval === 'realtime' ? 'Real-time' : limits.priceTrackingInterval}
            </span>
          </div>
        </div>
        <Link to="/subscription">
          <Button fullWidth className="mt-4">
            Manage Subscription
          </Button>
        </Link>
      </div>

      {/* Settings */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>
        
        {/* Theme Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as const).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => handleThemeChange(themeOption)}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  theme === themeOption
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-700'
                }`}
              >
                <span className="text-2xl block mb-1">
                  {themeOption === 'light' ? '☀️' : themeOption === 'dark' ? '🌙' : '🌓'}
                </span>
                <span className="text-sm capitalize">{themeOption}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Link to="/settings/notifications" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span>Notifications</span>
            <span className="text-gray-400">→</span>
          </Link>
          <Link to="/settings/security" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span>Security</span>
            <span className="text-gray-400">→</span>
          </Link>
          <Link to="/settings/privacy" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span>Privacy</span>
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      </div>

      {/* Support */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Support</h3>
        <div className="space-y-3">
          <Link to="/help" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span>Help Center</span>
            <span className="text-gray-400">→</span>
          </Link>
          <Link to="/contact" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span>Contact Support</span>
            <span className="text-gray-400">→</span>
          </Link>
          <Link to="/terms" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span>Terms & Privacy</span>
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      </div>

      {/* Logout */}
      <Button
        fullWidth
        variant="danger"
        onClick={handleLogout}
        className="mb-8"
      >
        Sign Out
      </Button>

      {/* App Version */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        TCGrader v1.0.0
      </p>
    </div>
  );
};

export default ProfilePage;