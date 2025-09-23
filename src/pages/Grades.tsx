import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import Button from '../components/common/Button';
import api from '../services/api';

const GradesPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [grades, setGrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    avgGrade: 0
  });

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const response = await api.getMyCards();
      const cardsData = Array.isArray(response) ? response : (response?.cards || []);
      setGrades(cardsData);
      
      // Calculate stats - handle both v1/dual-ai and v2 structures
      const completed = cardsData.filter((card: any) => {
        const latestGrade = card.gradingResults?.[0] || card.raw?.combined;
        return latestGrade?.scores?.overall || latestGrade?.overall;
      }).length;
      
      const inProgress = cardsData.filter((card: any) => {
        const latestGrade = card.gradingResults?.[0] || card.raw?.combined;
        const hasGrade = latestGrade?.scores?.overall || latestGrade?.overall;
        return !hasGrade && (card.status === 'processing' || card.status === 'submitted' || card.status === 'grading');
      }).length;
      
      // Calculate average grade from completed cards with AI scores
      const completedWithGrades = cardsData.filter((card: any) => {
        const latestGrade = card.gradingResults?.[0] || card.raw?.combined;
        return latestGrade?.scores?.overall || latestGrade?.overall;
      });
      
      const avgGrade = completedWithGrades.length > 0 
        ? completedWithGrades.reduce((sum: number, card: any) => {
            const latestGrade = card.gradingResults?.[0] || card.raw?.combined;
            const score = latestGrade?.scores?.overall || latestGrade?.overall;
            return sum + (score || 0);
          }, 0) / completedWithGrades.length
        : 0;
      
      setStats({
        total: cardsData.length,
        completed,
        inProgress,
        avgGrade: Math.round(avgGrade * 10) / 10
      });
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      setGrades([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'grading':
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'submitted':
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'grading':
      case 'processing':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleCardClick = (card: any) => {
    const cardId = card._id || card.id;
    navigate(`/grades/${cardId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading grades...</p>
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Grades</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.total} total cards graded
              </p>
            </div>
            <Link to="/grades/submit">
              <Button variant="primary" size="sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Grade Cards</span>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Grade Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.inProgress}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">In Progress</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.avgGrade > 0 ? stats.avgGrade.toFixed(1) : '--'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg. Grade</p>
          </div>
        </div>

        {grades.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No cards yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Submit your first cards for AI grading</p>
            <Link to="/grades/submit">
              <Button variant="primary">
                Start Grading Cards
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {grades.map((card) => {
              const cardId = card._id || card.id;
              const latestGrade = card.gradingResults?.[0] || card.raw?.combined;
              // Handle both v1/dual-ai (scores.overall) and v2 (overall) structures
              const overallScore = latestGrade?.scores?.overall || latestGrade?.overall;
              const status = card.status || (overallScore ? 'completed' : 'processing');

              return (
                <div 
                  key={cardId}
                  onClick={() => handleCardClick(card)}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    {/* Card Image */}
                    <div className="relative w-16 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      {(() => {
                        // Handle different image structures
                        const imageUrl = card.images?.frontUrl || // v1/dual-ai structure
                                        card.images?.front ||    // v2 structure
                                        card.imageUrl || 
                                        card.image ||
                                        card.frontImage;
                        
                        return imageUrl ? (
                          <img 
                            src={imageUrl}
                            alt={card.name || 'Card'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://www.tcgrader.com/images/card-placeholder.png';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600" />
                        );
                      })()}
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
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {card.name || `Card #${cardId.slice(-8)}`}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {card.setName || card.set || 'Unknown Set'}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <span className="capitalize">{status.replace(/[_-]/g, ' ')}</span>
                        </span>
                        {overallScore && (
                          <span className={`text-sm font-bold ${
                            overallScore >= 9 ? 'text-green-600 dark:text-green-500' :
                            overallScore >= 8 ? 'text-blue-600 dark:text-blue-500' :
                            overallScore >= 7 ? 'text-yellow-600 dark:text-yellow-500' :
                            overallScore >= 6 ? 'text-orange-600 dark:text-orange-500' :
                            'text-red-600 dark:text-red-500'
                          }`}>
                            {overallScore}/10
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {card.createdAt && new Date(card.createdAt).toLocaleDateString()}
                      </p>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mt-1 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradesPage;