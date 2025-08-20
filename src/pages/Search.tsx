import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { debounce } from '../utils/debounce';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import CardItem from '../components/cards/CardItem';
import CardScanner from '../components/cards/CardScanner';
import { Card, CardRarity } from '../types';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen px-4 py-8 safe-area-top">
      <header className="mb-6">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mr-3 p-2"
          >
            <span className="text-2xl">←</span>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Search Cards
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-12">
          Find cards by typing or scanning
        </p>
      </header>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 text-sm mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {showScanner ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Card Scanner</h2>
            <Button 
              variant="ghost" 
              onClick={() => setShowScanner(false)}
              className="text-2xl"
            >
              ×
            </Button>
          </div>
          <CardScanner
            onCardScanned={handleCardScanned}
            onError={handleScanError}
          />
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {/* Manual Search Section */}
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2 flex items-center">
              <span className="text-xl mr-2">✏️</span>
              Manual Search
            </h3>
            <p className="text-sm text-primary-700 dark:text-primary-300 mb-3">
              Type the card name, set, or number to search our database
            </p>
            <Input
              type="search"
              placeholder="e.g., Charizard, Base Set 2, #4/102"
              value={searchQuery}
              onChange={handleSearchChange}
              leftIcon={<span className="text-lg">🔍</span>}
              className="bg-white dark:bg-gray-800"
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                OR
              </span>
            </div>
          </div>

          {/* Camera Scan Option */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
              <span className="text-xl mr-2">📷</span>
              Quick Scan
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Use your camera to instantly identify cards
            </p>
            <Button
              fullWidth
              variant="secondary"
              onClick={handleScanCard}
              className="flex items-center justify-center space-x-2"
            >
              <span className="text-xl">📸</span>
              <span>Scan Card with Camera</span>
            </Button>
          </div>
        </div>
      )}

      {/* Search Filters - Only show after initial search */}
      {hasSearched && !showScanner && (
        <details className="mb-6">
          <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-3">
            Advanced Filters
          </summary>
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Card Set
              </label>
              <Input placeholder="e.g., Base Set, Neo Genesis" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rarity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(CardRarity).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm capitalize">{value}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range
              </label>
              <div className="flex items-center space-x-2">
                <Input type="number" placeholder="Min" />
                <span className="text-gray-500">-</span>
                <Input type="number" placeholder="Max" />
              </div>
            </div>
          </div>
        </details>
      )}
      {/* Results */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Searching...</p>
        </div>
      ) : hasSearched && results.length === 0 && searchQuery ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {results.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onClick={() => console.log('Card clicked:', card.id)}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🎴</div>
          <h2 className="text-xl font-semibold mb-2">Ready to Search</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-4">
            Choose one of the search methods above to find your cards
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-sm">
            <div className="flex items-center text-primary-600 dark:text-primary-400">
              <span className="mr-2">✏️</span>
              <span>Type to search manually</span>
            </div>
            <div className="text-gray-400 hidden sm:block">|</div>
            <div className="flex items-center text-primary-600 dark:text-primary-400">
              <span className="mr-2">📷</span>
              <span>Scan for instant results</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;