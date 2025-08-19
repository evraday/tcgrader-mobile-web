import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../store';
import authService from '../services/auth';
import apiService from '../services/api';
import Button from '../components/common/Button';
import { SUBSCRIPTION_LIMITS } from '../constants';
import { SubscriptionType } from '../types';
import tcgraderLogo from '../assets/tcgrader-logo.png';

interface CardData {
  _id: string;
  name: string;
  type: string;
  grades: {
    overall: number;
  };
  images: {
    frontUrl: string;
    backUrl: string;
  };
}

interface CardStats {
  totalCards: number;
  marketplaceListings: number;
  avgGrade: number;
}

interface CollectionData {
  _id: string;
  name: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [cards, setCards] = useState<CardData[]>([]);
  const [cardStats, setCardStats] = useState<CardStats>({
    totalCards: 0,
    marketplaceListings: 0,
    avgGrade: 0
  });
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch cards, collections, and marketplace listings in parallel
      const [cardsResponse, collectionsResponse, listingsResponse] = await Promise.all([
        apiService.getMyCards(),
        apiService.getCollections(),
        apiService.getMyListings()
      ]);
      
      const userCards = cardsResponse.cards || [];
      setCards(userCards);

      const userCollections = collectionsResponse || [];
      setCollections(userCollections);

      const userListings = listingsResponse?.listings || [];

      // Calculate stats
      const totalCards = userCards.length;
      const avgGrade = totalCards > 0 
        ? userCards.reduce((sum: number, card: CardData) => sum + ((card.grades && card.grades.overall) || 0), 0) / totalCards 
        : 0;
      
      const marketplaceListings = userListings.length;

      setCardStats({
        totalCards,
        marketplaceListings,
        avgGrade: Math.round(avgGrade * 10) / 10
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  if (!user) return null;

  const limits = SUBSCRIPTION_LIMITS[user.subscription?.type || 'free'];

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
            </Link>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-full pl-3 pr-1 py-1">
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
          </div>
        </div>
      </div>
      
      <div className="max-w-md mx-auto px-5 py-6 pb-8 pt-24">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img src={`https://www.tcgrader.com${user.avatar}`} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {(user.username || user.name).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {user.subscription?.type !== 'free' && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center border-3 border-white">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-1">{user.username || user.name}</h2>
            <p className="text-gray-600 mb-2">{user.email}</p>
            
            <div className="flex items-center space-x-2 mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                user.subscription?.type !== 'free' 
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {user.subscription?.type === 'merchant' ? 'Merchant' : user.subscription?.type || 'Free'} Member
              </div>
              {user.role === 'admin' && (
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                  Admin
                </div>
              )}
            </div>
            
            <Button fullWidth variant="secondary" className="hover:bg-gray-50">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Profile</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {cardStats.totalCards > 0 && (
                <span className="text-xs text-success-600 font-medium">Active</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? '...' : cardStats.totalCards.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Cards</p>
            {cardStats.avgGrade > 0 && (
              <p className="text-xs text-gray-500 mt-1">Avg: {cardStats.avgGrade}</p>
            )}
          </div>
          
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cardStats.marketplaceListings > 0 && (
                <span className="text-xs text-primary-600 font-medium">Active</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? '...' : cardStats.marketplaceListings.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Marketplace Listings</p>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Your Plan</h3>
            {user.subscription?.type !== 'free' ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-3xl font-bold">{user.credits || 0}</p>
              <p className="text-sm opacity-90">Credits Left</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{isLoading ? '...' : collections.length}</p>
              <p className="text-sm opacity-90">Collections</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white/20 rounded-xl mb-4">
            <span className="text-sm">Price Updates</span>
            <span className="text-sm font-semibold">
              {limits.priceTrackingInterval === 'realtime' ? 'Real-time' : 'Daily'}
            </span>
          </div>
          
          <Link to="/subscription">
            <Button fullWidth variant="secondary" className="bg-white text-primary-600 hover:bg-gray-50">
              {user.subscription?.type !== 'free' ? 'Manage Plan' : 'Upgrade to Premium'}
            </Button>
          </Link>
        </div>

        {/* Recent Cards Preview */}
        {cards.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Recent Cards</h3>
              <Link to="/collection" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {cards.slice(0, 3).map((card) => (
                <div key={card._id} className="relative">
                  <img 
                    src={card.images.frontUrl} 
                    alt={card.name}
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                    <p className="text-xs text-white font-medium truncate">{card.name}</p>
                    {card.grades && card.grades.overall && (
                      <p className="text-xs text-white/80">Grade: {card.grades.overall}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/collection" className="group">
              <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-primary-200 transition-colors">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">My Collection</p>
              </div>
            </Link>
            
            <Link to="/grades" className="group">
              <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all">
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-accent-200 transition-colors">
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">Grade History</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Preferences</h3>
          
          {/* Theme Selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">Appearance</label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  onClick={() => handleThemeChange(themeOption)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    theme === themeOption
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {themeOption === 'light' ? (
                    <svg className="w-6 h-6 text-yellow-500 mb-1 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : themeOption === 'dark' ? (
                    <svg className="w-6 h-6 text-gray-700 mb-1 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-primary-600 mb-1 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0-8a4 4 0 00-4 4m4-4a4 4 0 014 4" opacity="0.3" />
                    </svg>
                  )}
                  <span className="text-xs font-medium capitalize">{themeOption}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Link to="/settings/notifications" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Notifications</p>
                  <p className="text-xs text-gray-500">Alerts and updates</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link to="/settings/security" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Security</p>
                  <p className="text-xs text-gray-500">Password and authentication</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link to="/settings/privacy" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Privacy</p>
                  <p className="text-xs text-gray-500">Data and sharing preferences</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Support & Help */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Support</h3>
          <div className="space-y-2">
            <Link to="/help" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Help Center</p>
                  <p className="text-xs text-gray-500">FAQs and guides</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link to="/contact" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-accent-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Contact Support</p>
                  <p className="text-xs text-gray-500">Get help from our team</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <a href="https://tcgrader.com/terms" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Terms & Conditions</p>
                  <p className="text-xs text-gray-500">View our terms of service</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            
            <a href="https://tcgrader.com/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Privacy Policy</p>
                  <p className="text-xs text-gray-500">How we handle your data</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          fullWidth
          variant="secondary"
          onClick={handleLogout}
          className="mb-8 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300"
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </div>
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-gray-500">
          TCGrader v1.0.0 • © 2024 TCGrader
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;