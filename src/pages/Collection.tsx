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

  const subscriptionLimits = user ? SUBSCRIPTION_LIMITS[user.subscription?.type || 'free'] : null;
  const canCreateCollection = subscriptionLimits && (
    subscriptionLimits.collectionsAllowed === -1 || 
    collections.length < subscriptionLimits.collectionsAllowed
  );

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await api.get('/collections');
      setCollections(response.data);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
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
      const response = await api.post('/collections', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        isPublic: formData.isPublic
      });
      
      addCollection(response.data);
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
            </Link>
            <Link to="/profile">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-full pl-3 pr-1 py-1 hover:bg-gray-100 transition-all">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500">{user?.isPremium ? 'Premium' : 'Free'} Plan</p>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 pb-8 pt-24">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Collections</h1>
          <p className="text-gray-600">
            {collections.length} collection{collections.length !== 1 ? 's' : ''} • 
            {' '}{subscriptionLimits?.collectionsAllowed === -1 ? 'Unlimited' : `${collections.length}/${subscriptionLimits?.collectionsAllowed}`} allowed
          </p>
        </header>

        {collections.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">No Collections Yet</h2>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
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
                <p className="text-sm text-red-600">
                  Collection limit reached for your plan
                </p>
                <Link to="/subscription">
                  <Button variant="accent">Upgrade Plan</Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {canCreateCollection && (
              <Button 
                fullWidth 
                onClick={() => setShowCreateModal(true)}
                className="mb-4 bg-white border-2 border-dashed border-gray-300 hover:border-primary-500 text-gray-700 hover:text-primary-600"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create New Collection</span>
                </div>
              </Button>
            )}

            {collections.map((collection) => (
              <Link key={collection.id} to={`/collection/${collection.id}`}>
                <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {collection.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="text-sm text-gray-500">{collection.cardCount || 0} cards</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-gray-500">${(collection.value || 0).toFixed(2)}</span>
                        </div>
                        {collection.isPublic && (
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-success-600 font-medium">Public</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}

            {!canCreateCollection && collections.length > 0 && (
              <div className="bg-gradient-to-br from-accent-50 to-pink-50 rounded-2xl p-6 text-center border border-accent-100">
                <svg className="w-12 h-12 text-accent-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm text-gray-900 font-medium mb-2">
                  You've reached your collection limit
                </p>
                <p className="text-xs text-gray-600 mb-4">
                  Upgrade to Premium for unlimited collections
                </p>
                <Link to="/subscription">
                  <Button size="sm" variant="accent">
                    Upgrade to Premium
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-semibold text-gray-900 mb-5">Create New Collection</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); handleCreateCollection(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Add a description for your collection..."
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all resize-none"
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Make this collection public
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Public collections can be viewed by other users
                </p>
              </div>
              
              {errors.submit && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
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