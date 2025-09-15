import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import Button from '../components/common/Button';
import tcgraderLogo from '../assets/tcgrader-logo.png';
import apiService from '../services/api';
import { SUBSCRIPTION_LIMITS } from '../constants';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [, setScrollY] = useState(0);
  const [portfolioStats, setPortfolioStats] = useState({
    totalCards: 0,
    portfolioValue: 0,
    avgGrade: 0,
    isLoading: true
  });
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [topPerformersLoading, setTopPerformersLoading] = useState(true);
  const [publicStats, setPublicStats] = useState({
    totalCards: 0,
    graded9Plus: 0,
    totalValue: 0,
    isLoading: true
  });
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [recentGradesLoading, setRecentGradesLoading] = useState(true);

  // Get subscription limits based on user's subscription type
  const subscriptionType = user?.subscription?.type || user?.role || 'free';
  const subscriptionLimits = SUBSCRIPTION_LIMITS[subscriptionType] || SUBSCRIPTION_LIMITS.free;

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPortfolioData();
      fetchTopPerformers();
    } else {
      fetchPublicStats();
      fetchRecentGrades();
    }
  }, [isAuthenticated, user]);

  const fetchPortfolioData = async () => {
    try {
      const response = await apiService.getMyCards();
      const cards = response.cards || [];
      
      const totalCards = cards.length;
      const avgGrade = totalCards > 0 
        ? cards.reduce((sum: number, card: any) => sum + ((card.grades && card.grades.overall) || 0), 0) / totalCards 
        : 0;
      
      // Estimate portfolio value (150 per card as placeholder)
      const portfolioValue = totalCards * 150;
      
      setPortfolioStats({
        totalCards,
        portfolioValue,
        avgGrade: Math.round(avgGrade * 10) / 10,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      setPortfolioStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const fetchTopPerformers = async () => {
    try {
      setTopPerformersLoading(true);
      const response = await apiService.getTopPerformers('month');
      setTopPerformers(response.performers || []);
    } catch (error) {
      console.error('Failed to fetch top performers:', error);
      // Fallback data if API fails
      setTopPerformers([
        {
          id: '1',
          name: 'Pikachu Illustrator',
          grade: 'PSA 9',
          value: 375000,
          change: 45.2,
          image: '/api/placeholder/60/60',
          game: 'pokemon'
        },
        {
          id: '2',
          name: 'Black Lotus (Alpha)',
          grade: 'BGS 9.5',
          value: 45000,
          change: 22.8,
          image: '/api/placeholder/60/60',
          game: 'magic'
        },
        {
          id: '3',
          name: 'Michael Jordan Rookie',
          grade: 'PSA 10',
          value: 12500,
          change: 15.3,
          image: '/api/placeholder/60/60',
          game: 'sports'
        }
      ]);
    } finally {
      setTopPerformersLoading(false);
    }
  };

  const fetchPublicStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setPublicStats({
        totalCards: data.totalCards || 0,
        graded9Plus: (data.graded9Plus || 0) + (data.graded10 || 0),
        totalValue: (data.totalCards || 0) * 45, // Estimate total value
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch public stats:', error);
      setPublicStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const fetchRecentGrades = async () => {
    try {
      setRecentGradesLoading(true);
      const response = await fetch('/api/public/recent-grades');
      const data = await response.json();
      setRecentGrades(data.slice(0, 4)); // Get first 4 cards
    } catch (error) {
      console.error('Failed to fetch recent grades:', error);
    } finally {
      setRecentGradesLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {isAuthenticated ? (
        <>
          {/* Fixed Header */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 safe-area-top">
            <div className="max-w-md mx-auto px-5 py-3">
              <div className="flex items-center justify-between">
                <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
                <Link to="/profile">
                  <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 rounded-full pl-3 pr-1 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.username || user?.name?.split(' ')[0]}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.subscription?.type || 'Free'} Plan</p>
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
                </Link>
              </div>
            </div>
          </div>
          
          {/* Main Content with padding for fixed header */}
          <div className="max-w-md mx-auto px-5 py-6 pb-8 pt-24">
          
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.username || user?.name?.split(' ')[0]}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Here's your portfolio overview</p>
          </div>

          {/* Portfolio Analytics Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm dark:shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Portfolio Value</h3>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">Live</span>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline space-x-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {portfolioStats.isLoading ? '...' : `$${portfolioStats.portfolioValue.toLocaleString()}`}
                </h2>
                {!portfolioStats.isLoading && portfolioStats.portfolioValue > 0 && (
                  <div className="flex items-center text-success-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-sm font-semibold">12.5%</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Estimated portfolio value</p>
            </div>

            {/* Mini Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cards</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {portfolioStats.isLoading ? '...' : portfolioStats.totalCards.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Credits</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.credits || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg. Grade</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {portfolioStats.isLoading ? '...' : portfolioStats.avgGrade}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-3">
              <Link to="/collection" className="group">
                <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm hover:shadow-md dark:hover:shadow-xl transition-all text-center">
                  <div className="w-10 h-10 bg-primary-50 rounded-md flex items-center justify-center mx-auto mb-2 group-hover:bg-primary-100 transition-colors">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Collection</p>
                </div>
              </Link>

              <Link to="/grades/submit" className="group">
                <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm hover:shadow-md dark:hover:shadow-xl transition-all text-center">
                  <div className="w-10 h-10 bg-accent-50 rounded-md flex items-center justify-center mx-auto mb-2 group-hover:bg-accent-100 transition-colors">
                    <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Submit</p>
                </div>
              </Link>

              <Link to="/search" className="group">
                <div className="bg-white dark:bg-gray-800 rounded-md p-4 shadow-sm hover:shadow-md dark:hover:shadow-xl transition-all text-center">
                  <div className="w-10 h-10 bg-success-50 rounded-md flex items-center justify-center mx-auto mb-2 group-hover:bg-success-100 transition-colors">
                    <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Search</p>
                </div>
              </Link>

              <Link to="/grades" className="group">
                <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-center relative">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-gray-200 transition-colors">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-gray-700">Grades</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {user?.credits || 0}/{subscriptionLimits.gradesPerMonth === -1 ? '∞' : subscriptionLimits.gradesPerMonth}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Market Insights */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm dark:shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Market Insights</h3>
              <Link to="/market" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View All</Link>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                    <span className="text-sm">🔥</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Pokémon Cards</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Trending Up</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-success-600">+18.2%</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                    <span className="text-sm">✨</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Vintage MTG</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">High Demand</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-success-600">+25.7%</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <span className="text-sm">⚾</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sports Cards</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Stable</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600">+2.1%</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm dark:shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Recent Activity</h3>
              <Link to="/activity" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View All</Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-success-500 rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Charizard VMAX graded PSA 10</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Value increased by $450 • 2 hours ago</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Added 15 cards to collection</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pokémon Evolving Skies • 5 hours ago</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-accent-500 rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Price alert triggered</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Black Lotus reached $45,000 • 1 day ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm dark:shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Top Performers</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
            </div>
            
            <div className="space-y-3">
              {topPerformersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : topPerformers.length > 0 ? (
                topPerformers.slice(0, 3).map((performer) => (
                  <Link 
                    key={performer.id} 
                    to={`/cards/${performer.id}`}
                    className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md p-2 -m-2 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                        {performer.image ? (
                          <img 
                            src={performer.image.startsWith('http') ? performer.image : `https://www.tcgrader.com${performer.image}`}
                            alt={performer.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/api/placeholder/60/60';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                            <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{performer.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{performer.grade}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ${performer.value?.toLocaleString() || '0'}
                      </p>
                      <p className={`text-xs font-medium ${
                        performer.change > 0 ? 'text-success-600' : 'text-red-600'
                      }`}>
                        {performer.change > 0 ? '+' : ''}{performer.change}%
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No top performers data available</p>
                </div>
              )}
            </div>
            
            {topPerformers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link 
                  to="/market/top-performers" 
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center"
                >
                  View All Top Performers
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* Premium CTA for Free Users */}
          {user?.subscription?.type === 'free' && (
            <div className="bg-gray-900 dark:bg-primary-600 text-white rounded-lg p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Unlock Premium Features</h3>
              <p className="text-sm text-gray-300 mb-4">Get unlimited grades, advanced analytics, and priority support</p>
              <Link to="/subscription">
                <Button variant="secondary" size="md" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          )}
          </div>
        </>
      ) : (
        <div className="max-w-md mx-auto px-5 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12 mt-8">
            <img src={tcgraderLogo} alt="TCGrader" className="h-20 w-auto mx-auto mb-6 float-animation" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Professional Trading<br />Card Management
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Track, grade, and value your collection<br />with industry-leading tools
            </p>

            <div className="max-w-sm mx-auto">
              <Link to="/register" className="block mb-6">
                <Button fullWidth size="lg" variant="accent" className="shadow-lg">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login" className="block">
                <Button fullWidth size="lg" variant="primary">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Live Stats Banner */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-12 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 text-center text-gray-900 dark:text-gray-100">Platform Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">
                  {publicStats.isLoading ? '...' : publicStats.totalCards.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Cards Graded</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-600">
                  {publicStats.isLoading ? '...' : (() => {
                    const value = publicStats.totalValue;
                    if (value >= 1000000) {
                      return `$${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `$${Math.round(value / 1000)}K`;
                    } else {
                      return `$${value}`;
                    }
                  })()}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success-600">
                  {publicStats.isLoading ? '...' : `${Math.round((publicStats.graded9Plus / publicStats.totalCards) * 100)}%`}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">PSA 9+ Rate</p>
              </div>
            </div>
          </div>

          {/* Recently Graded Cards - Premium Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-2 uppercase tracking-widest">Live Feed</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recently Graded</h2>
            </div>

            {recentGradesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {recentGrades.map((card) => (
                  <div key={card._id} className="group cursor-pointer">
                    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-gray-700">
                      <div className="aspect-[3/4] relative overflow-hidden bg-gray-50 dark:bg-gray-900">
                        {card.images?.frontUrl ? (
                          <img
                            src={card.images.frontUrl}
                            alt={card.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/api/placeholder/300/400';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className={`absolute top-2 right-2 rounded-full px-3 py-1.5 shadow-md ${
                          card.grades?.overall >= 9 ? 'bg-green-600' :
                          card.grades?.overall >= 8 ? 'bg-blue-600' :
                          card.grades?.overall >= 7 ? 'bg-yellow-600' :
                          card.grades?.overall >= 6 ? 'bg-orange-600' :
                          'bg-red-600'
                        }`}>
                          <span className="text-xs font-bold text-white">
                            {card.grades?.overall ? card.grades.overall.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <p className="text-xs font-medium opacity-90">{card.type || 'Pokemon'}</p>
                          <p className="font-bold line-clamp-1">{card.name}</p>
                          <p className="text-xs opacity-80">{card.set}</p>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Grade</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(card.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`font-bold text-lg ${
                            card.grades?.overall >= 9 ? 'text-green-600 dark:text-green-500' :
                            card.grades?.overall >= 8 ? 'text-blue-600 dark:text-blue-500' :
                            card.grades?.overall >= 7 ? 'text-yellow-600 dark:text-yellow-500' :
                            card.grades?.overall >= 6 ? 'text-orange-600 dark:text-orange-500' :
                            'text-red-600 dark:text-red-500'
                          }`}>
                            {card.grades?.overall ? `${card.grades.overall.toFixed(1)}/10` : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            by {card.user?.username ?
                              (card.user.username.includes('@') ?
                                card.user.username.split('@')[0] :
                                card.user.username) :
                              'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Link to="/register" className="block">
                <Button variant="secondary" size="md" fullWidth>
                  View All Recently Graded
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid - Enhanced */}
          <div className="space-y-4 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-lg">AI-Powered Scanning</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Instantly identify and catalog cards with our advanced image recognition technology
                  </p>
                </div>
              </div>
            </div>


            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-success-100 rounded-lg flex-shrink-0">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 text-lg">Real-Time Market Data</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Track values with live pricing from major marketplaces and auction houses
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators - Enhanced */}
          <div className="text-center py-8 px-6 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6">Trusted by collectors worldwide</p>
            <div className="flex justify-center space-x-6 sm:space-x-12">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                  {publicStats.isLoading ? '...' : `${Math.round(publicStats.totalCards / 1000)}K+`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cards Graded</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-accent-600">
                  {publicStats.isLoading ? '...' : (() => {
                    const value = publicStats.totalValue;
                    if (value >= 1000000) {
                      return `$${(value / 1000000).toFixed(1)}M+`;
                    } else if (value >= 1000) {
                      return `$${Math.round(value / 1000)}K+`;
                    } else {
                      return `$${value}+`;
                    }
                  })()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Portfolio Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                  {publicStats.isLoading ? '...' : `${publicStats.graded9Plus.toLocaleString()}+`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PSA 9+ Cards</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;