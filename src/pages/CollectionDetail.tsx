import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import apiService from '../services/api';
import Button from '../components/common/Button';
import tcgraderLogo from '../assets/tcgrader-logo.png';

interface CollectionCard {
  _id: string;
  name: string;
  set: string;
  year: string;
  imageUrl?: string;
  gradingResults?: {
    grade?: number;
    gradeLabel?: string;
  };
  currentPrice?: number;
  priceChange?: number;
}

interface Collection {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  coverImage?: string;
  cardCount: number;
  totalValue?: number;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  totalValue: number;
  totalCards: number;
  averageCardValue: number;
  mostValuableCard?: {
    name: string;
    value: number;
    grade?: number;
  };
  priceHistory: Array<{
    month: string;
    value: number;
  }>;
  gradeDistribution: Array<{
    grade: string;
    count: number;
    color: string;
  }>;
  setDistribution: Array<{
    name: string;
    count: number;
  }>;
}

const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cards' | 'analytics'>('cards');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'grade'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'graded' | 'ungraded'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    coverImage: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCardSelector, setShowCardSelector] = useState(false);

  const isOwner = collection?.userId === user?._id || collection?.userId === user?.id;

  useEffect(() => {
    if (id) {
      fetchCollectionData();
    }
  }, [id]);

  const fetchCollectionData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch collection details and cards in parallel
      const [collectionResponse, cardsResponse] = await Promise.all([
        apiService.getCollection(id!),
        apiService.get(`/api/collections/${id}/cards`)
      ]);

      const collectionData = collectionResponse.collection || collectionResponse;
      setCollection(collectionData);
      setEditFormData({
        name: collectionData.name,
        description: collectionData.description || '',
        isPublic: collectionData.isPublic,
        coverImage: collectionData.coverImage || ''
      });

      // Handle the response structure properly - API returns {success: true, cards: [...]} structure
      const cardsArray = cardsResponse.success && cardsResponse.cards ? cardsResponse.cards : 
                        cardsResponse.data?.cards || cardsResponse.cards || [];
      
      // Map the card data to our expected structure based on the API response format
      const mappedCards = cardsArray.map((card: any) => ({
        _id: card._id || card.id,
        name: card.name || card.info?.name || 'Unknown Card',
        set: card.set || card.info?.set || 'Unknown Set',
        year: card.year || card.info?.year || new Date().getFullYear().toString(),
        imageUrl: card.images?.front || card.raw?.frontUrl || card.frontUrl,
        gradingResults: card.gradingResults?.[0] ? {
          grade: card.gradingResults[0].scores?.overall || card.raw?.combined?.scores?.overall,
          gradeLabel: card.gradingResults[0].scores?.overall ? `PSA ${card.gradingResults[0].scores.overall}` : undefined
        } : card.raw?.combined?.scores?.overall ? {
          grade: card.raw.combined.scores.overall,
          gradeLabel: `PSA ${card.raw.combined.scores.overall}`
        } : undefined,
        currentPrice: Number(card.prices?.currentPrice || card.estimatedRawValue || card.raw?.estimatedRawValue || 0),
        priceChange: card.prices?.priceChange !== undefined ? Number(card.prices.priceChange) : 
                     card.raw?.priceChange !== undefined ? Number(card.raw.priceChange) : undefined
      }));
      
      setCards(mappedCards);

      // Fetch analytics if owner
      if (isOwner) {
        try {
          const analyticsResponse = await apiService.get(`/api/collections/${id}/analytics`);
          setAnalytics(analyticsResponse.data);
        } catch (error) {
          console.error('Failed to fetch analytics:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch collection:', error);
      // If not authorized or not found, redirect back
      navigate('/collection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCollection = async () => {
    if (!editFormData.name.trim()) return;
    
    setIsUpdating(true);
    try {
      await apiService.updateCollection(id!, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        isPublic: editFormData.isPublic,
        coverImage: editFormData.coverImage
      });
      
      // Update local state
      setCollection(prev => prev ? {
        ...prev,
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        isPublic: editFormData.isPublic,
        coverImage: editFormData.coverImage
      } : null);
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update collection:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiService.deleteCollection(id!);
      navigate('/collection');
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const handleFetchPrices = async () => {
    setIsFetchingPrices(true);
    try {
      const response = await apiService.post(`/api/collections/${id}/fetch-prices`);
      const results = response.data?.results || response.results;
      
      if (results?.cardsAffected > 0) {
        // Refresh cards to show updated prices
        const cardsResponse = await apiService.get(`/api/collections/${id}/cards`);
        const cardsArray = cardsResponse.success && cardsResponse.cards ? cardsResponse.cards : 
                          cardsResponse.data?.cards || cardsResponse.cards || [];
        
        // Re-map the updated cards
        const updatedCards = cardsArray.map((card: any) => ({
          _id: card._id || card.id,
          name: card.name || card.info?.name || 'Unknown Card',
          set: card.set || card.info?.set || 'Unknown Set',
          year: card.year || card.info?.year || new Date().getFullYear().toString(),
          imageUrl: card.images?.front || card.raw?.frontUrl || card.frontUrl,
          gradingResults: card.gradingResults?.[0] ? {
            grade: card.gradingResults[0].scores?.overall || card.raw?.combined?.scores?.overall,
            gradeLabel: card.gradingResults[0].scores?.overall ? `PSA ${card.gradingResults[0].scores.overall}` : undefined
          } : card.raw?.combined?.scores?.overall ? {
            grade: card.raw.combined.scores.overall,
            gradeLabel: `PSA ${card.raw.combined.scores.overall}`
          } : undefined,
          currentPrice: Number(card.prices?.currentPrice || card.estimatedRawValue || card.raw?.estimatedRawValue || 0),
          priceChange: card.prices?.priceChange !== undefined ? Number(card.prices.priceChange) : 
                       card.raw?.priceChange !== undefined ? Number(card.raw.priceChange) : undefined
        }));
        setCards(updatedCards);
        
        // Refresh analytics
        if (isOwner) {
          const analyticsResponse = await apiService.get(`/api/collections/${id}/analytics`);
          setAnalytics(analyticsResponse.data);
        }
      }
      
      alert(`Updated prices for ${results?.cardsAffected || 0} cards`);
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      alert('Failed to update prices');
    } finally {
      setIsFetchingPrices(false);
    }
  };

  const handleUpdateCardPrice = async (cardId: string) => {
    setUpdatingCardId(cardId);
    try {
      // Call the price update API for a specific card
      await apiService.post(`/api/collections/${id}/fetch-prices`, {
        cardIds: [cardId]
      });
      
      // Refresh the collection data to get updated prices
      await fetchCollectionData();
    } catch (error) {
      console.error('Failed to update card price:', error);
    } finally {
      setUpdatingCardId(null);
    }
  };

  const handleRemoveCards = async () => {
    if (selectedCards.size === 0) return;
    
    if (!confirm(`Remove ${selectedCards.size} card(s) from this collection?`)) {
      return;
    }
    
    try {
      await apiService.post(`/api/collections/${id}/remove-cards`, {
        cardIds: Array.from(selectedCards)
      });
      
      // Remove cards from local state
      setCards(prev => prev.filter(card => !selectedCards.has(card._id)));
      setSelectedCards(new Set());
      setIsSelectionMode(false);
      
      // Update collection card count
      setCollection(prev => prev ? {
        ...prev,
        cardCount: prev.cardCount - selectedCards.size
      } : null);
    } catch (error) {
      console.error('Failed to remove cards:', error);
    }
  };

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const filteredCards = cards.filter(card => {
    if (filterBy === 'graded') return card.gradingResults?.grade;
    if (filterBy === 'ungraded') return !card.gradingResults?.grade;
    return true;
  });

  const sortedCards = [...filteredCards].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return (b.currentPrice || 0) - (a.currentPrice || 0);
      case 'grade':
        return (b.gradingResults?.grade || 0) - (a.gradingResults?.grade || 0);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 animate-pulse">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-48"></div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-16 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-12 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 dark:bg-slate-700"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-16 mb-2"></div>
                  <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Collection not found</p>
          <Link to="/collection">
            <Button>Back to Collections</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Professional Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/collection" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <img src={tcgraderLogo} alt="TCGrader" className="h-8 w-auto" />
                <div className="text-gray-400 text-xl font-light">/</div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs">
                  {collection.name}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isOwner && (
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  {showDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-40">
                        <button
                          onClick={() => { setShowEditModal(true); setShowDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors rounded-t-lg"
                        >
                          Edit Collection
                        </button>
                        <button
                          onClick={() => { handleDeleteCollection(); setShowDropdown(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-lg"
                        >
                          Delete Collection
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* Collection Stats Header */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{collection.name}</h2>
                {collection.description && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{collection.description}</p>
                )}
              </div>
              {collection.isPublic && (
                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm font-medium px-3 py-1 rounded-full">
                  Public
                </span>
              )}
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{collection.cardCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cards</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${analytics ? (
                    (analytics.totalValue || 0) >= 1000 
                      ? `${((analytics.totalValue || 0) / 1000).toFixed(1)}K` 
                      : (analytics.totalValue || 0).toLocaleString()
                  ) : '0'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${analytics ? (analytics.averageCardValue || 0).toFixed(0) : '0'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Value</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {analytics?.gradeDistribution ? (
                    analytics.gradeDistribution.reduce((sum, grade) => grade.grade !== 'Ungraded' ? sum + grade.count : sum, 0)
                  ) : '0'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Graded</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 mb-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('cards')}
                className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                  activeTab === 'cards'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Cards ({cards.length})
              </button>
              {isOwner && analytics && (
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === 'analytics'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Analytics
                </button>
              )}
            </div>
            
            {/* Update Prices Button */}
            {isOwner && activeTab === 'cards' && (
              <div className="pr-6">
                <button
                  onClick={handleFetchPrices}
                  disabled={isFetchingPrices}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  {isFetchingPrices ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="hidden sm:inline">Update Prices</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'cards' ? (
          <>
            {/* Professional Controls */}
            {cards.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 mb-6">
                <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
                  <div className="space-y-3 md:space-y-0 md:flex md:items-center md:space-x-4 w-full md:w-auto">
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as any)}
                      className="w-full md:w-auto px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-900 dark:text-gray-200"
                    >
                      <option value="all">All Cards</option>
                      <option value="graded">Graded Only</option>
                      <option value="ungraded">Ungraded Only</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full md:w-auto px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-900 dark:text-gray-200"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="value">Sort by Value</option>
                      <option value="grade">Sort by Grade</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 justify-end">
                    {isOwner && (
                      <>
                        {isSelectionMode && selectedCards.size > 0 && (
                          <button
                            onClick={handleRemoveCards}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            Remove ({selectedCards.size})
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            setSelectedCards(new Set());
                          }}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            isSelectionMode 
                              ? 'bg-gray-600 hover:bg-gray-700 text-white'
                              : 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {isSelectionMode ? 'Cancel' : 'Select'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Professional Card Grid */}
            {sortedCards.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Cards Yet</h3>
                <p className="text-gray-600 dark:text-gray-400">Add cards to this collection to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {sortedCards.map((card, index) => (
                  <div
                    key={card._id}
                    className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group cursor-pointer ${
                      isSelectionMode && selectedCards.has(card._id)
                        ? 'ring-2 ring-blue-500 border-blue-500'
                        : ''
                    }`}
                    onClick={() => isSelectionMode && toggleCardSelection(card._id)}
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.5s ease-out forwards'
                    }}
                  >
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-slate-700 relative overflow-hidden">
                      {card.imageUrl ? (
                        <img 
                          src={card.imageUrl} 
                          alt={card.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Grade Badge */}
                      {card.gradingResults?.grade && (
                        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1">
                          <span className="text-xs font-bold text-white">
                            PSA {card.gradingResults.grade}
                          </span>
                        </div>
                      )}
                      
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div className="absolute top-3 left-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            selectedCards.has(card._id)
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-white/80 border-gray-300 hover:border-blue-400'
                          }`}>
                            {selectedCards.has(card._id) && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">{card.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{card.set} • {card.year}</p>
                      
                      <div className="flex items-center justify-between">
                        {card.currentPrice && !isNaN(card.currentPrice) && card.currentPrice > 0 ? (
                          <>
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              ${card.currentPrice.toFixed(2)}
                            </div>
                            {card.priceChange !== undefined && (
                              <div className={`text-sm font-medium ${
                                card.priceChange >= 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {card.priceChange >= 0 ? '+' : ''}{card.priceChange.toFixed(1)}%
                              </div>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateCardPrice(card._id);
                            }}
                            disabled={updatingCardId === card._id}
                            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center"
                          >
                            {updatingCardId === card._id ? (
                              <>
                                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Update Price
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Analytics Tab */
          analytics && (
            <div className="space-y-6">
              {/* Value Overview */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Value</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    ${analytics.totalValue >= 1000 
                      ? `${(analytics.totalValue / 1000).toFixed(1)}K` 
                      : analytics.totalValue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Card Value</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    ${(analytics.averageCardValue || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Most Valuable Card */}
              {analytics.mostValuableCard && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Most Valuable Card</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{analytics.mostValuableCard.name}</p>
                      {analytics.mostValuableCard.grade && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Grade {analytics.mostValuableCard.grade}
                        </p>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${(analytics.mostValuableCard.value || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Grade Distribution */}
              {analytics.gradeDistribution.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Grade Distribution</h3>
                  <div className="space-y-3">
                    {analytics.gradeDistribution.map((grade) => (
                      <div key={grade.grade} className="flex items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-20">
                          {grade.grade}
                        </span>
                        <div className="flex-1 mx-4 bg-gray-200 dark:bg-slate-700 rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(grade.count / analytics.totalCards) * 100}%`,
                              backgroundColor: grade.color
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                          {grade.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Edit Modal - Keeping the existing modal for now */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-slate-700/40">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-5">Edit Collection</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateCollection(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all resize-none text-gray-900 dark:text-gray-200"
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isPublic}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 bg-white dark:bg-slate-900/50 border-gray-300 dark:border-slate-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Make this collection public
                  </span>
                </label>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={isUpdating}
                  disabled={isUpdating || !editFormData.name.trim()}
                >
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CollectionDetailPage;