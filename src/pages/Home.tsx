import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import Button from '../components/common/Button';
import PortfolioChart from '../components/charts/PortfolioChart';
import tcgraderLogo from '../assets/tcgrader-logo.png';
import apiService from '../services/api';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [scrollY, setScrollY] = useState(0);
  const [portfolioStats, setPortfolioStats] = useState({
    totalCards: 0,
    portfolioValue: 0,
    avgGrade: 0,
    isLoading: true
  });
  const [marketInsights, setMarketInsights] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [marketDataLoading, setMarketDataLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [portfolioHistory, setPortfolioHistory] = useState<any>(null);
  const [portfolioPeriod, setPortfolioPeriod] = useState('6m');
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchPortfolioData();
      fetchMarketData();
      fetchPortfolioHistory('6m');
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

  const fetchPortfolioHistory = async (period: string = '6m') => {
    try {
      setPortfolioLoading(true);
      const response = await apiService.get('/api/collections/portfolio-history', {
        params: {
          period,
          interval: 'daily'
        }
      });
      if (response && response.data) {
        setPortfolioHistory(response.data);
        setPortfolioPeriod(period);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio history:', error);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      setMarketDataLoading(true);
      const [insightsData, activity, performersData] = await Promise.all([
        apiService.getMarketInsights('30d').catch(() => null),
        apiService.get('/api/notifications').catch(() => ({ notifications: [] })),
        apiService.getTopPerformers(3, '30d').catch(() => null)
      ]);
      
      // Process market insights
      if (insightsData && insightsData.data) {
        const topMovers = insightsData.data.topMovers || [];
        
        // Convert top movers to display format for Market Insights section
        const insights = topMovers.slice(0, 3).map(card => ({
          category: `${card.attributes.name} (${card.attributes.set})`,
          trend: card.percentageChange > 0 ? 'up' : 'down',
          percentageChange: Math.round(card.percentageChange * 10) / 10
        }));
        setMarketInsights(insights);
      }
      
      // Process recent notifications
      const notifications = activity.notifications || activity || [];
      setRecentNotifications(notifications);
      
      // Count unread notifications
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // Process top performers
      if (performersData) {
        const topGainers = performersData.topGainers || [];
        const topPerformers = performersData.topPerformers || [];
        
        // Combine and format for display
        const performers = [...topGainers, ...topPerformers].slice(0, 3).map(card => ({
          name: card.cardName || card.attributes?.name || 'Unknown Card',
          grade: card.attributes?.grade,
          set: card.attributes?.set,
          imageUrl: card.imageUrl,
          currentPrice: card.currentPrice || card.averagePrice || 0,
          priceChange: card.priceChangePercentage || card.percentageChange || 0
        }));
        setTopPerformers(performers);
      }
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setMarketDataLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      {isAuthenticated ? (
        <>
          {/* Fixed Header */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/40 safe-area-top">
            <div className="max-w-md mx-auto px-5 py-3">
              <div className="flex items-center justify-between">
                <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
                <Link to="/profile">
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
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-1">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.username || user?.name?.split(' ')[0]}
                </h2>
                <p className="text-gray-400">Here's your portfolio overview</p>
              </div>
              
              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-200">Notifications</h3>
                        <Link 
                          to="/notifications" 
                          onClick={() => setShowNotifications(false)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          View All
                        </Link>
                      </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {recentNotifications.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                          {recentNotifications.slice(0, 5).map((notification, index) => (
                            <div 
                              key={index} 
                              className="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                            >
                              <div className="flex space-x-3">
                                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                                  notification.type === 'grade' ? 'bg-success-500' :
                                  notification.type === 'collection' ? 'bg-primary-500' :
                                  notification.type === 'price_alert' ? 'bg-accent-500' :
                                  'bg-gray-500'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                                    {notification.description || notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {formatTimeAgo(notification.createdAt || notification.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
                        </div>
                      )}
                    </div>
                    
                    {recentNotifications.length > 0 && (
                      <div className="p-3 border-t border-gray-100 dark:border-slate-700">
                        <button 
                          onClick={() => {
                            // Mark all as read logic here
                            setUnreadCount(0);
                          }}
                          className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Portfolio Analytics Card */}
          <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Portfolio Value</h3>
              <span className="text-xs bg-gray-100 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">Live</span>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline space-x-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-200">
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Estimated portfolio value</p>
            </div>

            {/* Mini Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cards</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  {portfolioStats.isLoading ? '...' : portfolioStats.totalCards.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Credits</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">{user?.credits || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg. Grade</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  {portfolioStats.isLoading ? '...' : portfolioStats.avgGrade}
                </p>
              </div>
            </div>
          </div>

          {/* Portfolio Performance Chart */}
          <PortfolioChart 
            data={portfolioHistory} 
            period={portfolioPeriod}
            onPeriodChange={(period) => fetchPortfolioHistory(period)}
            isLoading={portfolioLoading}
          />

          {/* Market Insights */}
          <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-200">Market Insights</h3>
              <Link to="/market" className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium">View All</Link>
            </div>
            
            {marketDataLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                      <div>
                        <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-1"></div>
                        <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    </div>
                    <div className="h-4 w-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : marketInsights.length > 0 ? (
              <div className="space-y-3">
                {marketInsights.slice(0, 3).map((insight, index) => (
                  <div key={index} className="flex items-center justify-between py-2 gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 flex-shrink-0 ${
                        insight.trend === 'up' ? 'bg-orange-100' : 
                        insight.trend === 'stable' ? 'bg-blue-100' : 
                        'bg-purple-100'
                      } rounded-lg flex items-center justify-center`}>
                        <span className="text-sm">
                          {insight.trend === 'up' ? '🔥' : insight.trend === 'stable' ? '⚖️' : '📈'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{insight.category}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {insight.trend === 'up' ? 'Trending Up' : 
                           insight.trend === 'down' ? 'Trending Down' : 
                           'Stable'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ${
                      insight.percentageChange > 0 ? 'text-success-600' : 
                      insight.percentageChange < 0 ? 'text-red-600' : 
                      'text-gray-400'
                    }`}>
                      {insight.percentageChange > 0 ? '+' : ''}{insight.percentageChange}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-600 dark:text-gray-400 text-sm">
                No market insights available
              </div>
            )}
          </div>


          {/* Top Performers */}
          <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-2xl p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-200">Top Performers</h3>
              <span className="text-xs text-gray-600 dark:text-gray-400">Last 30 days</span>
            </div>
            
            {marketDataLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded ml-auto"></div>
                      <div className="h-3 w-12 bg-gray-200 dark:bg-slate-700 rounded ml-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.slice(0, 3).map((card, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {card.imageUrl ? (
                          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{card.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {card.grade ? `Grade ${card.grade}` : card.set}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                        ${formatPrice(card.currentPrice)}
                      </p>
                      <p className={`text-xs font-medium ${
                        card.priceChange > 0 ? 'text-success-600' : 
                        card.priceChange < 0 ? 'text-red-600' : 
                        'text-gray-400'
                      }`}>
                        {card.priceChange > 0 ? '+' : ''}{card.priceChange}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-600 dark:text-gray-400 text-sm">
                No performance data available
              </div>
            )}
          </div>

          {/* Premium CTA for Free Users */}
          {user?.subscription?.type === 'free' && (
            <div className="bg-gray-900 text-gray-900 dark:text-gray-200 rounded-2xl p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Unlock Premium Features</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Get unlimited grades, advanced analytics, and priority support</p>
              <Link to="/subscription">
                <Button variant="secondary" size="md" className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 text-gray-900 dark:text-gray-200 hover:bg-gray-100">
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
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-200 mb-4">
              Professional Trading<br />Card Management
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Track, grade, and value your collection<br />with industry-leading tools
            </p>

            <div className="max-w-sm mx-auto">
              <Link to="/register" className="block mb-6">
                <Button fullWidth size="lg" variant="accent" className="shadow-lg">
                  Start Free Trial
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
          <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-3xl p-6 mb-12 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold mb-4 text-center text-gray-900 dark:text-gray-200">Today's Activity</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">127</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Cards Graded</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-600">$45K</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success-600">89%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">PSA 9+ Rate</p>
              </div>
            </div>
          </div>

          {/* Recently Graded Cards - Preview */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-6 text-center">Recently Graded</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Card 1 - Charizard */}
              <div className="group cursor-pointer">
                <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="aspect-[3/4] bg-gradient-to-br from-orange-100 to-red-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-200">PSA 10</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-gray-900 dark:text-gray-200">
                      <p className="text-xs font-medium opacity-90">Pokémon</p>
                      <p className="font-bold">Charizard VMAX</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Market Value</span>
                      <span className="text-xs text-success-600 font-medium">+15%</span>
                    </div>
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-200">$2,450</p>
                  </div>
                </div>
              </div>

              {/* Card 2 - Pikachu */}
              <div className="group cursor-pointer">
                <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="aspect-[3/4] bg-gradient-to-br from-yellow-100 to-amber-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-200">BGS 9.5</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-gray-900 dark:text-gray-200">
                      <p className="text-xs font-medium opacity-90">Pokémon</p>
                      <p className="font-bold">Pikachu VMAX</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Market Value</span>
                      <span className="text-xs text-success-600 font-medium">+8%</span>
                    </div>
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-200">$895</p>
                  </div>
                </div>
              </div>

              {/* Card 3 - Black Lotus */}
              <div className="group cursor-pointer">
                <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-black relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-200">CGC 8.5</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-gray-900 dark:text-gray-200">
                      <p className="text-xs font-medium opacity-90">Magic</p>
                      <p className="font-bold">Black Lotus</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Market Value</span>
                      <span className="text-xs text-accent-600 font-medium">+22%</span>
                    </div>
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-200">$45,000</p>
                  </div>
                </div>
              </div>

              {/* Card 4 - LeBron James */}
              <div className="group cursor-pointer">
                <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-yellow-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-gray-200">PSA 9</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-gray-900 dark:text-gray-200">
                      <p className="text-xs font-medium opacity-90">Sports</p>
                      <p className="font-bold">LeBron Rookie</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Market Value</span>
                      <span className="text-xs text-success-600 font-medium">+5%</span>
                    </div>
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-200">$3,200</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link to="/register">
                <Button variant="secondary" size="md">
                  View All Recently Graded
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid - Enhanced */}
          <div className="space-y-4 mb-12">
            <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-100 rounded-2xl flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-200 mb-2 text-lg">AI-Powered Scanning</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Instantly identify and catalog cards with our advanced image recognition technology
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-accent-100 rounded-2xl flex-shrink-0">
                  <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-200 mb-2 text-lg">Professional Grading</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Submit to PSA, BGS, CGC, and more with our streamlined submission process
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40 rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-success-100 rounded-2xl flex-shrink-0">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-200 mb-2 text-lg">Real-Time Market Data</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Track values with live pricing from major marketplaces and auction houses
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators - Enhanced */}
          <div className="text-center py-8 px-6 bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-gray-200 dark:border-slate-700/40/50 rounded-3xl">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-6">Trusted by collectors worldwide</p>
            <div className="flex justify-center space-x-12">
              <div>
                <p className="text-3xl font-bold text-primary-600">50K+</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active Users</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent-600">2M+</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Cards Tracked</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary-600">$10M+</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Portfolio Value</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return (price / 1000000).toFixed(1) + 'M';
  } else if (price >= 1000) {
    return (price / 1000).toFixed(1) + 'K';
  } else {
    return price.toFixed(2);
  }
}

export default HomePage;