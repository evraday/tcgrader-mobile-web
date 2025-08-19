import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import apiService from '../services/api';

interface MarketData {
  category: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  volume: number;
  icon: string;
  description: string;
}

interface TopCard {
  id: string;
  name: string;
  category: string;
  grade: string;
  value: number;
  changePercent: number;
  imageUrl?: string;
}

const MarketPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [marketData, setMarketData] = useState<MarketData[]>([
    {
      category: 'Pokémon Cards',
      trend: 'up',
      changePercent: 18.2,
      volume: 125000,
      icon: '🔥',
      description: 'Trending Up - High demand for vintage sets'
    },
    {
      category: 'Vintage MTG',
      trend: 'up',
      changePercent: 25.7,
      volume: 45000,
      icon: '✨',
      description: 'High Demand - Reserved list cards surging'
    },
    {
      category: 'Sports Cards',
      trend: 'stable',
      changePercent: 2.1,
      volume: 89000,
      icon: '⚾',
      description: 'Stable - Consistent collector interest'
    },
    {
      category: 'Yu-Gi-Oh!',
      trend: 'up',
      changePercent: 12.5,
      volume: 67000,
      icon: '🎴',
      description: 'Growing - Tournament cards in demand'
    },
    {
      category: 'One Piece TCG',
      trend: 'up',
      changePercent: 45.3,
      volume: 23000,
      icon: '🏴‍☠️',
      description: 'Hot Market - New set release driving prices'
    }
  ]);

  const [topCards] = useState<TopCard[]>([
    {
      id: '1',
      name: 'Pikachu Illustrator',
      category: 'Pokémon',
      grade: 'PSA 9',
      value: 375000,
      changePercent: 45.2
    },
    {
      id: '2',
      name: 'Black Lotus (Alpha)',
      category: 'Magic',
      grade: 'BGS 9.5',
      value: 45000,
      changePercent: 22.8
    },
    {
      id: '3',
      name: 'Michael Jordan Rookie',
      category: 'Sports',
      grade: 'PSA 10',
      value: 12500,
      changePercent: 15.3
    },
    {
      id: '4',
      name: 'Charizard Base Set 1st',
      category: 'Pokémon',
      grade: 'PSA 10',
      value: 35000,
      changePercent: 28.4
    },
    {
      id: '5',
      name: 'Wayne Gretzky Rookie',
      category: 'Sports',
      grade: 'BGS 9',
      value: 8500,
      changePercent: 10.2
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">Market Insights</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-5 py-6 pb-20 pt-20">
        {/* Market Overview */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="font-medium text-gray-900 mb-4">Market Overview</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-600">↑ 14.8%</p>
              <p className="text-xs text-gray-600">Overall Market</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-accent-600">$2.1B</p>
              <p className="text-xs text-gray-600">24h Volume</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            The collectibles market continues to show strong growth, driven by increased demand for graded cards and vintage items.
          </p>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="font-medium text-gray-900 mb-4">Category Performance</h2>
          <div className="space-y-3">
            {marketData.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.trend === 'up' ? 'bg-green-100' : item.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.category}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${
                    item.trend === 'up' ? 'text-success-600' : item.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : ''}{item.changePercent}%
                  </span>
                  <p className="text-xs text-gray-500">${(item.volume / 1000).toFixed(0)}k vol</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Cards */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">Top Performers</h2>
            <span className="text-xs text-gray-500">Last 30 days</span>
          </div>
          <div className="space-y-3">
            {topCards.map((card) => (
              <div key={card.id} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{card.name}</p>
                    <p className="text-xs text-gray-500">{card.category} • {card.grade}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">${card.value.toLocaleString()}</p>
                  <p className="text-xs text-success-600 font-medium">+{card.changePercent}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market News */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h2 className="font-medium text-gray-900 mb-4">Market News</h2>
          <div className="space-y-4">
            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-1">PSA Announces Price Increase</p>
              <p className="text-xs text-gray-600 mb-1">Professional Sports Authenticator raises grading fees by 15% starting next month.</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-1">Pokémon 151 Set Breaking Records</p>
              <p className="text-xs text-gray-600 mb-1">New Japanese set sees unprecedented demand with boxes selling out instantly.</p>
              <p className="text-xs text-gray-500">5 hours ago</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Vintage Magic Cards Surge</p>
              <p className="text-xs text-gray-600 mb-1">Reserved list cards continue upward trend with Black Lotus leading gains.</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>

        {/* Price Alerts CTA */}
        {isAuthenticated && (
          <div className="bg-primary-50 rounded-2xl p-5 text-center">
            <h3 className="font-medium text-gray-900 mb-2">Set Price Alerts</h3>
            <p className="text-sm text-gray-600 mb-4">Get notified when your cards reach target prices</p>
            <Link to="/settings/notifications" className="inline-block">
              <button className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                Configure Alerts
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPage;