import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import Button from '../components/common/Button';
import tcgraderLogo from '../assets/tcgrader-logo.png';
import apiService from '../services/api';

interface MarketCard {
  id: string;
  name: string;
  set: string;
  imageUrl?: string;
  currentPrice: number;
  priceChange: number;
  percentageChange: number;
  volume24h?: number;
  marketCap?: number;
  grade?: string;
  rarity?: string;
}

interface MarketStats {
  totalVolume24h: number;
  volumeChangePercent24h: number;
  totalMarketCap: number;
  marketCapChangePercent24h: number;
  activeListings: number;
  activeListingsChangePercent24h: number;
  avgPrice: number;
  avgPriceChangePercent24h: number;
}

const MarketPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'trending' | 'gainers' | 'losers' | 'new'>('trending');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [marketCards, setMarketCards] = useState<MarketCard[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalVolume24h: 0,
    volumeChangePercent24h: 0,
    totalMarketCap: 0,
    marketCapChangePercent24h: 0,
    activeListings: 0,
    activeListingsChangePercent24h: 0,
    avgPrice: 0,
    avgPriceChangePercent24h: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'change' | 'volume'>('change');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchMarketData();
  }, [timeframe, activeTab]);

  const fetchMarketData = async () => {
    try {
      setIsLoading(true);
      
      const [comprehensiveStats, insightsData, performersData] = await Promise.all([
        apiService.getComprehensiveStats(),
        apiService.getMarketInsights(timeframe),
        apiService.getTopPerformers(20, timeframe)
      ]);

      // Process comprehensive stats
      if (comprehensiveStats?.data) {
        const stats = comprehensiveStats.data;
        setMarketStats({
          totalVolume24h: stats.totalVolume || 0,
          volumeChangePercent24h: stats.volumeChangePercent24h || 0,
          totalMarketCap: stats.marketCap || 0,
          marketCapChangePercent24h: stats.marketCapChangePercent24h || 0,
          activeListings: stats.activeListings || 0,
          activeListingsChangePercent24h: stats.activeListingsChangePercent24h || 0,
          avgPrice: stats.avgPrice || 0,
          avgPriceChangePercent24h: stats.avgPriceChangePercent24h || 0
        });
      }

      // Process cards based on active tab
      let cards: MarketCard[] = [];
      
      if (activeTab === 'trending' && insightsData?.data?.topMovers) {
        cards = insightsData.data.topMovers.map((card: any) => ({
          id: card.cardId,
          name: card.attributes.name,
          set: card.attributes.set,
          imageUrl: card.attributes.imageUrl,
          currentPrice: card.attributes.currentPrice || 0,
          priceChange: card.priceChange || 0,
          percentageChange: card.percentageChange || 0,
          volume24h: card.attributes.volume24h,
          grade: card.attributes.grade,
          rarity: card.attributes.rarity
        }));
      } else if (activeTab === 'gainers' && performersData?.topGainers) {
        cards = performersData.topGainers.map((card: any) => ({
          id: card.cardId,
          name: card.cardName,
          set: card.attributes?.set || 'Unknown Set',
          imageUrl: card.imageUrl,
          currentPrice: card.currentPrice || card.averagePrice || 0,
          priceChange: card.priceChange || 0,
          percentageChange: card.priceChangePercentage || card.percentageChange || 0,
          volume24h: card.volume24h,
          grade: card.attributes?.grade,
          rarity: card.attributes?.rarity
        }));
      } else if (activeTab === 'losers' && performersData?.topLosers) {
        cards = performersData.topLosers.map((card: any) => ({
          id: card.cardId,
          name: card.cardName,
          set: card.attributes?.set || 'Unknown Set',
          imageUrl: card.imageUrl,
          currentPrice: card.currentPrice || card.averagePrice || 0,
          priceChange: card.priceChange || 0,
          percentageChange: card.priceChangePercentage || card.percentageChange || 0,
          volume24h: card.volume24h,
          grade: card.attributes?.grade,
          rarity: card.attributes?.rarity
        }));
      }

      setMarketCards(cards);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      // Set demo data for development
      setMarketCards(getDemoMarketData());
    } finally {
      setIsLoading(false);
    }
  };

  const getDemoMarketData = (): MarketCard[] => [
    {
      id: '1',
      name: 'Charizard VMAX',
      set: 'Champions Path',
      currentPrice: 450,
      priceChange: 45,
      percentageChange: 11.1,
      volume24h: 12500,
      grade: 'PSA 10',
      rarity: 'Secret Rare'
    },
    {
      id: '2',
      name: 'Pikachu Illustrator',
      set: 'Promo',
      currentPrice: 375000,
      priceChange: 25000,
      percentageChange: 7.1,
      volume24h: 2,
      grade: 'PSA 9',
      rarity: 'Promo'
    },
    {
      id: '3',
      name: 'Black Lotus',
      set: 'Alpha',
      currentPrice: 45000,
      priceChange: -2000,
      percentageChange: -4.3,
      volume24h: 5,
      grade: 'BGS 8.5',
      rarity: 'Rare'
    }
  ];

  const filteredCards = marketCards.filter(card => {
    if (searchQuery && !card.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (priceRange.min && card.currentPrice < parseFloat(priceRange.min)) {
      return false;
    }
    if (priceRange.max && card.currentPrice > parseFloat(priceRange.max)) {
      return false;
    }
    if (selectedSets.length > 0 && !selectedSets.includes(card.set)) {
      return false;
    }
    return true;
  });

  const sortedCards = [...filteredCards].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return b.currentPrice - a.currentPrice;
      case 'change':
        return b.percentageChange - a.percentageChange;
      case 'volume':
        return (b.volume24h || 0) - (a.volume24h || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700/40 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/">
                <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
              </Link>
            </div>
            <Link to="/profile">
              <div className="flex items-center space-x-3 bg-gray-50 dark:bg-slate-800/70 rounded-full pl-3 pr-1 py-1 hover:bg-gray-100 dark:hover:bg-slate-700/70 transition-all">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{user?.username || user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.subscription?.type || 'Free'} Plan</p>
                </div>
                {user?.avatar ? (
                  <img 
                    src={`https://www.tcgrader.com${user.avatar}`} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
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

      {/* Main Content */}
      <div className="pt-20">
        {/* Market Stats Banner */}
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700/40">
          <div className="max-w-md mx-auto px-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-3">
                <p className="text-xs text-primary-700 dark:text-primary-300 font-medium">24h Volume</p>
                <p className="text-lg font-bold text-primary-900 dark:text-primary-100">
                  ${marketStats.totalVolume24h >= 1000 ? `${(marketStats.totalVolume24h / 1000).toFixed(1)}K` : marketStats.totalVolume24h.toFixed(2)}
                </p>
                <p className={`text-xs mt-0.5 font-medium ${
                  marketStats.volumeChangePercent24h >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {marketStats.volumeChangePercent24h >= 0 ? '+' : ''}{marketStats.volumeChangePercent24h.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 rounded-xl p-3">
                <p className="text-xs text-accent-700 dark:text-accent-300 font-medium">Market Cap</p>
                <p className="text-lg font-bold text-accent-900 dark:text-accent-100">
                  ${marketStats.totalMarketCap >= 1000000 
                    ? `${(marketStats.totalMarketCap / 1000000).toFixed(1)}M` 
                    : marketStats.totalMarketCap >= 1000 
                    ? `${(marketStats.totalMarketCap / 1000).toFixed(1)}K`
                    : marketStats.totalMarketCap.toFixed(2)}
                </p>
                <p className={`text-xs mt-0.5 font-medium ${
                  marketStats.marketCapChangePercent24h >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {marketStats.marketCapChangePercent24h >= 0 ? '+' : ''}{marketStats.marketCapChangePercent24h.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl p-3">
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Active Listings</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{marketStats.activeListings.toLocaleString()}</p>
                <p className={`text-xs mt-0.5 font-medium ${
                  marketStats.activeListingsChangePercent24h >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {marketStats.activeListingsChangePercent24h >= 0 ? '+' : ''}{marketStats.activeListingsChangePercent24h.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl p-3">
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Avg. Price</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ${marketStats.avgPrice >= 1000 
                    ? `${(marketStats.avgPrice / 1000).toFixed(1)}K` 
                    : marketStats.avgPrice.toFixed(2)}
                </p>
                <p className={`text-xs mt-0.5 font-medium ${
                  marketStats.avgPriceChangePercent24h >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {marketStats.avgPriceChangePercent24h >= 0 ? '+' : ''}{marketStats.avgPriceChangePercent24h.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-5 py-6 pb-24">
          {/* Search and Controls */}
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-slate-900/20 p-4 mb-4 border border-gray-200 dark:border-slate-700/40">
            {/* Search */}
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-200 dark:border-slate-600/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-2">
              {/* Timeframe */}
              <div className="flex bg-gray-100 dark:bg-slate-700/50 rounded-lg p-1 flex-1">
                {(['24h', '7d', '30d'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                      timeframe === tf
                        ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-gray-100 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs text-gray-900 dark:text-gray-200"
              >
                <option value="change">% Change</option>
                <option value="price">Price</option>
                <option value="volume">Volume</option>
              </select>

              {/* View Mode */}
              <div className="flex bg-gray-100 dark:bg-slate-700/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm' : ''}`}
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm' : ''}`}
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

          </div>

          {/* Advanced Filters */}
          <details className="mb-6">
            <summary className="cursor-pointer bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg dark:shadow-slate-900/20 hover:shadow-xl transition-all border border-gray-200 dark:border-slate-700/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">Advanced Filters</span>
                </div>
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg dark:shadow-slate-900/20 mt-3 border border-gray-200 dark:border-slate-700/40">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <span className="text-gray-400 dark:text-gray-500">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </details>

          {/* Market Tabs */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { key: 'trending', label: 'Trending', icon: '🔥' },
              { key: 'gainers', label: 'Gainers', icon: '📈' },
              { key: 'losers', label: 'Losers', icon: '📉' },
              { key: 'new', label: 'New', icon: '✨' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-1.5 px-4 py-2.5 font-medium rounded-full transition-all whitespace-nowrap text-sm ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg'
                    : 'bg-white/70 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700/40'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Market Cards */}
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700/40">
                      <div className="aspect-[3/4] bg-gray-200 dark:bg-slate-700"></div>
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="h-5 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-1"></div>
                            <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
                          </div>
                          <div className="w-6 h-6 bg-gray-200 dark:bg-slate-700 rounded"></div>
                        </div>
                        <div className="h-3 w-24 bg-gray-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-slate-700/40">
                  <div className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600/40 px-4 py-3">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="h-3 w-12 bg-gray-200 dark:bg-slate-600 rounded"></div>
                      <div className="h-3 w-12 bg-gray-200 dark:bg-slate-600 rounded"></div>
                      <div className="h-3 w-8 bg-gray-200 dark:bg-slate-600 rounded"></div>
                      <div className="h-3 w-8 bg-gray-200 dark:bg-slate-600 rounded"></div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-slate-700/40">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="px-4 py-3">
                        <div className="grid grid-cols-4 gap-4 items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-11 bg-gray-200 dark:bg-slate-700 rounded"></div>
                            <div className="space-y-1">
                              <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
                              <div className="h-2 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
                            </div>
                          </div>
                          <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
                          <div className="h-4 w-12 bg-gray-200 dark:bg-slate-700 rounded"></div>
                          <div className="h-3 w-14 bg-gray-200 dark:bg-slate-700 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4">
              {sortedCards.map((card) => (
                <div key={card.id} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-slate-900/20 hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-200 dark:border-slate-700/40">
                  <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 relative">
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                    )}
                    {card.grade && (
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-xs font-bold text-white">{card.grade}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <p className="text-white text-sm font-medium truncate">{card.name}</p>
                      <p className="text-white/80 text-xs">{card.set}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">${formatPrice(card.currentPrice)}</p>
                        <p className={`text-xs font-medium ${card.percentageChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {card.percentageChange >= 0 ? '+' : ''}{card.percentageChange.toFixed(1)}%
                        </p>
                      </div>
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>
                    {card.volume24h && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Vol: ${formatPrice(card.volume24h)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-lg dark:shadow-slate-900/20 overflow-hidden border border-gray-200 dark:border-slate-700/40">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600/40">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Card</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">24h</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-slate-700/40">
                    {sortedCards.map((card) => (
                      <tr key={card.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-11 bg-gray-100 dark:bg-slate-700 rounded overflow-hidden flex-shrink-0">
                              {card.imageUrl ? (
                                <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{card.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{card.set}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">${formatPrice(card.currentPrice)}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className={`text-sm font-medium ${card.percentageChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {card.percentageChange >= 0 ? '+' : ''}{card.percentageChange.toFixed(1)}%
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {card.volume24h ? `$${formatPrice(card.volume24h)}` : '-'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Results */}
          {sortedCards.length === 0 && !isLoading && (
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg dark:shadow-slate-900/20 text-center border border-gray-200 dark:border-slate-700/40">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">No cards found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Try adjusting your filters or search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return (price / 1000000).toFixed(1) + 'M';
  } else if (price >= 1000) {
    return (price / 1000).toFixed(1) + 'K';
  } else {
    return price.toFixed(2);
  }
}

export default MarketPage;