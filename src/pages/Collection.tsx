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
  const { collections, setCollections, addCollection, updateCollection } = useCollectionStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingCover, setIsUpdatingCover] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [collectionCards, setCollectionCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  const subscriptionLimits = user ? SUBSCRIPTION_LIMITS[user.subscription?.type || 'free'] : null;
  const canCreateCollection = subscriptionLimits && (
    subscriptionLimits.collectionsAllowed === -1 || 
    (Array.isArray(collections) ? collections.length : 0) < subscriptionLimits.collectionsAllowed
  );

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await api.getCollections();
      const collectionsData = Array.isArray(response) ? response : (response?.collections || []);
      setCollections(collectionsData);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollectionCards = async (collectionId: string) => {
    setLoadingCards(true);
    try {
      // First try to get the full collection data which might include cards
      const collectionResponse = await api.getCollection(collectionId);
      if (collectionResponse.cards && Array.isArray(collectionResponse.cards)) {
        setCollectionCards(collectionResponse.cards);
        console.log('Found cards in collection response:', collectionResponse.cards);
      } else {
        // If no cards in collection response, try the cards endpoint
        const response = await api.get(`/api/collections/${collectionId}/cards`);
        // Handle different response formats
        const cards = response.cards || response.data || response || [];
        setCollectionCards(Array.isArray(cards) ? cards : []);
        console.log('Fetched cards from cards endpoint:', cards);
      }
    } catch (error) {
      console.error('Failed to fetch collection cards:', error);
      // Try one more time with a different endpoint structure
      try {
        const response = await api.get(`/api/collections/${collectionId}`);
        if (response.cards && Array.isArray(response.cards)) {
          setCollectionCards(response.cards);
          console.log('Found cards in fallback collection response:', response.cards);
        } else {
          setCollectionCards([]);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setCollectionCards([]);
      }
    } finally {
      setLoadingCards(false);
    }
  };

  const handleUpdateCover = async (collectionId: string, cardImageUrl: string) => {
    setIsUpdatingCover(true);
    try {
      // Update the collection with the image URL
      const updatedCollection = await api.updateCollection(collectionId, { coverImage: cardImageUrl });
      
      // Update local state immediately with the full image URL
      // Use the store's update method instead of manually updating
      useCollectionStore.getState().updateCollection(collectionId, { 
        coverImage: updatedCollection.coverImage || cardImageUrl 
      });
      
      // Force a re-render by fetching collections again
      const updatedCollections = useCollectionStore.getState().collections;
      setCollections([...updatedCollections]);
      setShowCoverModal(null);
      setCollectionCards([]);
    } catch (error: any) {
      console.error('Failed to update cover:', error);
    } finally {
      setIsUpdatingCover(false);
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
      
      // Handle nested response structure
      const newCollection = response.collection || response;
      addCollection(newCollection);
      
      // Update the local collections array to trigger re-render
      const updatedCollections = [...collections, newCollection];
      setCollections(updatedCollections);
      
      setShowCreateModal(false);
      setFormData({ name: '', description: '', isPublic: false });
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </div>
    );
  }

  const totalValue = Array.isArray(collections) 
    ? collections.reduce((sum, col) => sum + (col.value || 0), 0)
    : 0;

  const totalCards = Array.isArray(collections)
    ? collections.reduce((sum, col) => sum + (col.cardCount || 0), 0)
    : 0;

  return (
    <div className="min-h-screen dark:bg-black">
      {/* Fixed Header - Premium Design */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 safe-area-top">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img src={tcgraderLogo} alt="TCGrader" className="h-8 w-auto" />
            </Link>
            <Link to="/profile" className="tap-target">
              {user?.avatar ? (
                <img 
                  src={`https://www.tcgrader.com${user.avatar}`} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {user?.username?.charAt(0) || user?.name?.charAt(0)}
                  </span>
                </div>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 pb-24 pt-20">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Collections</h1>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Organize and track your graded cards
            </p>
          </div>
        </div>

        {/* Stats Overview - Premium Card Design */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalCards.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Cards</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalValue.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Value</div>
          </div>
        </div>

        {/* Collections List */}
        {!Array.isArray(collections) || collections.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Start Your Collection</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              Create collections to organize your graded cards and track their value
            </p>
            {canCreateCollection && (
              <Button 
                variant="primary" 
                onClick={() => setShowCreateModal(true)}
                className="px-8"
              >
                Create First Collection
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {Array.isArray(collections) && collections.map((collection) => (
              <Link 
                key={collection._id || collection.id} 
                to={`/collection/${collection._id || collection.id}`}
                className="block"
              >
                <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all group">
                  <div className="relative">
                    {/* Cover Image */}
                    <div className="h-32 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                      {collection.coverImage ? (
                        <img 
                          src={collection.coverImage.startsWith('http') ? collection.coverImage : `https://www.tcgrader.com${collection.coverImage}`} 
                          alt={collection.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />
                      )}
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Edit Cover Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const collectionId = collection._id || collection.id;
                          setShowCoverModal(collectionId);
                          fetchCollectionCards(collectionId);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-xl rounded-lg text-white hover:bg-white/30 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>

                      {/* Collection Name Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-lg font-semibold text-white">
                          {collection.name}
                        </h3>
                      </div>
                    </div>

                    {/* Collection Info */}
                    <div className="p-4">
                      {collection.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {collection.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="text-xl font-semibold text-gray-900 dark:text-white">
                              {collection.cardCount || 0}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Cards</div>
                          </div>
                          <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />
                          <div>
                            <div className="text-xl font-semibold text-gray-900 dark:text-white">
                              ${(collection.value || 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Value</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {collection.isPublic && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Public
                            </span>
                          )}
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Create New Collection Button */}
            {canCreateCollection && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl hover:border-gray-400 dark:hover:border-gray-600 transition-all group"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Create New Collection</span>
                </div>
              </button>
            )}

            {/* Upgrade Prompt */}
            {!canCreateCollection && Array.isArray(collections) && collections.length > 0 && (
              <div className="bg-gradient-to-r from-gray-900 to-black p-6 rounded-2xl text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Unlock Unlimited Collections</h3>
                    <p className="text-sm text-gray-300">
                      Upgrade to Premium to create unlimited collections and access advanced features
                    </p>
                  </div>
                  <svg className="w-8 h-8 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <Link to="/subscription">
                  <Button 
                    size="sm" 
                    className="bg-white text-gray-900 hover:bg-gray-100"
                  >
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cover Selection Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Cover Image</h2>
              <button
                onClick={() => {
                  setShowCoverModal(null);
                  setCollectionCards([]);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {loadingCards ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : collectionCards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No cards in this collection yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {collectionCards.map((card) => (
                  <button
                    key={card.id || card._id}
                    onClick={() => {
                      const img = card.imageUrl || card.image || card.frontImage || card.images?.front || `/api/cards/${card.id || card._id}/image`;
                      const fullImageUrl = img.startsWith('http') ? img : `https://www.tcgrader.com${img}`;
                      handleUpdateCover(showCoverModal, fullImageUrl);
                    }}
                    disabled={isUpdatingCover}
                    className="relative aspect-[3/4] rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
                  >
                    <img 
                      src={(() => {
                        const img = card.imageUrl || card.image || card.frontImage || card.images?.front || `/api/cards/${card.id || card._id}/image`;
                        return img.startsWith('http') ? img : `https://www.tcgrader.com${img}`;
                      })()} 
                      alt={card.name || card.title || 'Card'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://www.tcgrader.com/images/card-placeholder.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Select</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Collection</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', description: '', isPublic: false });
                  setErrors({});
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleCreateCollection(); }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collection Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Pokémon PSA 10s"
                  error={errors.name}
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-gray-400 dark:text-gray-500">(optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe your collection..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all resize-none text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Make this collection public
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Other users can view public collections
                    </p>
                  </div>
                </label>
              </div>
              
              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
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
    </div>
  );
};

export default CollectionPage;