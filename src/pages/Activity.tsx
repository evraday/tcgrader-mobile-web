import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import apiService from '../services/api';

interface ActivityItem {
  id: string;
  type: 'grade' | 'collection' | 'price_alert' | 'submission' | 'market';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  color?: string;
  metadata?: {
    cardName?: string;
    grade?: string;
    value?: number;
    change?: number;
    quantity?: number;
  };
}

const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'grades' | 'collection' | 'market'>('all');

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'grade',
          title: 'Charizard VMAX graded PSA 10',
          description: 'Value increased by $450',
          timestamp: '2 hours ago',
          icon: '🔥',
          color: 'success',
          metadata: {
            cardName: 'Charizard VMAX',
            grade: 'PSA 10',
            value: 2450,
            change: 450
          }
        },
        {
          id: '2',
          type: 'collection',
          title: 'Added 15 cards to collection',
          description: 'Pokémon Evolving Skies',
          timestamp: '5 hours ago',
          icon: '📦',
          color: 'primary',
          metadata: {
            quantity: 15
          }
        },
        {
          id: '3',
          type: 'price_alert',
          title: 'Price alert triggered',
          description: 'Black Lotus reached $45,000',
          timestamp: '1 day ago',
          icon: '🔔',
          color: 'accent',
          metadata: {
            cardName: 'Black Lotus',
            value: 45000
          }
        },
        {
          id: '4',
          type: 'submission',
          title: 'Grading submission received',
          description: 'PSA submission #12345 - 5 cards',
          timestamp: '2 days ago',
          icon: '📮',
          color: 'primary',
          metadata: {
            quantity: 5
          }
        },
        {
          id: '5',
          type: 'market',
          title: 'New market trend',
          description: 'Vintage Pokémon cards up 25%',
          timestamp: '3 days ago',
          icon: '📈',
          color: 'success',
          metadata: {
            change: 25
          }
        },
        {
          id: '6',
          type: 'grade',
          title: 'Pikachu Illustrator graded BGS 9.5',
          description: 'New highest grade in collection',
          timestamp: '4 days ago',
          icon: '⚡',
          color: 'accent',
          metadata: {
            cardName: 'Pikachu Illustrator',
            grade: 'BGS 9.5',
            value: 375000
          }
        },
        {
          id: '7',
          type: 'collection',
          title: 'Collection milestone reached',
          description: '1,000 total cards cataloged',
          timestamp: '1 week ago',
          icon: '🏆',
          color: 'primary',
          metadata: {
            quantity: 1000
          }
        },
        {
          id: '8',
          type: 'price_alert',
          title: 'Price drop alert',
          description: 'Base Set Blastoise dropped 10%',
          timestamp: '1 week ago',
          icon: '📉',
          color: 'error',
          metadata: {
            cardName: 'Base Set Blastoise',
            change: -10
          }
        }
      ];

      // Filter activities based on selected filter
      const filteredActivities = filter === 'all' 
        ? mockActivities 
        : mockActivities.filter(activity => {
            if (filter === 'grades') return activity.type === 'grade' || activity.type === 'submission';
            if (filter === 'collection') return activity.type === 'collection';
            if (filter === 'market') return activity.type === 'market' || activity.type === 'price_alert';
            return true;
          });

      setActivities(filteredActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityColor = (activity: ActivityItem) => {
    const colors = {
      success: 'bg-success-500',
      primary: 'bg-primary-500',
      accent: 'bg-accent-500',
      error: 'bg-red-500'
    };
    return colors[activity.color as keyof typeof colors] || 'bg-gray-500';
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Activity</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-md mx-auto px-5 py-2">
          <div className="flex space-x-2">
            {['all', 'grades', 'collection', 'market'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === filterOption
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-5 py-6 pt-32 pb-24">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-2 h-2 bg-gray-200 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No activity yet</h3>
            <p className="text-sm text-gray-500">Your recent activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 ${getActivityColor(activity)} rounded-full mt-1.5`}></div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                        
                        {activity.metadata && (
                          <div className="mt-2 flex items-center space-x-3">
                            {activity.metadata.value && (
                              <span className="text-sm font-semibold text-gray-900">
                                {formatValue(activity.metadata.value)}
                              </span>
                            )}
                            {activity.metadata.change && (
                              <span className={`text-xs font-medium flex items-center ${
                                activity.metadata.change > 0 ? 'text-success-600' : 'text-red-600'
                              }`}>
                                {activity.metadata.change > 0 && '+'}
                                {activity.metadata.change}%
                              </span>
                            )}
                            {activity.metadata.grade && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                {activity.metadata.grade}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <span className="text-2xl">{activity.icon}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{activity.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && activities.length > 0 && (
          <div className="mt-6 text-center">
            <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;