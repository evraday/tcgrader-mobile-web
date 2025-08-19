import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import Button from '../components/common/Button';
import apiService from '../services/api';

interface ActivityItem {
  id: string;
  type: 'grade_submitted' | 'grade_completed' | 'collection_added' | 'price_alert' | 'value_change';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: {
    cardId?: string;
    cardName?: string;
    grade?: number;
    grader?: string;
    previousValue?: number;
    currentValue?: number;
    changePercentage?: number;
    count?: number;
  };
}

const ActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For now, we'll use mock data since the API endpoint might not exist yet
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'grade_completed',
          title: 'Charizard VMAX graded PSA 10',
          description: 'Value increased by $450',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          metadata: {
            cardName: 'Charizard VMAX',
            grade: 10,
            grader: 'PSA',
            previousValue: 2000,
            currentValue: 2450,
            changePercentage: 22.5
          }
        },
        {
          id: '2',
          type: 'collection_added',
          title: 'Added 15 cards to collection',
          description: 'Pokémon Evolving Skies',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          metadata: {
            count: 15
          }
        },
        {
          id: '3',
          type: 'price_alert',
          title: 'Price alert triggered',
          description: 'Black Lotus reached $45,000',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          metadata: {
            cardName: 'Black Lotus',
            currentValue: 45000
          }
        },
        {
          id: '4',
          type: 'grade_submitted',
          title: 'Submitted 5 cards for grading',
          description: 'PSA Express Service',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          metadata: {
            count: 5,
            grader: 'PSA'
          }
        },
        {
          id: '5',
          type: 'value_change',
          title: 'Portfolio value increased',
          description: 'Daily portfolio update',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          metadata: {
            previousValue: 12500,
            currentValue: 13750,
            changePercentage: 10
          }
        }
      ];
      
      setActivities(mockActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'grade_completed':
        return '💎';
      case 'grade_submitted':
        return '📤';
      case 'collection_added':
        return '📚';
      case 'price_alert':
        return '🔔';
      case 'value_change':
        return '📈';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'grade_completed':
        return 'bg-success-100 text-success-600';
      case 'grade_submitted':
        return 'bg-primary-100 text-primary-600';
      case 'collection_added':
        return 'bg-accent-100 text-accent-600';
      case 'price_alert':
        return 'bg-warning-100 text-warning-600';
      case 'value_change':
        return 'bg-success-100 text-success-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      return 'Just now';
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 7) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Activity</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-5 py-6 pb-8 pt-20">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{error}</p>
            <Button variant="secondary" onClick={fetchActivities}>
              Try Again
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Activity Yet</h2>
            <p className="text-gray-500 mb-6">
              Your recent card activities will appear here
            </p>
            <Link to="/grades/submit">
              <Button variant="primary">Submit Your First Card</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    
                    {/* Additional metadata display */}
                    {activity.metadata && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {activity.metadata.grade && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Grade: {activity.metadata.grade}
                          </span>
                        )}
                        {activity.metadata.changePercentage && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            activity.metadata.changePercentage > 0 
                              ? 'bg-success-100 text-success-700' 
                              : 'bg-error-100 text-error-700'
                          }`}>
                            {activity.metadata.changePercentage > 0 ? '+' : ''}{activity.metadata.changePercentage}%
                          </span>
                        )}
                        {activity.metadata.grader && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                            {activity.metadata.grader}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {activities.length >= 5 && (
              <div className="text-center py-4">
                <Button variant="secondary" fullWidth>
                  Load More Activities
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;