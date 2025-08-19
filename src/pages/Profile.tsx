import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../store';
import authService from '../services/auth';
import apiService from '../services/api';
import Button from '../components/common/Button';
import { SUBSCRIPTION_LIMITS } from '../constants';
import { SubscriptionType } from '../types';
import tcgraderLogo from '../assets/tcgrader-logo.png';
import ProfileImageEditor from '../components/profile/ProfileImageEditor';

interface CardData {
  _id: string;
  name: string;
  type: string;
  grades: {
    overall: number;
  };
  raw?: {
    frontUrl: string;
    backUrl: string;
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
  const { 
    theme, 
    setTheme, 
    backgroundImage, 
    backgroundType,
    backgroundPosition,
    backgroundScale,
    setBackgroundImage,
    setBackgroundPosition,
    setBackgroundScale 
  } = useUIStore();
  const [cards, setCards] = useState<CardData[]>([]);
  const [cardStats, setCardStats] = useState<CardStats>({
    totalCards: 0,
    marketplaceListings: 0,
    avgGrade: 0
  });
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showCardSelector, setShowCardSelector] = useState(false);
  const [tempBackgroundImage, setTempBackgroundImage] = useState<string | null>(null);
  const [tempBackgroundType, setTempBackgroundType] = useState<'upload' | 'card' | null>(null);
  const [tempPosition, setTempPosition] = useState({ x: 50, y: 50 });
  const [tempScale, setTempScale] = useState(1);
  const [showProfileImageEditor, setShowProfileImageEditor] = useState(false);

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

      // Check if collectionsResponse has a collections property or is an array directly
      const userCollections = collectionsResponse?.collections || collectionsResponse?.data || collectionsResponse || [];
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
      // Set empty arrays on error
      setCards([]);
      setCollections([]);
      setCardStats({
        totalCards: 0,
        marketplaceListings: 0,
        avgGrade: 0
      });
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

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setTempBackgroundImage(imageUrl);
        setTempBackgroundType('upload');
        setTempPosition({ x: 50, y: 50 });
        setTempScale(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCardSelect = (cardImage: string) => {
    setTempBackgroundImage(cardImage);
    setTempBackgroundType('card');
    setTempPosition({ x: 50, y: 50 });
    setTempScale(1);
    setShowCardSelector(false);
  };

  const handleSaveBackground = () => {
    setBackgroundImage(tempBackgroundImage, tempBackgroundType);
    setBackgroundPosition(tempPosition);
    setBackgroundScale(tempScale);
    setShowBackgroundModal(false);
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null, null);
    setBackgroundPosition({ x: 50, y: 50 });
    setBackgroundScale(1);
    setTempBackgroundImage(null);
    setTempBackgroundType(null);
    setShowBackgroundModal(false);
  };

  const handleProfileImageConfirm = async (imageData: string) => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Upload to API
      const result = await apiService.uploadAvatar(blob);
      
      // Update user profile in auth store
      const updatedUser = {
        ...user,
        avatar: result.avatarUrl
      };
      useAuthStore.setState({ user: updatedUser });
      
      // Close editor
      setShowProfileImageEditor(false);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  if (!user) return null;

  const subscriptionType = user.subscription?.type === 'merchant' 
    ? SubscriptionType.BUSINESS 
    : user.subscription?.type === 'collector'
    ? SubscriptionType.COLLECTOR
    : (user.subscription?.type as SubscriptionType) || SubscriptionType.FREE;
  const limits = SUBSCRIPTION_LIMITS[subscriptionType];

