import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Collection as CollectionType } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import api from '../services/api';

const CollectionEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [collection, setCollection] = useState<CollectionType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [collectionCards, setCollectionCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchCollection();
    }
  }, [id]);

  const fetchCollection = async () => {
    try {
      const response = await api.getCollection(id!);
      console.log('Edit page - Collection response:', response);
      
      // The response is already processed by api.getCollection
      const collectionData = response;
      setCollection(collectionData);
      
      // Check if user owns this collection
      if (collectionData.userId !== user?._id && collectionData.userId !== user?.id) {
        console.log('User does not own this collection');
        navigate(`/collection/${id}`);
        return;
      }

      setFormData({
        name: collectionData.name || '',
        description: collectionData.description || '',
        isPublic: collectionData.isPublic || false
      });
      
      console.log('Form data set:', {
        name: collectionData.name,
        description: collectionData.description,
        isPublic: collectionData.isPublic
      });
    } catch (error) {
      console.error('Failed to fetch collection:', error);
      navigate('/collection');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollectionCards = async () => {
    setLoadingCards(true);
    try {
      // First check if we already have cards in the collection object
      if (collection?.cards && Array.isArray(collection.cards)) {
        setCollectionCards(collection.cards);
      } else {
        // Otherwise fetch from the cards endpoint
        const response = await api.get(`/api/collections/${id}/cards`);
        const cards = response.cards || response.data || response || [];
        setCollectionCards(Array.isArray(cards) ? cards : []);
      }
    } catch (error) {
      console.error('Failed to fetch collection cards:', error);
      setCollectionCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleUpdateCover = async (cardImageUrl: string) => {
    try {
      await api.updateCollection(id!, { coverImage: cardImageUrl });
      setCollection(prev => prev ? { ...prev, coverImage: cardImageUrl } : prev);
      setShowCoverModal(false);
      setCollectionCards([]);
    } catch (error) {
      console.error('Failed to update cover:', error);
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

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      await api.updateCollection(id!, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isPublic: formData.isPublic
      });
      
      navigate(`/collection/${id}`);
    } catch (error: any) {
      setErrors({ submit: error.response?.data?.message || 'Failed to update collection' });
    } finally {
      setIsSaving(false);
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
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 safe-area-top">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to={`/collection/${id}`}>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Collection</h1>
            </div>
            
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Cover Image Section */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Cover Image
          </label>
          <div className="relative h-48 bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden">
            {collection.coverImage ? (
              <img 
                src={collection.coverImage.startsWith('http') ? collection.coverImage : `https://www.tcgrader.com${collection.coverImage}`} 
                alt="Collection cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            <button
              onClick={() => {
                setShowCoverModal(true);
                fetchCollectionCards();
              }}
              className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl px-4 py-2 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Change Cover</span>
              </div>
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
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
              rows={4}
              placeholder="Describe your collection..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all resize-none text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>
          
          <div>
            <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="w-5 h-5 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Make this collection public
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Other users can view public collections
                </p>
              </div>
              {formData.isPublic && (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </label>
          </div>
          
          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {errors.submit}
            </div>
          )}

          {/* Collection Info */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Collection Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cards</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{collection.cardCount || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">${(collection.value || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(collection.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Updated</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(collection.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <h3 className="text-sm font-medium text-red-600 mb-3">Danger Zone</h3>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this collection? This action cannot be undone and will remove all cards from this collection.')) {
                  api.deleteCollection(id!).then(() => {
                    navigate('/collection');
                  }).catch((error) => {
                    setErrors({ submit: 'Failed to delete collection' });
                  });
                }
              }}
              className="w-full p-4 text-left bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-600">Delete Collection</p>
                  <p className="text-xs text-red-500">This action cannot be undone</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Cover Selection Modal */}
      {showCoverModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Cover Image</h2>
              <button
                onClick={() => {
                  setShowCoverModal(false);
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
                {collectionCards.map((card) => {
                  const cardId = card._id || card.id;
                  const img = card.imageUrl || card.image || card.frontImage || card.images?.front || `/api/cards/${cardId}/image`;
                  const fullImageUrl = img.startsWith('http') ? img : `https://www.tcgrader.com${img}`;
                  
                  return (
                    <button
                      key={cardId}
                      onClick={() => handleUpdateCover(fullImageUrl)}
                      className="relative aspect-[3/4] rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
                    >
                      <img 
                        src={fullImageUrl}
                        alt={card.name || 'Card'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://www.tcgrader.com/images/card-placeholder.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Select</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionEditPage;