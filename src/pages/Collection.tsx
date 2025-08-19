import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCollectionStore, useAuthStore } from '../store';
import { Collection as CollectionType } from '../types';
import { SUBSCRIPTION_LIMITS } from '../constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import tcgraderLogo from '../assets/tcgrader-logo.png';
import api from '../services/api';

const CollectionPage: React.FC = () => {
  const { collections, setCollections, addCollection } = useCollectionStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUncollectedCards, setShowUncollectedCards] = useState(false);
  const [uncollectedCards, setUncollectedCards] = useState<any[]>([]);
  const [loadingUncollected, setLoadingUncollected] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);

  const subscriptionType = user?.subscription?.type === 'merchant' 
    ? 'business' 
    : (user?.subscription?.type || 'free');
  const subscriptionLimits = user ? SUBSCRIPTION_LIMITS[subscriptionType] : null;
  const canCreateCollection = subscriptionLimits && (
    subscriptionLimits.collectionsAllowed === -1 || 
    collections.length < subscriptionLimits.collectionsAllowed
  );

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchUncollectedCards = async () => {
    setLoadingUncollected(true);
    try {
      // First try the dedicated uncollected endpoint
      const response = await api.getUncollectedCards();
      const cards = response.cards || response.data || response || [];
      setUncollectedCards(Array.isArray(cards) ? cards : []);
    } catch (error) {
      console.error('Failed to fetch uncollected cards:', error);
      
      try {
        // Fallback: calculate uncollected cards from all cards minus collection cards
        const [allCardsResponse] = await Promise.all([
          api.getMyCards()
        ]);
        
        const allCards = allCardsResponse.cards || [];
        
        // Get all card IDs that are in collections
        const collectedCardIds = new Set<string>();
        for (const collection of collections) {
          try {
            const collectionResponse = await api.get(`/api/collections/${collection._id}/cards`);
            const collectionCards = collectionResponse.success && collectionResponse.cards 
              ? collectionResponse.cards 
              : collectionResponse.data?.cards || collectionResponse.cards || [];
            
            collectionCards.forEach((card: any) => {
              collectedCardIds.add(card._id || card.id);
            });
          } catch (collectionError) {
            console.warn(`Failed to fetch cards for collection ${collection.name}:`, collectionError);
          }
        }
        
        // Filter out cards that are in collections
        const uncollectedCards = allCards.filter((card: any) => 
          !collectedCardIds.has(card._id || card.id)
        );
        
        setUncollectedCards(uncollectedCards);
      } catch (fallbackError) {
        console.error('Fallback uncollected cards calculation failed:', fallbackError);
        setUncollectedCards([]);
      }
    } finally {
      setLoadingUncollected(false);
    }
  };

  const handleToggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      return [...prev, cardId];
    });
  };

  const handleAddToCollection = async () => {
    if (!selectedCollection || selectedCards.length === 0) return;
    
    setIsAddingToCollection(true);
    try {
      await api.post(`/api/collections/${selectedCollection}/cards`, {
        cardIds: selectedCards
      });
      
      // Remove added cards from uncollected list
      setUncollectedCards(prev => prev.filter(card => !selectedCards.includes(card._id)));
      setSelectedCards([]);
      setShowAddToCollectionModal(false);
      setSelectedCollection(null);
      
      // Refresh collections to update counts
      fetchCollections();
    } catch (error) {
      console.error('Failed to add cards to collection:', error);
    } finally {
      setIsAddingToCollection(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await api.getCollections();
      const collectionsData = response.collections || response.data || [];
      
      // Process collections with real data - keep original _id
      const processedCollections = await Promise.all(
        collectionsData.map(async (collection: any) => {
          let calculatedValue = collection.totalValue || collection.value || 0;
          
          // If collection has cards but no value, fetch the cards and calculate
          if (calculatedValue === 0 && (collection.cardCount > 0)) {
            try {
              const collectionResponse = await api.get(`/api/collections/${collection._id || collection.id}`);
              const cards = collectionResponse.cards || collectionResponse.data?.cards || [];
              
              calculatedValue = cards.reduce((sum: number, card: any) => {
                // Try different possible price fields
                const cardValue = card.currentPrice || 
                                card.marketPrice || 
                                card.price || 
                                card.value ||
                                (card.pricing && card.pricing.current) ||
                                0;
                return sum + cardValue;
              }, 0);
            } catch (error) {
              console.error(`Failed to fetch cards for collection ${collection.name}:`, error);
              // Keep the original value (0) if we can't fetch cards
            }
          }
          
          return {
            ...collection,
            id: collection._id || collection.id, // Keep _id as id for compatibility
            _id: collection._id || collection.id, // Also keep original _id
            cardCount: collection.cardCount || collection.cards?.length || 0,
            value: calculatedValue
          };
        })
      );
      
      setCollections(processedCollections);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      // Set empty array on error
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Collection name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCollection = async () => {
    if (!validateForm()) return;
    
    setIsCreating(true);
    try {
      const response = await api.createCollection({
        name: formData.name.trim(),
        description: formData.description.trim(),
        isPublic: formData.isPublic
      });
      
      // Add the new collection with proper structure
      const newCollection = {
        ...response,
        id: response._id || response.id,
        _id: response._id || response.id,
        cardCount: response.cardCount || 0,
        value: response.value || 0,
        createdAt: response.createdAt || new Date().toISOString(),
        updatedAt: response.updatedAt || new Date().toISOString()
      };
      
      addCollection(newCollection);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', isPublic: false });
      
      // Refresh collections to get accurate data
      fetchCollections();
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'Failed to create collection' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errors[e.target.name]) {
      setErrors(prev => ({
        ...prev,
        [e.target.name]: ''
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        {/* Fixed Header Skeleton */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/40 safe-area-top">
          <div className="max-w-md mx-auto px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 dark:bg-slate-700/50 rounded-full pl-3 pr-1 py-1">
                  <div className="flex items-center space-x-3">
                    <div className="space-y-1">
                      <div className="h-3 w-20 bg-gray-200 dark:bg-slate-600 rounded animate-pulse"></div>
                      <div className="h-2 w-16 bg-gray-200 dark:bg-slate-600 rounded animate-pulse"></div>
                    </div>
                    <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-md mx-auto px-5 py-6 pb-24 pt-24">
          <div className="mb-6">
            <div className="h-8 w-40 bg-gray-200 dark:bg-slate-700 rounded mb-2 animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
          
          {/* Collection Stats Skeleton */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-3 border border-gray-200 dark:border-slate-700/40">
                <div className="h-3 w-16 bg-gray-200 dark:bg-slate-700 rounded mb-2 animate-pulse"></div>
                <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          
          {/* Collection Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800/70 rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-slate-700"></div>
                <div className="p-5">
                  <div className="h-5 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 w-48 bg-gray-200 dark:bg-slate-700 rounded mb-3"></div>
                  <div className="flex items-center space-x-4">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Fixed Header - Consistent with Dashboard */}
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

      <div className="max-w-md mx-auto px-5 py-6 pb-24 pt-24">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-1">My Collections</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {collections.length} collection{collections.length !== 1 ? 's' : ''} • 
            {' '}{subscriptionLimits?.collectionsAllowed === -1 ? 'Unlimited' : `${collections.length}/${subscriptionLimits?.collectionsAllowed}`} allowed
          </p>
        </header>

        {/* Collection Stats Summary */}
        {collections.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-200 dark:border-slate-700/40">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Cards</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {collections.reduce((sum, col) => sum + (col.cardCount || 0), 0)}
              </p>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-200 dark:border-slate-700/40">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Value</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ${(() => {
                  const totalValue = collections.reduce((sum, col) => sum + (col.value || 0), 0);
                  return totalValue >= 1000 
                    ? `${(totalValue / 1000).toFixed(1)}K` 
                    : totalValue.toFixed(2);
                })()}
              </p>
            </div>
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-200 dark:border-slate-700/40">
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Public</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {collections.filter(col => col.isPublic).length}
              </p>
            </div>
          </div>
        )}

        {collections.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-200">No Collections Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Create your first collection to start organizing your trading cards.
            </p>
            {canCreateCollection ? (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Collection</span>
                </div>
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Collection limit reached for your plan
                </p>
                <Link to="/subscription">
                  <Button variant="accent">Upgrade Plan</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Create Collection Button */}
            {canCreateCollection && (
              <div className="mb-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 rounded-lg p-4 text-left transition-all group flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-slate-600 transition-colors">
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Create New Collection</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Organize your graded cards</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Collections List */}
            <div>
              {collections.map((collection, index) => (
                <div key={collection._id || collection.id} className={index > 0 ? "mt-6" : ""}>
                  <Link to={`/collection/${collection._id || collection.id}`}>
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:border-gray-300 dark:hover:border-slate-600 transition-all group">
                      <div className="flex min-h-[80px]">
                        {/* Preview Image */}
                        <div className="w-20 bg-gray-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                          {collection.coverImage ? (
                            <img 
                              src={collection.coverImage} 
                              alt={`${collection.name} preview`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            </div>
                          )}
                        </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                                {collection.name}
                              </h3>
                              {collection.isPublic && (
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-medium px-2 py-0.5 rounded-full">
                                  Public
                                </span>
                              )}
                            </div>
                            {collection.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {collection.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Stats Row */}
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {collection.cardCount || 0} {collection.cardCount === 1 ? 'Card' : 'Cards'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-400">
                              ${collection.value >= 1000 
                                ? `${(collection.value / 1000).toFixed(1)}K` 
                                : (collection.value || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {new Date(collection.updatedAt || collection.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Upgrade Prompt */}
            {!canCreateCollection && collections.length > 0 && (
              <div className="mt-8 bg-gradient-to-br from-accent-50 to-pink-50 dark:from-accent-900/20 dark:to-pink-900/20 rounded-3xl p-8 text-center border border-accent-200 dark:border-accent-800/40 shadow-lg">
                <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200 mb-2">
                  Collection Limit Reached
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Upgrade to Premium for unlimited collections and advanced features
                </p>
                <Link to="/subscription">
                  <Button variant="accent" size="lg">
                    Upgrade to Premium
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Uncollected Cards Section */}
        <div className="mt-8">
          <button
            onClick={() => {
              if (!showUncollectedCards) {
                // Always fetch fresh data when opening to ensure we have the latest
                fetchUncollectedCards();
              }
              setShowUncollectedCards(!showUncollectedCards);
            }}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold">Uncollected Cards</h3>
                  <p className="text-sm text-white/80">Organize your loose cards</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {loadingUncollected ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {uncollectedCards.length > 0 && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        {uncollectedCards.length}
                      </span>
                    )}
                    <svg 
                      className={`w-5 h-5 transition-transform duration-300 ${showUncollectedCards ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </div>
            </div>
          </button>

          {/* Uncollected Cards Grid */}
          {showUncollectedCards && (
            <div className="mt-4 space-y-4 animate-fade-in">
              {loadingUncollected ? (
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : uncollectedCards.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-8 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">All your cards are organized!</p>
                </div>
              ) : (
                <>
                  {/* Selection Actions */}
                  {selectedCards.length > 0 && (
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 flex items-center justify-between animate-fade-in">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-800/30 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{selectedCards.length}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">cards selected</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedCards([])}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setShowAddToCollectionModal(true)}
                          className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                          Add to Collection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cards Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {uncollectedCards.map((card) => {
                      const isSelected = selectedCards.includes(card._id);
                      return (
                        <div
                          key={card._id}
                          onClick={() => handleToggleCardSelection(card._id)}
                          className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                            isSelected 
                              ? 'ring-4 ring-primary-500 transform scale-95' 
                              : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
                          }`}
                        >
                          <img 
                            src={card.images?.front || card.images?.frontUrl || card.imageUrl || card.raw?.frontUrl} 
                            alt={card.name || 'Card'}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Selection Overlay */}
                          <div className={`absolute inset-0 transition-all duration-300 ${
                            isSelected 
                              ? 'bg-primary-600/30' 
                              : 'bg-black/0 hover:bg-black/10'
                          }`}>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center animate-scale-in">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          {/* Card Info */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="text-xs text-white font-medium truncate">
                              {card.name || card.info?.name || 'Unknown Card'}
                            </p>
                            {(card.grades?.overall || card.gradingResults?.[0]?.scores?.overall || card.raw?.combined?.scores?.overall) && (
                              <p className="text-xs text-white/80">
                                Grade: {card.grades?.overall || card.gradingResults?.[0]?.scores?.overall || card.raw?.combined?.scores?.overall}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-slate-700/40">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-200 mb-5">Create New Collection</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleCreateCollection(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collection Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Pokémon Cards"
                  error={errors.name}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Add a description for your collection..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all resize-none text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 bg-white dark:bg-slate-900/50 border-gray-300 dark:border-slate-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Make this collection public
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                  Public collections can be viewed by other users
                </p>
              </div>
              
              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  {errors.submit}
                </div>
              )}
              
              <div className="flex space-x-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: '', description: '', isPublic: false });
                    setErrors({});
                  }}
                  className="flex-1"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={isCreating}
                  disabled={isCreating}
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add to Collection Modal */}
      {showAddToCollectionModal && selectedCards.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl p-6 w-full max-w-md animate-slide-up safe-area-bottom">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">Add to Collection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Select a collection for your {selectedCards.length} card{selectedCards.length > 1 ? 's' : ''}
            </p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
              {collections.map((collection) => (
                <button
                  key={collection._id}
                  onClick={() => setSelectedCollection(collection._id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedCollection === collection._id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-200">{collection.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {collection.cardCount} cards • ${(collection.value || 0).toFixed(2)}
                      </p>
                    </div>
                    {selectedCollection === collection._id && (
                      <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddToCollectionModal(false);
                  setSelectedCollection(null);
                }}
                className="flex-1"
                disabled={isAddingToCollection}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddToCollection}
                disabled={!selectedCollection || isAddingToCollection}
                loading={isAddingToCollection}
                className="flex-1"
              >
                Add Cards
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionPage;