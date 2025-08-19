import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGradeStore, useAuthStore } from '../store';
import { SUBSCRIPTION_LIMITS, GRADING_SERVICE_NAMES } from '../constants';
import { GradeStatus, SubscriptionType } from '../types';
import Button from '../components/common/Button';
import tcgraderLogo from '../assets/tcgrader-logo.png';
import apiService from '../services/api';

const GradesPage: React.FC = () => {
  const { grades, setGrades } = useGradeStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonthGrades, setCurrentMonthGrades] = useState(0);

  const subscriptionType = user?.subscription?.type === 'merchant' 
    ? SubscriptionType.BUSINESS 
    : user?.subscription?.type === 'collector'
    ? SubscriptionType.COLLECTOR
    : (user?.subscription?.type as SubscriptionType) || SubscriptionType.FREE;
  const subscriptionLimits = user ? SUBSCRIPTION_LIMITS[subscriptionType] : null;
  const remainingGrades = subscriptionLimits 
    ? subscriptionLimits.gradesPerMonth === -1 
      ? 'Unlimited' 
      : Math.max(0, subscriptionLimits.gradesPerMonth - currentMonthGrades)
    : 0;

  useEffect(() => {
    // TODO: Fetch grades from API
    // Calculate current month grades
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthGrades = grades.filter(grade => 
      new Date(grade.submittedAt) >= monthStart
    ).length;
    setCurrentMonthGrades(monthGrades);
    setIsLoading(false);
  }, [grades]);

  const getStatusColor = (status: GradeStatus) => {
    switch (status) {
      case GradeStatus.COMPLETED:
        return 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 border-success-200 dark:border-success-800/40';
      case GradeStatus.GRADING:
      case GradeStatus.ENCAPSULATING:
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
      case GradeStatus.SUBMITTED:
      case GradeStatus.RECEIVED:
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40';
      default:
        return 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700/40';
    }
  };

  const getStatusIcon = (status: GradeStatus) => {
    switch (status) {
      case GradeStatus.COMPLETED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case GradeStatus.GRADING:
      case GradeStatus.ENCAPSULATING:
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
          <div className="mb-8 text-center">
            <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded mb-2 mx-auto animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-slate-700 rounded mx-auto animate-pulse"></div>
          </div>
          
          {/* Stats Card Skeleton */}
          <div className="bg-primary-500 dark:bg-primary-600 rounded-2xl p-6 mb-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-primary-400 dark:bg-primary-700 rounded"></div>
              <div className="w-6 h-6 bg-primary-400 dark:bg-primary-700 rounded"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="h-9 w-20 bg-primary-400 dark:bg-primary-700 rounded mb-1"></div>
                <div className="h-3 w-28 bg-primary-400 dark:bg-primary-700 rounded"></div>
              </div>
              <div>
                <div className="h-9 w-20 bg-primary-400 dark:bg-primary-700 rounded mb-1"></div>
                <div className="h-3 w-32 bg-primary-400 dark:bg-primary-700 rounded"></div>
              </div>
            </div>
            <div className="h-12 w-full bg-primary-400 dark:bg-primary-700 rounded-xl"></div>
          </div>
          
          {/* Quick Stats Skeleton */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800/70 rounded-2xl p-4 animate-pulse">
                <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-7 w-16 bg-gray-200 dark:bg-slate-700 rounded mb-1"></div>
                <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
          
          {/* Grade Items Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800/70 rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-4">
                      <div className="w-16 h-20 bg-gray-200 dark:bg-slate-700 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-5 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
                        <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded mb-3"></div>
                        <div className="h-6 w-24 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                      </div>
                    </div>
                    <div className="w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded"></div>
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
      {/* Fixed Header */}
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
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
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
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-1">Grading History</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage your card submissions</p>
        </div>

        {/* Stats Overview */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Grading Stats</h3>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-3xl font-bold">{grades.length}</p>
              <p className="text-sm opacity-90">Total Submissions</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{remainingGrades}</p>
              <p className="text-sm opacity-90">Remaining This Month</p>
            </div>
          </div>
          
          <Link to="/grades/submit">
            <Button 
              fullWidth 
              variant="secondary"
              disabled={remainingGrades === 0}
              className="bg-white text-primary-600 hover:bg-gray-50"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Submit New Card</span>
              </div>
            </Button>
          </Link>
          {remainingGrades === 0 && (
            <p className="text-xs text-white/80 mt-3 text-center">
              Monthly limit reached • 
              <Link to="/subscription" className="underline font-medium">Upgrade plan</Link>
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-700/40">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">{grades.filter(g => g.status === GradeStatus.COMPLETED).length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
          </div>
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-700/40">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-5 h-5 text-primary-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">{grades.filter(g => g.status === GradeStatus.GRADING).length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Grading</p>
          </div>
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-700/40">
            <div className="flex items-center justify-between mb-2">
              <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-200">9.2</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg. Grade</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium whitespace-nowrap">
            All Grades
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-colors whitespace-nowrap">
            In Progress
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-colors whitespace-nowrap">
            Completed
          </button>
        </div>

        {grades.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-slate-700/40 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2">No Grades Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Submit your first cards for professional grading and track their progress here.
            </p>
            <Link to="/grades/submit">
              <Button variant="primary">
                Submit Your First Card
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {grades.map((grade) => (
              <Link key={grade.id} to={`/grades/${grade.id}`}>
                <div className="bg-white dark:bg-slate-800/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-200 dark:border-slate-700/40">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4">
                        {/* Card Image Placeholder */}
                        <div className="w-16 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            Submission #{grade.id.slice(-6).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {GRADING_SERVICE_NAMES[grade.service]}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-3">
                            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(grade.status)}`}>
                              {getStatusIcon(grade.status)}
                              <span className="capitalize">{grade.status.replace(/_/g, ' ')}</span>
                            </span>
                            
                            {grade.grade && (
                              <div className="flex items-center space-x-1">
                                <svg className="w-4 h-4 text-accent-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-200">{grade.grade}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Progress Bar for In-Progress Items */}
                  {(grade.status === GradeStatus.GRADING || grade.status === GradeStatus.SUBMITTED) && (
                    <div className="bg-gray-50 dark:bg-slate-900/50 px-5 py-3 border-t border-gray-100 dark:border-slate-700/40">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Estimated completion</span>
                        <span className="font-medium">3-5 business days</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="bg-primary-600 dark:bg-primary-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradesPage;