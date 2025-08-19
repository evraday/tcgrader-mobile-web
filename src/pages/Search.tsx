import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { debounce } from '../utils/debounce';
import { useAuthStore } from '../store';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import CardItem from '../components/cards/CardItem';
import CardScanner from '../components/cards/CardScanner';
import { Card, CardRarity } from '../types';
import { RARITY_COLORS, CONDITION_NAMES } from '../constants';
import tcgraderLogo from '../assets/tcgrader-logo.png';
import apiService from '../services/api';

const SearchPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState({
    rarity: [] as string[],
    minPrice: '',
    maxPrice: '',
    set: ''
  });

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Implement actual API search
        // const response = await apiService.searchCards(query);
        // setResults(response.data);
        
        // Mock results for now
        setTimeout(() => {
          setResults([]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Search failed:', error);
        setIsLoading(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setHasSearched(true);
    performSearch(query);
  };

  const handleScanCard = () => {
    setShowScanner(true);
  };

  const handleCardScanned = (card: Card) => {
    setResults([card]);
    setShowScanner(false);
    setHasSearched(true);
  };

  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
    setShowScanner(false);
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/40 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
            </Link>
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
      
      <div className="max-w-md mx-auto px-5 py-6 pb-24 pt-24">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-1">Card Search</h1>
          <p className="text-gray-600 dark:text-gray-400">Find any card in our database</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-300">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-600 dark:text-red-400 text-sm mt-2 font-medium hover:text-red-700 dark:hover:text-red-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {showScanner ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-200">Card Scanner</h2>
              <button
                onClick={() => setShowScanner(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CardScanner
              onCardScanned={handleCardScanned}
              onError={handleScanError}
            />
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {/* Search Input */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search by card name, set, or number..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Scanner Button */}
            <Button
              fullWidth
              variant="secondary"
              onClick={handleScanCard}
              className="bg-white dark:bg-slate-800/70 border-2 border-gray-200 dark:border-slate-700/40 hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">Scan Card with Camera</span>
              </div>
            </Button>
          </div>
        )}

        {/* Search Filters */}
        <details className="mb-6">
          <summary className="cursor-pointer bg-white dark:bg-slate-800/70 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-slate-700/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="font-semibold text-gray-900 dark:text-gray-200">Advanced Filters</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-slate-700/40 mt-4 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Card Set
              </label>
              <input
                type="text"
                placeholder="e.g., Base Set, Neo Genesis"
                value={selectedFilters.set}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, set: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Rarity
              </label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CardRarity).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFilters.rarity.includes(value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFilters(prev => ({ ...prev, rarity: [...prev.rarity, value] }));
                        } else {
                          setSelectedFilters(prev => ({ ...prev, rarity: prev.rarity.filter(r => r !== value) }));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{value}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Price Range
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={selectedFilters.minPrice}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200"
                />
                <span className="text-gray-400 dark:text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={selectedFilters.maxPrice}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200"
                />
              </div>
            </div>
            
            <Button
              fullWidth
              variant="primary"
              onClick={() => {
                // Apply filters
                performSearch(searchQuery);
              }}
            >
              Apply Filters
            </Button>
          </div>
        </details>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800/70 rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-slate-700"></div>
                  <div className="p-3">
                    <div className="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-5 w-16 bg-gray-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : hasSearched && results.length === 0 && searchQuery ? (
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-slate-700/40 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">No Results Found</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Found {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              <select className="text-sm bg-white dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700/40 rounded-lg px-3 py-1.5 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 text-gray-900 dark:text-gray-200">
                <option>Best Match</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {results.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  onClick={() => console.log('Card clicked:', card.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-slate-700/40 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">Start Your Search</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-6">
              Enter a card name above or use the camera to scan a physical card.
            </p>
            
            {/* Popular Searches */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Popular Searches</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button 
                  onClick={() => {
                    setSearchQuery('Charizard');
                    performSearch('Charizard');
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-colors"
                >
                  Charizard
                </button>
                <button 
                  onClick={() => {
                    setSearchQuery('Pikachu');
                    performSearch('Pikachu');
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-colors"
                >
                  Pikachu
                </button>
                <button 
                  onClick={() => {
                    setSearchQuery('Black Lotus');
                    performSearch('Black Lotus');
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-colors"
                >
                  Black Lotus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;