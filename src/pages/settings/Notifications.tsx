import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import Button from '../../components/common/Button';
import tcgraderLogo from '../../assets/tcgrader-logo.png';
import apiService from '../../services/api';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: 'grading' | 'marketing' | 'account' | 'community';
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize from user settings if available
  const getUserNotificationSettings = () => {
    const userSettings = user?.settings?.notifications;
    if (!userSettings) return null;
    
    return [
      // Email Notifications
      {
        id: 'grade_updates',
        title: 'Grade Updates',
        description: 'Get notified when your cards receive grades',
        enabled: userSettings.email?.gradeUpdates ?? true,
        category: 'grading' as const
      },
      {
        id: 'grade_status',
        title: 'Status Changes',
        description: 'Updates when card status changes (received, grading, shipped)',
        enabled: userSettings.email?.statusChanges ?? true,
        category: 'grading' as const
      },
      {
        id: 'grade_ready',
        title: 'Grades Ready',
        description: 'Alert when grades are ready for viewing',
        enabled: userSettings.email?.gradeReady ?? true,
        category: 'grading' as const
      },
      // Account Notifications
      {
        id: 'subscription_renewal',
        title: 'Subscription Renewal',
        description: 'Reminders before subscription renewal',
        enabled: userSettings.email?.subscriptionRenewal ?? true,
        category: 'account' as const
      },
      {
        id: 'payment_receipts',
        title: 'Payment Receipts',
        description: 'Email receipts for all transactions',
        enabled: userSettings.email?.paymentReceipts ?? true,
        category: 'account' as const
      },
      {
        id: 'security_alerts',
        title: 'Security Alerts',
        description: 'Notifications about account security',
        enabled: userSettings.email?.securityAlerts ?? true,
        category: 'account' as const
      },
      // Marketing Notifications
      {
        id: 'newsletter',
        title: 'Newsletter',
        description: 'Monthly newsletter with tips and updates',
        enabled: userSettings.email?.newsletter ?? false,
        category: 'marketing' as const
      },
      {
        id: 'promotions',
        title: 'Promotions & Offers',
        description: 'Special offers and discount codes',
        enabled: userSettings.email?.promotions ?? false,
        category: 'marketing' as const
      },
      {
        id: 'product_updates',
        title: 'Product Updates',
        description: 'New features and improvements',
        enabled: userSettings.email?.productUpdates ?? true,
        category: 'marketing' as const
      },
      // Community Notifications
      {
        id: 'price_alerts',
        title: 'Price Alerts',
        description: 'Notifications when card values change significantly',
        enabled: userSettings.email?.priceAlerts ?? true,
        category: 'community' as const
      },
      {
        id: 'collection_updates',
        title: 'Collection Activity',
        description: 'Updates on your public collections',
        enabled: userSettings.email?.collectionActivity ?? false,
        category: 'community' as const
      }
    ];
  };
  
  const [notifications, setNotifications] = useState<NotificationSetting[]>(
    getUserNotificationSettings() || [
    // Grading Notifications
    {
      id: 'grade_updates',
      title: 'Grade Updates',
      description: 'Get notified when your cards receive grades',
      enabled: true,
      category: 'grading'
    },
    {
      id: 'grade_status',
      title: 'Status Changes',
      description: 'Updates when card status changes (received, grading, shipped)',
      enabled: true,
      category: 'grading'
    },
    {
      id: 'grade_ready',
      title: 'Grades Ready',
      description: 'Alert when grades are ready for viewing',
      enabled: true,
      category: 'grading'
    },
    // Account Notifications
    {
      id: 'subscription_renewal',
      title: 'Subscription Renewal',
      description: 'Reminders before subscription renewal',
      enabled: true,
      category: 'account'
    },
    {
      id: 'payment_receipts',
      title: 'Payment Receipts',
      description: 'Email receipts for all transactions',
      enabled: true,
      category: 'account'
    },
    {
      id: 'security_alerts',
      title: 'Security Alerts',
      description: 'Notifications about account security',
      enabled: true,
      category: 'account'
    },
    // Marketing Notifications
    {
      id: 'newsletter',
      title: 'Newsletter',
      description: 'Monthly newsletter with tips and updates',
      enabled: false,
      category: 'marketing'
    },
    {
      id: 'promotions',
      title: 'Promotions & Offers',
      description: 'Special offers and discount codes',
      enabled: false,
      category: 'marketing'
    },
    {
      id: 'product_updates',
      title: 'Product Updates',
      description: 'New features and improvements',
      enabled: true,
      category: 'marketing'
    },
    // Community Notifications
    {
      id: 'price_alerts',
      title: 'Price Alerts',
      description: 'Notifications when card values change significantly',
      enabled: true,
      category: 'community'
    },
    {
      id: 'collection_updates',
      title: 'Collection Activity',
      description: 'Updates on your public collections',
      enabled: false,
      category: 'community'
    }
  ]);

  // Update notifications when user data changes
  useEffect(() => {
    const userSettings = getUserNotificationSettings();
    if (userSettings) {
      setNotifications(userSettings);
    }
  }, [user?.settings?.notifications]);

  const handleToggle = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert notifications array to API format
      const emailSettings = notifications.reduce((acc, notif) => {
        const key = notif.id.split('_').map((word, index) => 
          index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
        acc[key] = notif.enabled;
        return acc;
      }, {} as any);

      const settings = {
        email: emailSettings,
        push: user?.settings?.notifications?.push || {},
        sms: user?.settings?.notifications?.sms || {}
      };

      await apiService.updateNotificationSettings(settings);
      
      // Update local user state
      useAuthStore.getState().updateUser({
        settings: {
          ...user?.settings,
          notifications: settings
        }
      });
      
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      alert('Failed to save notification preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const groupedNotifications = {
    grading: notifications.filter(n => n.category === 'grading'),
    account: notifications.filter(n => n.category === 'account'),
    marketing: notifications.filter(n => n.category === 'marketing'),
    community: notifications.filter(n => n.category === 'community')
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
              <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
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

      <div className="max-w-md mx-auto px-5 py-6 pb-24 pt-20">
        <div className="mb-6">
          <p className="text-gray-600">
            Choose which notifications you'd like to receive
          </p>
        </div>

        {/* Grading Notifications */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Grading Updates
          </h3>
          <div className="space-y-3">
            {groupedNotifications.grading.map(notification => (
              <div key={notification.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(notification.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notification.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notification.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Notifications */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account Activity
          </h3>
          <div className="space-y-3">
            {groupedNotifications.account.map(notification => (
              <div key={notification.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(notification.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notification.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notification.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Marketing Notifications */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Updates & Offers
          </h3>
          <div className="space-y-3">
            {groupedNotifications.marketing.map(notification => (
              <div key={notification.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(notification.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notification.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notification.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Notifications */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Community & Market
          </h3>
          <div className="space-y-3">
            {groupedNotifications.community.map(notification => (
              <div key={notification.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(notification.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notification.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notification.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

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

export default NotificationsPage;