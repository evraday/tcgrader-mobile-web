import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGradeStore, useAuthStore } from '../store';
import { SUBSCRIPTION_LIMITS, GRADING_SERVICE_NAMES } from '../constants';
import { GradeStatus } from '../types';
import Button from '../components/common/Button';
import tcgraderLogo from '../assets/tcgrader-logo.png';

const GradesPage: React.FC = () => {
  const { grades, setGrades } = useGradeStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonthGrades, setCurrentMonthGrades] = useState(0);

  // Get subscription limits based on user's subscription type
  const subscriptionType = user?.subscription?.type || user?.role || 'free';
  const subscriptionLimits = SUBSCRIPTION_LIMITS[subscriptionType] || SUBSCRIPTION_LIMITS.free;
  
  const userCredits = user?.credits || 0;
  const creditLimit = subscriptionLimits.gradesPerMonth;
  const remainingGrades = creditLimit === -1 ? 'Unlimited' : Math.max(0, userCredits);

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
        return 'bg-success-100 text-success-700 border-success-200';
      case GradeStatus.GRADING:
      case GradeStatus.ENCAPSULATING:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case GradeStatus.SUBMITTED:
      case GradeStatus.RECEIVED:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading grades...</p>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Grades</h1>
          <p className="text-gray-600">
            {grades.length} total grade{grades.length !== 1 ? 's' : ''} • 
            {' '}Credits: {userCredits}/{creditLimit === -1 ? '∞' : creditLimit}
          </p>
        </header>

        {/* Grade Submission CTA */}
        <div className="mb-6">
          <Link to="/grades/submit">
            <Button 
              fullWidth 
              variant="primary"
              disabled={userCredits === 0 && creditLimit !== -1}
              className="relative overflow-hidden group"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Submit New Cards for Grading</span>
              </div>
            </Button>
          </Link>
          {userCredits === 0 && creditLimit !== -1 && (
            <p className="text-sm text-red-600 mt-2 text-center">
              No credits remaining. 
              <Link to="/subscription" className="underline font-medium ml-1">Upgrade for more</Link>
            </p>
          )}
        </div>

        {/* Grade Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">{grades.filter(g => g.status === GradeStatus.COMPLETED).length}</p>
            <p className="text-xs text-gray-600 mt-1">Completed</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-primary-600">{grades.filter(g => g.status === GradeStatus.GRADING).length}</p>
            <p className="text-xs text-gray-600 mt-1">In Progress</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">9.2</p>
            <p className="text-xs text-gray-600 mt-1">Avg. Grade</p>
          </div>
        </div>

        {grades.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">No Grades Yet</h2>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Submit your first cards for professional grading and track their progress here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {grades.map((grade) => (
              <Link key={grade.id} to={`/grades/${grade.id}`}>
                <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        Card #{grade.cardId}
                      </h3>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="text-sm text-gray-600">
                          {GRADING_SERVICE_NAMES[grade.service]}
                        </span>
                        {grade.grade && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm font-bold text-primary-600">
                              Grade: {grade.grade}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(grade.status)}`}>
                          {getStatusIcon(grade.status)}
                          <span>{grade.status.replace(/_/g, ' ')}</span>
                        </span>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
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