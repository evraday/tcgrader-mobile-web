import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import apiService from '../services/api';
import tcgraderLogo from '../assets/tcgrader-logo.png';

interface Performer {
  id: string;
  name: string;
  grade: string;
  value: number;
  change: number;
  image?: string;
  game: string;
  rarity?: string;
  set?: string;
  year?: string;
}

const TopPerformersPage: React.FC = () => {
  const navigate = useNavigate();
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [gameFilter, setGameFilter] = useState<'all' | 'pokemon' | 'magic' | 'sports'>('all');

  useEffect(() => {
    fetchTopPerformers();
  }, [timeRange, gameFilter]);

  const fetchTopPerformers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTopPerformers(timeRange);
      let performers = response.performers || [];
      
      // Apply game filter
      if (gameFilter !== 'all') {
        performers = performers.filter((p: Performer) => p.game === gameFilter);
      }
      
      // If API returns empty or fails, use comprehensive mock data
      if (performers.length === 0) {
        performers = getMockPerformers();
      }
      
      setTopPerformers(performers);
    } catch (error) {
      console.error('Failed to fetch top performers:', error);
      // Use mock data on error
      setTopPerformers(getMockPerformers());
    } finally {
      setLoading(false);
    }
  };

  const getMockPerformers = (): Performer[] => {
    const mockData = [
      {
        id: '1',
        name: 'Pikachu Illustrator',
        grade: 'PSA 9',
        value: 375000,
        change: 45.2,
        image: '/api/placeholder/100/140',
        game: 'pokemon',
        rarity: 'Promo',
        set: 'PokeCard Artist',
        year: '1998'
      },
      {
        id: '2',
        name: 'Black Lotus (Alpha)',
        grade: 'BGS 9.5',
        value: 45000,
        change: 22.8,
        image: '/api/placeholder/100/140',
        game: 'magic',
        rarity: 'Rare',
        set: 'Alpha',
        year: '1993'
      },
      {
        id: '3',
        name: 'Michael Jordan Rookie',
        grade: 'PSA 10',
        value: 12500,
        change: 15.3,
        image: '/api/placeholder/100/140',
        game: 'sports',
        rarity: 'Base',
        set: 'Fleer',
        year: '1986'
      },
      {
        id: '4',
        name: 'Charizard Base Set 1st Edition',
        grade: 'PSA 10',
        value: 350000,
        change: 38.5,
        image: '/api/placeholder/100/140',
        game: 'pokemon',
        rarity: 'Holo Rare',
        set: 'Base Set',
        year: '1999'
      },
      {
        id: '5',
        name: 'Time Walk (Beta)',
        grade: 'CGC 9.0',
        value: 28000,
        change: 18.2,
        image: '/api/placeholder/100/140',
        game: 'magic',
        rarity: 'Rare',
        set: 'Beta',
        year: '1993'
      },
      {
        id: '6',
        name: 'LeBron James Rookie Chrome',
        grade: 'BGS 9.5',
        value: 8500,
        change: 12.7,
        image: '/api/placeholder/100/140',
        game: 'sports',
        rarity: 'Refractor',
        set: 'Topps Chrome',
        year: '2003'
      },
      {
        id: '7',
        name: 'Umbreon Gold Star',
        grade: 'PSA 10',
        value: 15000,
        change: 25.4,
        image: '/api/placeholder/100/140',
        game: 'pokemon',
        rarity: 'Gold Star',
        set: 'POP Series 5',
        year: '2007'
      },
      {
        id: '8',
        name: 'Ancestral Recall (Alpha)',
        grade: 'PSA 9',
        value: 32000,
        change: 20.1,
        image: '/api/placeholder/100/140',
        game: 'magic',
        rarity: 'Rare',
        set: 'Alpha',
        year: '1993'
      },
      {
        id: '9',
        name: 'Tom Brady Rookie',
        grade: 'PSA 10',
        value: 9800,
        change: 14.9,
        image: '/api/placeholder/100/140',
        game: 'sports',
        rarity: 'Base',
        set: 'Playoff Contenders',
        year: '2000'
      },
      {
        id: '10',
        name: 'Lugia 1st Edition Neo Genesis',
        grade: 'BGS 10',
        value: 25000,
        change: 30.2,
        image: '/api/placeholder/100/140',
        game: 'pokemon',
        rarity: 'Holo Rare',
        set: 'Neo Genesis',
        year: '2000'
      }
    ];

    // Filter by game if needed
    if (gameFilter !== 'all') {
      return mockData.filter(p => p.game === gameFilter);
    }
    return mockData;
  };

  const getGameIcon = (game: string) => {
    switch (game) {
      case 'pokemon':
        return '⚡';
      case 'magic':
        return '🔮';
      case 'sports':
        return '⚾';
      default:
        return '🎴';
    }
  };

  const getGameColor = (game: string) => {
    switch (game) {
      case 'pokemon':
        return 'bg-yellow-100 text-yellow-800';
      case 'magic':
        return 'bg-purple-100 text-purple-800';
      case 'sports':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Top Performers</h1>
            </div>
            <Link to="/">
              <img src={tcgraderLogo} alt="TCGrader" className="h-8 w-auto" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-5 pt-20 pb-24">
        {/* Time Range Selector */}
        <div className="bg-white rounded-xl p-1 mb-4 flex space-x-1">
          {(['day', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>

        {/* Game Filter */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'pokemon', 'magic', 'sports'] as const).map((game) => (
            <button
              key={game}
              onClick={() => setGameFilter(game)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                gameFilter === game
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {game === 'all' ? 'All Games' : game.charAt(0).toUpperCase() + game.slice(1)}
            </button>
          ))}
        </div>

        {/* Top Performers List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : topPerformers.length > 0 ? (
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <Link
                key={performer.id}
                to={`/cards/${performer.id}`}
                className="block bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="flex items-start p-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 mr-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Card Image */}
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden">
                      {performer.image ? (
                        <img
                          src={performer.image.startsWith('http') ? performer.image : `https://www.tcgrader.com${performer.image}`}
                          alt={performer.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/api/placeholder/80/112';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate pr-2">{performer.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getGameColor(performer.game)}`}>
                        {getGameIcon(performer.game)} {performer.game}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <span className="font-medium text-gray-700">{performer.grade}</span>
                      {performer.set && (
                        <>
                          <span>•</span>
                          <span>{performer.set}</span>
                        </>
                      )}
                      {performer.year && (
                        <>
                          <span>•</span>
                          <span>{performer.year}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          ${performer.value.toLocaleString()}
                        </p>
                        <p className={`text-sm font-semibold ${
                          performer.change > 0 ? 'text-success-600' : 'text-red-600'
                        }`}>
                          {performer.change > 0 ? '+' : ''}{performer.change}%
                          <span className="text-xs text-gray-500 font-normal ml-1">
                            {timeRange === 'day' ? 'today' : `this ${timeRange}`}
                          </span>
                        </p>
                      </div>
                      
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No performers found</h3>
            <p className="text-gray-600">Try selecting a different time range or game filter.</p>
          </div>
        )}

        {/* Market Summary */}
        {!loading && topPerformers.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Market Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Average Change</p>
                <p className="text-lg font-bold text-success-600">
                  +{(topPerformers.reduce((sum, p) => sum + p.change, 0) / topPerformers.length).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Total Value</p>
                <p className="text-lg font-bold text-gray-900">
                  ${topPerformers.reduce((sum, p) => sum + p.value, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopPerformersPage;