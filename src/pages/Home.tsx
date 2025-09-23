import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import Button from '../components/common/Button';
import tcgraderLogo from '../assets/tcgrader-logo.png';
import apiService from '../services/api';
import { SUBSCRIPTION_LIMITS } from '../constants';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [, setScrollY] = useState(0);
  const [portfolioStats, setPortfolioStats] = useState({
    totalCards: 0,
    portfolioValue: 0,
    avgGrade: 0,
    monthlyChange: 0,
    weeklyChange: 0,
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
  const [portfolioHistory, setPortfolioHistory] = useState<any[]>([]);
  const [cardsHistory, setCardsHistory] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [marketInsights, setMarketInsights] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | '365d'>('30d');

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
      fetchPortfolioStats();
      fetchPortfolioHistory();
      fetchActivityHistory();
      fetchRecentActivityFeed();
      fetchTopPerformingCards();
      fetchUserCredits();
      fetchMarketInsights();
    } else {
      fetchPublicStats();
      fetchRecentGrades();
    }
  }, [isAuthenticated, user]);

  // Fetch portfolio statistics
  const fetchPortfolioStats = async () => {
    try {
      const response = await fetch('/api/user/portfolio/stats');
      const data = await response.json();
      
      setPortfolioStats({
        totalCards: data.totalCards || 0,
        portfolioValue: data.portfolioValue || 0,
        avgGrade: data.avgGrade || 0,
        monthlyChange: data.monthlyChange || 0,
        weeklyChange: data.weeklyChange || 0,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch portfolio stats:', error);
      setPortfolioStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Fetch portfolio history
  const fetchPortfolioHistory = async (period: '30d' | '90d' | '365d' = '30d') => {
    try {
      const response = await fetch(`/api/user/portfolio/history?period=${period}`);
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        const formattedData = data.data.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.value,
          cards: item.totalCards
        }));
        setPortfolioHistory(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio history:', error);
    }
  };

  // Fetch activity history for the chart
  const fetchActivityHistory = async () => {
    try {
      const response = await fetch('/api/user/activity/summary?period=7d');
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        const formattedData = data.data.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
          added: item.cardsAdded || 0,
          graded: item.cardsGraded || 0
        }));
        setCardsHistory(formattedData);
      }
    } catch (error) {
      console.error('Failed to fetch activity history:', error);
    }
  };

  // Fetch recent activity feed
  const fetchRecentActivityFeed = async () => {
    try {
      const response = await fetch('/api/user/activity/recent?limit=10');
      const data = await response.json();
      
      if (data.activities && Array.isArray(data.activities)) {
        const formattedActivities = data.activities.map((activity: any) => {
          const timeDiff = new Date().getTime() - new Date(activity.timestamp).getTime();
          const hours = Math.floor(timeDiff / (1000 * 60 * 60));
          const days = Math.floor(hours / 24);
          
          let timeAgo = '';
          if (days > 0) {
            timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
          } else if (hours > 0) {
            timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
          } else {
            timeAgo = 'Just now';
          }
          
          const icons: Record<string, string> = {
            grade_completed: '✨',
            cards_added: '📦',
            price_alert: '📈',
            milestone: '🎉'
          };
          
          return {
            type: activity.type,
            icon: icons[activity.type] || '📌',
            title: activity.title,
            subtitle: activity.subtitle,
            time: timeAgo,
            value: activity.metadata?.valueChange ? `+$${activity.metadata.valueChange.toLocaleString()}` : null
          };
        });
        setRecentActivity(formattedActivities.slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  // Fetch top performing cards
  const fetchTopPerformingCards = async () => {
    try {
      setTopPerformersLoading(true);
      const response = await fetch('/api/user/cards/top-performers?limit=5');
      const data = await response.json();
      
      if (data.cards && Array.isArray(data.cards)) {
        setTopPerformers(data.cards.map((card: any) => ({
          id: card.id,
          name: card.name,
          set: card.set,
          grade: card.grade,
          value: card.currentValue,
          change: card.changePercent,
          image: card.imageUrl
        })));
      }
    } catch (error) {
      console.error('Failed to fetch top performers:', error);
    } finally {
      setTopPerformersLoading(false);
    }
  };

  // Fetch user credits
  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      const data = await response.json();
      setUserCredits(data.availableCredits || 0);
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  // Fetch market insights
  const fetchMarketInsights = async () => {
    try {
      const response = await fetch('/api/market/insights');
      const data = await response.json();
      setMarketInsights(data);
    } catch (error) {
      console.error('Failed to fetch market insights:', error);
    }
  };

  // Handle period change for portfolio chart
  const handlePeriodChange = (period: '30d' | '90d' | '365d') => {
    setSelectedPeriod(period);
    fetchPortfolioHistory(period);
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
          <div className="max-w-md mx-auto px-5 py-6 pb-24 pt-24">
          
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.username || user?.name?.split(' ')[0]}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Your portfolio is performing well today</p>
          </div>

          {/* Portfolio Value Card */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/80">Total Portfolio Value</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-white/60">Live</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-baseline space-x-3">
                  <h2 className="text-4xl font-bold text-white">
                    {portfolioStats.isLoading ? '...' : `$${portfolioStats.portfolioValue.toLocaleString()}`}
                  </h2>
                  {!portfolioStats.isLoading && portfolioStats.monthlyChange > 0 && (
                    <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                      <svg className="w-4 h-4 mr-1 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-sm font-semibold text-white">{portfolioStats.monthlyChange}%</span>
                      <span className="text-xs text-white/60 ml-1">30d</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-white/60 mb-1">Cards</p>
                  <p className="text-lg font-semibold text-white">
                    {portfolioStats.isLoading ? '...' : portfolioStats.totalCards}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-white/60 mb-1">Avg Grade</p>
                  <p className="text-lg font-semibold text-white">
                    {portfolioStats.isLoading ? '...' : portfolioStats.avgGrade}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-white/60 mb-1">7d Change</p>
                  <p className="text-lg font-semibold text-white">
                    {portfolioStats.isLoading ? '...' : `+${portfolioStats.weeklyChange}%`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Chart */}
          {portfolioHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Portfolio Performance</h3>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => handlePeriodChange('30d')}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                      selectedPeriod === '30d' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    30D
                  </button>
                  <button 
                    onClick={() => handlePeriodChange('90d')}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                      selectedPeriod === '90d' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    90D
                  </button>
                  <button 
                    onClick={() => handlePeriodChange('365d')}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                      selectedPeriod === '365d' 
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    1Y
                  </button>
                </div>
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0068f2" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0068f2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any) => [`$${value}`, 'Value']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#0068f2" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Quick Actions & Grade CTA */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Grade New Card CTA */}
            <Link to="/grades/submit" className="col-span-2">
              <div className="bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Grade Your Cards</h3>
                    <p className="text-white/80 text-sm">
                      {userCredits} credits available
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* Collection */}
            <Link to="/collection" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-all h-full">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Collections</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {portfolioStats.isLoading ? '...' : portfolioStats.totalCards}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total cards</p>
              </div>
            </Link>

            {/* Market Insights */}
            <Link to="/market" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-all h-full">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Market</h4>
                </div>
                <p className="text-2xl font-bold text-success-600">
                  {marketInsights?.trending?.changePercent ? `+${marketInsights.trending.changePercent}%` : '+0%'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {marketInsights?.trending?.category || 'Market'} trending
                </p>
              </div>
            </Link>
          </div>

          {/* Cards Activity Chart */}
          {cardsHistory.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Weekly Activity</h3>
                <Link to="/activity" className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                  View All
                </Link>
              </div>
              
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cardsHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      hide
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="added" fill="#0068f2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="graded" fill="#ee3f5b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-center space-x-6 mt-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-primary-500 rounded-full" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Cards Added</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-accent-500 rounded-full" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Cards Graded</span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
              <Link to="/activity" className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-xl transition-colors">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'grade' ? 'bg-purple-100 dark:bg-purple-900/30' :
                    activity.type === 'add' ? 'bg-primary-100 dark:bg-primary-900/30' :
                    activity.type === 'price' ? 'bg-success-100 dark:bg-success-900/30' :
                    'bg-accent-100 dark:bg-accent-900/30'
                  }`}>
                    <span className="text-lg">{activity.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {activity.subtitle}
                        </p>
                      </div>
                      {activity.value && (
                        <span className="text-sm font-semibold text-success-600 dark:text-success-400 ml-2">
                          {activity.value}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Cards */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Your Top Cards</h3>
              <Link to="/collection?sort=value" className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              {topPerformersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : topPerformers.length > 0 ? (
                topPerformers.slice(0, 3).map((card, index) => (
                  <Link 
                    key={card.id} 
                    to={`/cards/${card.id}`}
                    className="flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-xl transition-all group"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden">
                        {card.image && (
                          <img 
                            src={card.image.startsWith('http') ? card.image : `https://www.tcgrader.com${card.image}`}
                            alt={card.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        )}
                      </div>
                      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        'bg-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {card.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {card.grade} • {card.set || 'Unknown Set'}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        ${card.value?.toLocaleString() || '0'}
                      </p>
                      <p className={`text-xs font-medium flex items-center justify-end ${
                        card.change > 0 ? 'text-success-600' : 'text-red-600'
                      }`}>
                        {card.change > 0 ? (
                          <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        )}
                        {Math.abs(card.change)}%
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No cards graded yet</p>
                  <Link to="/grades/submit" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
                    Grade your first card
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Premium CTA for Free Users */}
          {user?.subscription?.type === 'free' && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-primary-600 dark:to-primary-700 rounded-2xl p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Unlock Premium Features</h3>
                <p className="text-sm text-white/80 mb-4">Get unlimited grades, advanced analytics, and priority support</p>
                <Link to="/subscription">
                  <Button variant="secondary" size="md" className="bg-white text-gray-900 hover:bg-gray-100">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
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