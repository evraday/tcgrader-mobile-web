import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import apiService from '../services/api';
import Button from '../components/common/Button';
import tcgraderLogo from '../assets/tcgrader-logo.png';

interface Notification {
  _id: string;
  type: 'grade_complete' | 'price_alert' | 'collection_shared' | 'system' | 'promo';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    cardId?: string;
    cardName?: string;
    grade?: number;
    imageUrl?: string;
    actionUrl?: string;
    actionText?: string;
  };
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/api/notifications');
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Use mock data for development
      setNotifications([
        {
          _id: '1',
          type: 'grade_complete',
          title: 'Grade Received',
          message: 'Your Charizard VMAX received a PSA 10 grade!',
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: {
            cardName: 'Charizard VMAX',
            grade: 10,
            imageUrl: 'https://images.unsplash.com/photo-1679678691006-0ad24fecb769?w=400',
            actionUrl: '/grades/123',
            actionText: 'View Grade'
          }
        },
        {
          _id: '2',
          type: 'price_alert',
          title: 'Price Alert',
          message: 'Black Lotus increased by 15% to $45,000',
          read: false,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          metadata: {
            cardName: 'Black Lotus',
            actionUrl: '/market/black-lotus',
            actionText: 'View Card'
          }
        },
        {
          _id: '3',
          type: 'collection_shared',
          title: 'Collection Shared',
          message: 'John Doe shared their "Vintage Pokemon" collection with you',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            actionUrl: '/collection/shared/456',
            actionText: 'View Collection'
          }
        },
        {
          _id: '4',
          type: 'system',
          title: 'System Update',
          message: 'New grading options are now available for Japanese cards',
          read: true,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '5',
          type: 'promo',
          title: 'Special Offer',
          message: 'Get 20% off bulk grading this week only!',
          read: false,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            actionUrl: '/subscription',
            actionText: 'View Offer'
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiService.delete(`/api/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const deleteSelected = async () => {
    try {
      await Promise.all(
        Array.from(selectedNotifications).map(id =>
          apiService.delete(`/api/notifications/${id}`)
        )
      );
      setNotifications(prev => 
        prev.filter(n => !selectedNotifications.has(n._id))
      );
      setSelectedNotifications(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Failed to delete notifications:', error);
    }
  };

  const toggleSelection = (notificationId: string) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'grade_complete':
        return (
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'price_alert':
        return (
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        );
      case 'collection_shared':
        return (
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.114 16.938 18 17.482 18 18c0 .482.114.938.316 1.342m0-2.684a3 3 0 110 2.684M15 12a3 3 0 11-6 0 3 3 0 016 0zm6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'promo':
        return (
          <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return then.toLocaleDateString();
  };

  const filteredNotifications = notifications
    .filter(n => filter === 'all' || !n.read)
    .filter(n => selectedType === 'all' || n.type === selectedType);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-transparent">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/40 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
            </Link>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-600 text-xs font-medium rounded-full">
                  {unreadCount} new
                </span>
              )}
              {isSelectionMode ? (
                <button
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedNotifications(new Set());
                  }}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 pb-24 pt-24">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Stay updated with your card activities</p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Read/Unread Filter */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-800/70 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700/40'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
                filter === 'unread'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-800/70 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700/40'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex overflow-x-auto space-x-2 scrollbar-hide">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedType === 'all'
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedType('grade_complete')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedType === 'grade_complete'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300'
              }`}
            >
              Grades
            </button>
            <button
              onClick={() => setSelectedType('price_alert')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedType === 'price_alert'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300'
              }`}
            >
              Price Alerts
            </button>
            <button
              onClick={() => setSelectedType('collection_shared')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedType === 'collection_shared'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300'
              }`}
            >
              Collections
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        {(unreadCount > 0 || selectedNotifications.size > 0) && (
          <div className="mb-4 flex items-center justify-between">
            {selectedNotifications.size > 0 ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedNotifications.size} selected
                </span>
                <button
                  onClick={deleteSelected}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Delete Selected
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {unreadCount} unread
                </span>
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Mark all as read
                </button>
              </>
            )}
          </div>
        )}

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800/70 rounded-2xl p-4 animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-slate-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No notifications</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {filter === 'unread' ? 'All caught up!' : 'You\'re all set'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => !notification.read && markAsRead(notification._id)}
                className={`relative bg-white dark:bg-slate-800/70 rounded-2xl p-4 shadow-sm border transition-all ${
                  notification.read
                    ? 'border-gray-200 dark:border-slate-700/40'
                    : 'border-primary-200 dark:border-primary-700/40 bg-primary-50/20 dark:bg-primary-900/10'
                } ${isSelectionMode ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div
                      className="mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(notification._id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedNotifications.has(notification._id)}
                        onChange={() => {}}
                        className="w-5 h-5 text-primary-600 rounded border-gray-300 dark:border-slate-600 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  {/* Icon */}
                  {getNotificationIcon(notification.type)}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-200">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        
                        {/* Card Preview for Grade Notifications */}
                        {notification.metadata?.imageUrl && (
                          <div className="mt-3 relative w-20 h-28 rounded-lg overflow-hidden shadow-sm">
                            <img
                              src={notification.metadata.imageUrl}
                              alt={notification.metadata.cardName}
                              className="w-full h-full object-cover"
                            />
                            {notification.metadata.grade && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-xs text-white font-bold">
                                  PSA {notification.metadata.grade}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Action Button */}
                        {notification.metadata?.actionUrl && (
                          <Link
                            to={notification.metadata.actionUrl}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                          >
                            {notification.metadata.actionText || 'View'}
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        )}
                      </div>
                      
                      {/* Delete Button */}
                      {!isSelectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Unread Indicator */}
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-primary-600 rounded-full" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Settings Link */}
        <div className="mt-8 text-center">
          <Link
            to="/settings/notifications"
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Notification Settings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;