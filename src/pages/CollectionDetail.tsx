import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCollectionStore, useAuthStore } from '../store';
import { Collection as CollectionType } from '../types';
import Button from '../components/common/Button';
import api from '../services/api';

interface Card {
  id?: string;
  _id?: string;
  name: string;
  imageUrl?: string;
  image?: string;
  frontImage?: string;
  images?: { front?: string; back?: string };
  grade?: number;
  value?: number;
  marketValue?: number;
  acquiredPrice?: number;
  quantity?: number;
  condition?: string;
  setName?: string;
  set?: string;
  cardNumber?: string;
  number?: string;
  rarity?: string;
  type?: string;
  year?: string;
  gradeService?: string;
  certificateNumber?: string;
  createdAt?: string;
  notes?: string;
  raw?: any;
  gradingResults?: Array<{
    model: string;
    summary: string;
    scores: {
      corners: number;
      edges: number;
      surface: number;
      centering: number;
      holographic?: number;
      overall: number;
    };
    defects?: Array<{
      name: string;
      description: string;
      impact: string;
      significancy: number | string;
      location?: string;
    }>;
    createdAt?: string;
  }>;
  prices?: {
    currentPrice?: number;
    priceHistory?: any[];
  };
}

const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [collection, setCollection] = useState<CollectionType | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'grade' | 'recent'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showListModal, setShowListModal] = useState<Card | null>(null);
  const [showCardDetailModal, setShowCardDetailModal] = useState<Card | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCollection();
      fetchCollectionCards();
    }
  }, [id]);

  const fetchCollection = async () => {
    try {
      const response = await api.getCollection(id!);
      console.log('Collection response:', response);
      // Handle potential nested response
      const collectionData = response.collection || response;
      setCollection(collectionData);
    } catch (error) {
      console.error('Failed to fetch collection:', error);
      navigate('/collection');
    }
  };

  const fetchCollectionCards = async () => {
    try {
      const response = await api.get(`/api/collections/${id}/cards`);
      const cardsData = response.cards || response.data || response || [];
      setCards(Array.isArray(cardsData) ? cardsData : []);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCards = async () => {
    if (selectedCards.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedCards.length} card(s)?`)) {
      try {
        // Delete each selected card
        await Promise.all(
          selectedCards.map(cardId => 
            api.removeCardFromCollection(id!, cardId)
          )
        );
        
        // Refresh cards
        await fetchCollectionCards();
        setSelectedCards([]);
        setIsSelectionMode(false);
      } catch (error) {
        console.error('Failed to delete cards:', error);
      }
    }
  };

  const fetchPriceHistory = async (cardId: string) => {
    setLoadingPriceHistory(true);
    try {
      const response = await api.getPriceHistory(cardId, 30);
      setPriceHistory(response.history || response || []);
    } catch (error) {
      console.error('Failed to fetch price history:', error);
      setPriceHistory([]);
    } finally {
      setLoadingPriceHistory(false);
    }
  };

  const handleCardClick = (card: Card) => {
    console.log('Card clicked for detail:', card);
    setShowCardDetailModal(card);
    const cardId = card._id || card.id;
    if (cardId) {
      fetchPriceHistory(cardId);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: collection?.name,
        text: `Check out my ${collection?.name} collection on TCGrader`,
        url: window.location.href
      });
    } else {
      // Fallback - copy link
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const sortedAndFilteredCards = React.useMemo(() => {
    let filtered = [...cards];

    // Apply filter
    if (filterBy === 'graded') {
      filtered = filtered.filter(card => card.grade && card.grade > 0);
    } else if (filterBy === 'ungraded') {
      filtered = filtered.filter(card => !card.grade || card.grade === 0);
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'value':
          return (b.value || 0) - (a.value || 0);
        case 'grade':
          return (b.grade || 0) - (a.grade || 0);
        case 'recent':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return filtered;
  }, [cards, sortBy, filterBy]);

  const totalValue = cards.reduce((sum, card) => sum + (card.value || 0), 0);
  const averageGrade = cards.filter(c => c.grade).reduce((sum, card) => sum + (card.grade || 0), 0) / cards.filter(c => c.grade).length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Collection not found</p>
          <Link to="/collection">
            <Button variant="secondary" className="mt-4">Back to Collections</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-black pb-24">
      {/* Header with Cover Image */}
      <div className="relative h-48 bg-gray-100 dark:bg-gray-900">
        {collection.coverImage ? (
          <img 
            src={collection.coverImage.startsWith('http') ? collection.coverImage : `https://www.tcgrader.com${collection.coverImage}`} 
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Back Button */}
        <Link to="/collection" className="absolute top-safe left-4 z-20">
          <button className="p-2 bg-white/20 backdrop-blur-xl rounded-lg text-white hover:bg-white/30 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </Link>

        {/* Action Buttons */}
        <div className="absolute top-safe right-4 z-20 flex space-x-2">
          <button 
            onClick={() => setShowShareModal(true)}
            className="p-2 bg-white/20 backdrop-blur-xl rounded-lg text-white hover:bg-white/30 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          {collection.userId === user?._id && (
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="p-2 bg-white/20 backdrop-blur-xl rounded-lg text-white hover:bg-white/30 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Collection Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-3xl font-bold text-white mb-2">{collection?.name || 'Untitled Collection'}</h1>
          {collection?.description && (
            <p className="text-sm text-white/80">{collection.description}</p>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{cards.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cards</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalValue.toLocaleString()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Value</div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{averageGrade.toFixed(1)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg Grade</div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded ${view === 'grid' ? 'bg-white dark:bg-gray-800 shadow' : ''} transition-all`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded ${view === 'list' ? 'bg-white dark:bg-gray-800 shadow' : ''} transition-all`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Sort & Filter */}
          <div className="flex items-center space-x-2">
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm border border-gray-200 dark:border-gray-800"
            >
              <option value="all">All Cards</option>
              <option value="graded">Graded</option>
              <option value="ungraded">Ungraded</option>
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm border border-gray-200 dark:border-gray-800"
            >
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="value">Value</option>
              <option value="grade">Grade</option>
            </select>
          </div>
        </div>

        {/* Selection Mode */}
        {collection.userId === user?._id && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedCards([]);
              }}
              className="text-sm text-primary-600 dark:text-primary-400 font-medium"
            >
              {isSelectionMode ? 'Cancel' : 'Select'}
            </button>

            {isSelectionMode && selectedCards.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCards.length} selected
                </span>
                <button
                  onClick={handleDeleteCards}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards Grid/List */}
      <div className="px-4">
        {sortedAndFilteredCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No cards yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Start adding cards to track their value</p>
            <Button variant="primary" onClick={() => navigate('/grade/submit')}>
              Grade Your First Card
            </Button>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {sortedAndFilteredCards.map((card) => {
              const cardId = card._id || card.id || '';
              const isSelected = selectedCards.includes(cardId);
              const latestGrade = card.gradingResults?.[0] || card.raw?.combined;
              const overallScore = latestGrade?.scores?.overall;
              
              return (
                <div key={cardId} className="group cursor-pointer">
                  <div
                    onClick={() => {
                      if (isSelectionMode) {
                        if (isSelected) {
                          setSelectedCards(selectedCards.filter(id => id !== cardId));
                        } else {
                          setSelectedCards([...selectedCards, cardId]);
                        }
                      } else {
                        handleCardClick(card);
                      }
                    }}
                    className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border ${
                      isSelected ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-50 dark:bg-gray-900">
                      {/* Card Image */}
                      <img 
                        src={(() => {
                          const img = card.imageUrl || card.image || card.frontImage || card.images?.front || `/api/cards/${cardId}/image`;
                          return img.startsWith('http') ? img : `https://www.tcgrader.com${img}`;
                        })()} 
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://www.tcgrader.com/images/card-placeholder.png';
                        }}
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className={`w-5 h-5 rounded ${isSelected ? 'bg-primary-500' : 'bg-white/80 dark:bg-gray-800/80'} border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Grade Badge */}
                      {overallScore && (
                        <div className={`absolute top-2 right-2 rounded-full px-3 py-1.5 shadow-md ${
                          overallScore >= 9 ? 'bg-green-600' :
                          overallScore >= 8 ? 'bg-blue-600' :
                          overallScore >= 7 ? 'bg-yellow-600' :
                          overallScore >= 6 ? 'bg-orange-600' :
                          'bg-red-600'
                        }`}>
                          <span className="text-xs font-bold text-white">
                            {overallScore}
                          </span>
                        </div>
                      )}
                      
                      {/* Card Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <p className="text-xs font-medium opacity-90">{card.type || 'Pokemon'}</p>
                        <p className="font-bold line-clamp-1">{card.name}</p>
                        <p className="text-xs opacity-80">{card.setName || 'Unknown Set'}</p>
                      </div>
                    </div>
                    
                    {/* Card Details Section */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Grade</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {card.createdAt && new Date(card.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        {overallScore ? (
                          <p className={`font-bold text-lg ${
                            overallScore >= 9 ? 'text-green-600 dark:text-green-500' :
                            overallScore >= 8 ? 'text-blue-600 dark:text-blue-500' :
                            overallScore >= 7 ? 'text-yellow-600 dark:text-yellow-500' :
                            overallScore >= 6 ? 'text-orange-600 dark:text-orange-500' :
                            'text-red-600 dark:text-red-500'
                          }`}>
                            {overallScore}/10
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-600">Pending</p>
                        )}
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          ${(card.value || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* List for Sale Button - Outside Card */}
                  {collection.userId === user?._id && !isSelectionMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowListModal(card);
                      }}
                      className="w-full mt-2 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>List for Sale</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedAndFilteredCards.map((card) => {
              const cardId = card._id || card.id || '';
              const isSelected = selectedCards.includes(cardId);
              const latestGrade = card.gradingResults?.[0] || card.raw?.combined;
              const overallScore = latestGrade?.scores?.overall;

              return (
                <div 
                  key={cardId}
                  onClick={() => {
                    if (isSelectionMode) {
                      if (isSelected) {
                        setSelectedCards(selectedCards.filter(id => id !== cardId));
                      } else {
                        setSelectedCards([...selectedCards, cardId]);
                      }
                    } else {
                      handleCardClick(card);
                    }
                  }}
                  className={`flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border ${
                    isSelected ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-100 dark:border-gray-700'
                  }`}
                >
                  {/* Selection Checkbox */}
                  {isSelectionMode && (
                    <div className={`w-5 h-5 rounded ${isSelected ? 'bg-primary-500' : 'bg-white dark:bg-gray-800'} border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}

                  {/* Card Thumbnail */}
                  <div className="relative w-16 h-20 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={(() => {
                        const img = card.imageUrl || card.image || card.frontImage || card.images?.front || `/api/cards/${cardId}/image`;
                        return img.startsWith('http') ? img : `https://www.tcgrader.com${img}`;
                      })()} 
                      alt={card.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://www.tcgrader.com/images/card-placeholder.png';
                      }}
                    />
                    {overallScore && (
                      <div className={`absolute top-1 right-1 rounded px-1.5 py-0.5 ${
                        overallScore >= 9 ? 'bg-green-600' :
                        overallScore >= 8 ? 'bg-blue-600' :
                        overallScore >= 7 ? 'bg-yellow-600' :
                        overallScore >= 6 ? 'bg-orange-600' :
                        'bg-red-600'
                      }`}>
                        <span className="text-[10px] font-bold text-white">{overallScore}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{card.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {card.setName || 'Unknown Set'} {card.cardNumber ? `#${card.cardNumber}` : ''}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {overallScore ? (
                        <span className={`text-sm font-medium ${
                          overallScore >= 9 ? 'text-green-600 dark:text-green-500' :
                          overallScore >= 8 ? 'text-blue-600 dark:text-blue-500' :
                          overallScore >= 7 ? 'text-yellow-600 dark:text-yellow-500' :
                          overallScore >= 6 ? 'text-orange-600 dark:text-orange-500' :
                          'text-red-600 dark:text-red-500'
                        }`}>
                          Grade: {overallScore}/10
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-600">Pending Grade</span>
                      )}
                    </div>
                  </div>

                  {/* Value & Actions */}
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <span className="text-base font-bold text-gray-900 dark:text-white">
                      ${(card.value || 0).toLocaleString()}
                    </span>

                    {collection.userId === user?._id && !isSelectionMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowListModal(card);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      {showCardDetailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Card Details</h2>
              <button
                onClick={() => {
                  setShowCardDetailModal(null);
                  setPriceHistory([]);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Card Image */}
            <div className="mb-6">
              <img 
                src={(() => {
                  const img = showCardDetailModal.imageUrl || showCardDetailModal.image || showCardDetailModal.frontImage || showCardDetailModal.images?.front || `/api/cards/${showCardDetailModal._id || showCardDetailModal.id}/image`;
                  return img.startsWith('http') ? img : `https://www.tcgrader.com${img}`;
                })()}
                alt={showCardDetailModal.name}
                className="w-full max-h-96 object-contain rounded-xl bg-gray-100 dark:bg-gray-800"
                onError={(e) => {
                  e.currentTarget.src = 'https://www.tcgrader.com/images/card-placeholder.png';
                }}
              />
            </div>

            {/* Card Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{showCardDetailModal.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {showCardDetailModal.setName || 'Unknown Set'} 
                  {showCardDetailModal.cardNumber && ` • #${showCardDetailModal.cardNumber}`}
                  {showCardDetailModal.rarity && ` • ${showCardDetailModal.rarity}`}
                </p>
              </div>

              {/* Grade Information */}
              {(() => {
                const latestGrade = showCardDetailModal.gradingResults?.[0] || showCardDetailModal.raw?.combined;
                if (!latestGrade?.scores) return null;
                
                const scores = latestGrade.scores;
                const model = latestGrade.model || 'dual-ai';
                
                return (
                  <>
                    <div className={`p-4 rounded-xl text-white ${
                      scores.overall >= 9 ? 'bg-gradient-to-r from-green-600 to-green-700' :
                      scores.overall >= 8 ? 'bg-gradient-to-r from-blue-600 to-blue-700' :
                      scores.overall >= 7 ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' :
                      scores.overall >= 6 ? 'bg-gradient-to-r from-orange-600 to-orange-700' :
                      'bg-gradient-to-r from-red-600 to-red-700'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm opacity-90">AI Grade</p>
                          <p className="text-3xl font-bold">{scores.overall}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm opacity-90">{model === 'dual-ai' ? 'Dual AI' : 'AI v4'}</p>
                          {latestGrade.createdAt && (
                            <p className="text-xs opacity-75">
                              {new Date(latestGrade.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Subgrades */}
                      <div className="grid grid-cols-5 gap-2 mt-4">
                        <div className="text-center">
                          <div className="text-xs opacity-75">Corners</div>
                          <div className="font-semibold">{scores.corners}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs opacity-75">Edges</div>
                          <div className="font-semibold">{scores.edges}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs opacity-75">Surface</div>
                          <div className="font-semibold">{scores.surface}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs opacity-75">Centering</div>
                          <div className="font-semibold">{scores.centering}</div>
                        </div>
                        {scores.holographic !== undefined && (
                          <div className="text-center">
                            <div className="text-xs opacity-75">Holo</div>
                            <div className="font-semibold">{scores.holographic}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* AI Summary */}
                    {latestGrade.summary && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Assessment</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{latestGrade.summary}</p>
                      </div>
                    )}
                    
                    {/* Defects */}
                    {latestGrade.defects && latestGrade.defects.length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Identified Issues</h4>
                        <div className="space-y-2">
                          {latestGrade.defects.slice(0, 3).map((defect, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                Number(defect.significancy) > 50 ? 'bg-red-500' : 
                                Number(defect.significancy) > 25 ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{defect.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{defect.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Value Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current Value</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ${(showCardDetailModal.value || showCardDetailModal.marketValue || 0).toLocaleString()}
                  </p>
                </div>
                {showCardDetailModal.acquiredPrice && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Acquired Price</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      ${showCardDetailModal.acquiredPrice.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Price History Chart */}
              {!loadingPriceHistory && priceHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">30-Day Price History</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                    <div className="h-32 flex items-end space-x-1">
                      {priceHistory.map((point, index) => {
                        const maxPrice = Math.max(...priceHistory.map(p => p.price || 0));
                        const height = maxPrice > 0 ? (point.price / maxPrice) * 100 : 0;
                        return (
                          <div
                            key={index}
                            className="flex-1 bg-primary-500 rounded-t"
                            style={{ height: `${height}%` }}
                            title={`$${point.price} on ${new Date(point.date).toLocaleDateString()}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>30 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {showCardDetailModal.notes && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{showCardDetailModal.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {collection?.userId === user?._id && (
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this card from your collection?')) {
                        const cardId = showCardDetailModal._id || showCardDetailModal.id;
                        if (cardId) {
                          try {
                            await api.removeCardFromCollection(id!, cardId);
                            // Refresh cards list
                            await fetchCollectionCards();
                            setShowCardDetailModal(null);
                          } catch (error) {
                            console.error('Failed to delete card:', error);
                            alert('Failed to delete card. Please try again.');
                          }
                        }
                      }
                    }}
                    className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </div>
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setShowCardDetailModal(null);
                      setShowListModal(showCardDetailModal);
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>List for Sale</span>
                    </div>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List for Sale Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">List for Sale</h2>
              <button
                onClick={() => setShowListModal(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Card Preview */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <img 
                  src={(() => {
                    const img = showListModal.imageUrl || showListModal.image || showListModal.frontImage || showListModal.images?.front || `/api/cards/${showListModal._id || showListModal.id}/image`;
                    return img.startsWith('http') ? img : `https://www.tcgrader.com${img}`;
                  })()}
                  alt={showListModal.name}
                  className="w-16 h-20 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://www.tcgrader.com/images/card-placeholder.png';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{showListModal.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {showListModal.grade ? `Grade ${showListModal.grade}` : 'Ungraded'}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    Est. Value: ${(showListModal.value || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Listing Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Listing Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    defaultValue={showListModal.value}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Quick Price Options */}
              <div className="flex space-x-2">
                <button className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  -10%
                </button>
                <button className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  Market
                </button>
                <button className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  +10%
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowListModal(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    // TODO: Implement listing logic
                    alert('Listing functionality coming soon!');
                    setShowListModal(null);
                  }}
                >
                  List Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Share Collection</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  handleShare();
                  setShowShareModal(false);
                }}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center space-x-3"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-gray-900 dark:text-white font-medium">Share Link</span>
              </button>

              <button
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?text=Check out my ${collection.name} collection on TCGrader&url=${window.location.href}`, '_blank');
                  setShowShareModal(false);
                }}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center space-x-3"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span className="text-gray-900 dark:text-white font-medium">Share on Twitter</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 p-3 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Collection Settings</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate(`/collection/${id}/edit`)}
                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white font-medium">Edit Collection</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white font-medium">Collection Analytics</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this collection? This cannot be undone.')) {
                      // TODO: Implement delete
                      api.deleteCollection(id!).then(() => {
                        navigate('/collection');
                      });
                    }
                  }}
                  className="w-full p-4 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center space-x-3"
                >
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-red-600 font-medium">Delete Collection</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetailPage;