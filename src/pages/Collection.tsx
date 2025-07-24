import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCollectionStore, useAuthStore } from '../store';
import { Collection as CollectionType } from '../types';
import { SUBSCRIPTION_LIMITS } from '../constants';
import Button from '../components/common/Button';

const CollectionPage: React.FC = () => {
  const { collections, setCollections } = useCollectionStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  const subscriptionLimits = user ? SUBSCRIPTION_LIMITS[user.subscription.type] : null;
  const canCreateCollection = subscriptionLimits && (
    subscriptionLimits.collectionsAllowed === -1 || 
    collections.length < subscriptionLimits.collectionsAllowed
  );

  useEffect(() => {
    // TODO: Fetch collections from API
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 safe-area-top">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Collections
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {collections.length} collection{collections.length !== 1 ? 's' : ''} • 
          {' '}{subscriptionLimits?.collectionsAllowed === -1 ? 'Unlimited' : `${collections.length}/${subscriptionLimits?.collectionsAllowed}`} allowed
        </p>
      </header>

      {collections.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2">No Collections Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Create your first collection to start organizing your trading cards.
          </p>
          {canCreateCollection ? (
            <Button>Create Collection</Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                Collection limit reached for your plan
              </p>
              <Link to="/subscription">
                <Button>Upgrade Plan</Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {canCreateCollection && (
            <Button fullWidth className="mb-4">
              + Create New Collection
            </Button>
          )}

          {collections.map((collection) => (
            <Link key={collection.id} to={`/collection/${collection.id}`}>
              <div className="card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {collection.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{collection.totalCards} cards</span>
                      <span>•</span>
                      <span>${collection.totalValue.toFixed(2)}</span>
                      {collection.isPublic && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 dark:text-green-400">Public</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-gray-400">
                    →
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {!canCreateCollection && collections.length > 0 && (
            <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-center">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                You've reached your collection limit
              </p>
              <Link to="/subscription">
                <Button size="sm" variant="secondary">
                  Upgrade for More Collections
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionPage;