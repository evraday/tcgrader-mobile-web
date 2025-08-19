import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import apiService from '../services/api';

interface ActivityItem {
  id: string;
  type: 'grade' | 'collection' | 'market' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  metadata?: {
    cardName?: string;
    grade?: string;
    value?: number;
    change?: number;
  };
}

const ActivityPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      // For now, using mock data since API endpoint might not exist
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'grade',
          title: 'Charizard VMAX graded PSA 10',
          description: 'Value increased by $450',
          timestamp: '2 hours ago',
          icon: '🔥',
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
          icon: '📦'
        },
        {
          id: '3',
          type: 'alert',
          title: 'Price alert triggered',
          description: 'Black Lotus reached $45,000',
          timestamp: '1 day ago',
          icon: '🔔',
          metadata: {
            cardName: 'Black Lotus',
            value: 45000
          }
        },
        {
          id: '4',
          type: 'market',
          title: 'Market update: Pokémon cards trending',
          description: 'Average price increase of 18.2%',
          timestamp: '2 days ago',
          icon: '📈',
          metadata: {
            change: 18.2
          }
        },
        {
          id: '5',
          type: 'grade',
          title: 'Pikachu VMAX graded BGS 9.5',
          description: 'Added to collection',
          timestamp: '3 days ago',
          icon: '⚡',
          metadata: {
            cardName: 'Pikachu VMAX',
            grade: 'BGS 9.5',
            value: 895
          }
        },
        {
          id: '6',
          type: 'collection',
          title: 'Collection milestone reached',
          description: 'You now have 100+ cards',
          timestamp: '1 week ago',
          icon: '🎉'
        },
        {
          id: '7',
          type: 'alert',
          title: 'New grading service available',
          description: 'SGC integration now live',
          timestamp: '1 week ago',
          icon: '🆕'
        },
        {
          id: '8',
          type: 'market',
          title: 'Weekly market report',
          description: 'Your portfolio gained 5.3% this week',
          timestamp: '1 week ago',
          icon: '📊',
          metadata: {
            change: 5.3
          }
        }
      ];

      setActivities(mockActivities);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setIsLoading(false);
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'grade':
        return 'bg-success-500';
      case 'collection':
        return 'bg-primary-500';
      case 'market':
        return 'bg-accent-500';
      case 'alert':
        return 'bg-warning-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-lg font-semibold text-gray-900">Recent Activity</h1>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-20">
        <div className="max-w-md mx-auto px-5 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
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
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 ${getActivityColor(activity.type)} rounded-full mt-1.5`}></div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                          
                          {activity.metadata && (
                            <div className="mt-2 flex items-center space-x-3">
                              {activity.metadata.value && (
                                <span className="text-sm font-semibold text-gray-900">
                                  ${activity.metadata.value.toLocaleString()}
                                </span>
                              )}
                              {activity.metadata.change && (
                                <span className={`text-xs font-medium ${activity.metadata.change > 0 ? 'text-success-600' : 'text-red-600'}`}>
                                  {activity.metadata.change > 0 ? '+' : ''}{activity.metadata.change}%
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
                        {activity.icon && (
                          <span className="text-xl ml-2">{activity.icon}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{activity.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More Button */}
              <div className="text-center pt-4">
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Load older activities
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
              <p className="text-sm text-gray-500 mb-6">
                Start grading cards or adding to your collection
              </p>
              <Link to="/grades/submit" className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                Submit a Card
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;