  return (
    <div className="min-h-screen bg-transparent">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/40 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
            </Link>
            <div className="flex items-center space-x-3 bg-gray-100 dark:bg-slate-700/50 rounded-full pl-3 pr-1 py-1 hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-all">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{user?.username || user?.name?.split(' ')[0]}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user?.subscription?.type || 'Free'} Plan</p>
              </div>
              {user?.avatar ? (
                <img 
                  src={`https://www.tcgrader.com${user.avatar}`} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {user?.username?.charAt(0) || user?.name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-md mx-auto px-5 py-6 pb-24 pt-24">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-1">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <button
                onClick={() => setShowProfileImageEditor(true)}
                className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center group relative overflow-hidden hover:from-primary-500 hover:to-primary-700 transition-all"
              >
                {user.avatar ? (
                  <img src={`https://www.tcgrader.com${user.avatar}`} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {(user.username || user.name).charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>
              {user.subscription?.type !== 'free' && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center border-3 border-white">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-1">{user.username || user.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
            
            <div className="flex items-center space-x-2 mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                user.subscription?.type !== 'free' 
                  ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white' 
                  : 'bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300'
              }`}>
                {user.subscription?.type === 'merchant' ? 'Merchant' : user.subscription?.type || 'Free'} Member
              </div>
              {user.role === 'admin' && (
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                  Admin
                </div>
              )}
            </div>
            
            <Link to="/profile/edit">
              <Button fullWidth variant="secondary" className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Profile</span>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-700/40">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {cardStats.totalCards > 0 && (
                <span className="text-xs text-success-600 font-medium">Active</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">
              {isLoading ? '...' : cardStats.totalCards.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Cards</p>
            {cardStats.avgGrade > 0 && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg: {cardStats.avgGrade}</p>
            )}
          </div>
          
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-700/40">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cardStats.marketplaceListings > 0 && (
                <span className="text-xs text-primary-600 font-medium">Active</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">
              {isLoading ? '...' : cardStats.marketplaceListings.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Marketplace Listings</p>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-2xl p-6 text-white mb-6">
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
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/20 rounded-xl">
              <span className="text-sm">Collection Limit</span>
              <span className="text-sm font-semibold">
                {limits.collectionsAllowed === -1 ? 'Unlimited' : `${limits.collectionsAllowed} collection${limits.collectionsAllowed !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/20 dark:bg-slate-800/20 rounded-xl">
              <span className="text-sm">Price Updates</span>
              <span className="text-sm font-semibold">
                {limits.priceTrackingInterval === 'realtime' ? 'Real-time' : limits.priceTrackingInterval === 'daily' ? 'Daily' : 'Not available'}
              </span>
            </div>
          </div>
          
          <Link to="/subscription">
            <Button fullWidth variant="secondary" className="bg-white dark:bg-slate-800/70 text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-slate-700/50">
              {user.subscription?.type !== 'free' ? 'Manage Plan' : 'Upgrade to Premium'}
            </Button>
          </Link>
        </div>

        {/* Recent Cards Preview */}
        {cards.length > 0 && (
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-700/40 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-200">Recent Cards</h3>
              <Link to="/collection" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {cards.slice(0, 3).map((card) => (
                <div key={card._id} className="relative">
                  <img 
                    src={card.images.frontUrl || card.raw?.frontUrl}
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
        <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-700/40 mb-6">
          <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/collection" className="group">
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mb-2 group-hover:bg-primary-200 dark:group-hover:bg-primary-800/30 transition-colors">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">My Collection</p>
              </div>
            </Link>
            
            <Link to="/grades" className="group">
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all">
                <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center mb-2 group-hover:bg-accent-200 dark:group-hover:bg-accent-800/30 transition-colors">
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Grade History</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-700/40 mb-6">
          <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-4">Preferences</h3>
          
          {/* Theme Selection */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Appearance</label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'system'] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  onClick={() => handleThemeChange(themeOption)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    theme === themeOption
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-slate-700/40 bg-white dark:bg-slate-800/70 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  {themeOption === 'light' ? (
                    <svg className="w-6 h-6 text-yellow-500 mb-1 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : themeOption === 'dark' ? (
                    <svg className="w-6 h-6 text-gray-700 dark:text-gray-300 mb-1 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Background Customization */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Background Image</label>
            <button
              onClick={() => {
                setTempBackgroundImage(backgroundImage);
                setTempBackgroundType(backgroundType);
                setTempPosition(backgroundPosition);
                setTempScale(backgroundScale);
                setShowBackgroundModal(true);
              }}
              className="w-full p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all group border-2 border-dashed border-gray-300 dark:border-slate-600"
            >
              {backgroundImage ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-slate-700">
                      <img 
                        src={backgroundImage} 
                        alt="Background" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        Custom Background
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {backgroundType === 'card' ? 'From Collection' : 'Uploaded Image'}
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ) : (
                <div className="text-center py-2">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Set Custom Background
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Upload an image or choose from your collection
                  </p>
                </div>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <Link to="/settings/notifications" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Notifications</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Alerts and updates</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link to="/settings/security" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Security</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Password and authentication</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link to="/settings/privacy" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Privacy</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Data and sharing preferences</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Support & Help */}
        <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-700/40 mb-6">
          <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-4">Support</h3>
          <div className="space-y-2">
            <Link to="/help" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Help Center</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">FAQs and guides</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <Link to="/contact" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-accent-100 dark:bg-accent-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Contact Support</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Get help from our team</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            <a href="https://tcgrader.com/terms" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Terms & Conditions</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">View our terms of service</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            
            <a href="https://tcgrader.com/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-all group">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">Privacy Policy</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">How we handle your data</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="mb-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700/40"
        >
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </div>
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-gray-600 dark:text-gray-400">
          TCGrader v1.0.0 • © 2024 TCGrader
        </p>
      </div>

      {/* Background Customization Modal */}
      {showBackgroundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-200">Custom Background</h2>
                <button
                  onClick={() => setShowBackgroundModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-200px)]">
              {!tempBackgroundImage && !showCardSelector && (
                <div className="space-y-4">
                  <button
                    onClick={() => document.getElementById('bg-upload')?.click()}
                    className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                  >
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Image</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">JPG, PNG up to 5MB</p>
                  </button>
                  
                  <button
                    onClick={() => setShowCardSelector(true)}
                    className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                  >
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose from Collection</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Select a card from your collection</p>
                  </button>
                  
                  <input
                    id="bg-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageUpload}
                    className="hidden"
                  />
                </div>
              )}
              
              {showCardSelector && (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowCardSelector(false)}
                    className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </button>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {cards.map((card) => (
                      <button
                        key={card._id}
                        onClick={() => handleCardSelect(card.images.frontUrl || card.raw?.frontUrl || '')}
                        className="aspect-[3/4] bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
                      >
                        <img 
                          src={card.images.frontUrl || card.raw?.frontUrl}
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {tempBackgroundImage && (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-gray-100 dark:bg-slate-700 rounded-xl overflow-hidden">
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${tempBackgroundImage})`,
                        backgroundPosition: `${tempPosition.x}% ${tempPosition.y}%`,
                        backgroundSize: tempScale > 1 ? `${tempScale * 100}%` : 'cover',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50/85 to-blue-50/85 dark:from-slate-900/85 dark:to-slate-800/85">
                      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-gray-800/10 to-transparent"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-slate-800/80 px-3 py-1 rounded-lg">
                        Preview
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Horizontal</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={tempPosition.x}
                            onChange={(e) => setTempPosition(prev => ({ ...prev, x: Number(e.target.value) }))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Vertical</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={tempPosition.y}
                            onChange={(e) => setTempPosition(prev => ({ ...prev, y: Number(e.target.value) }))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Scale: {tempScale}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={tempScale}
                        onChange={(e) => setTempScale(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <button
                      onClick={() => {
                        setTempBackgroundImage(null);
                        setTempBackgroundType(null);
                      }}
                      className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                      Choose Different Image
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-gray-200 dark:border-slate-700 space-y-3">
              {backgroundImage && (
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={handleRemoveBackground}
                  className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Remove Background
                </Button>
              )}
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowBackgroundModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveBackground}
                  disabled={!tempBackgroundImage}
                  className="flex-1"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Editor */}
      {showProfileImageEditor && (
        <ProfileImageEditor
          currentImage={user.avatar ? `https://www.tcgrader.com${user.avatar}` : undefined}
          onConfirm={handleProfileImageConfirm}
          onCancel={() => setShowProfileImageEditor(false)}
        />
      )}
    </div>
  );
};

export default ProfilePage;