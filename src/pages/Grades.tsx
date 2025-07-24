import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGradeStore, useAuthStore } from '../store';
import { SUBSCRIPTION_LIMITS, GRADING_SERVICE_NAMES } from '../constants';
import { GradeStatus } from '../types';
import Button from '../components/common/Button';

const GradesPage: React.FC = () => {
  const { grades, setGrades } = useGradeStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonthGrades, setCurrentMonthGrades] = useState(0);

  const subscriptionLimits = user ? SUBSCRIPTION_LIMITS[user.subscription.type] : null;
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
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case GradeStatus.GRADING:
      case GradeStatus.ENCAPSULATING:
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case GradeStatus.SUBMITTED:
      case GradeStatus.RECEIVED:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading grades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 safe-area-top">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Grades
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {grades.length} total grade{grades.length !== 1 ? 's' : ''} • 
          {' '}{remainingGrades} remaining this month
        </p>
      </header>

      <div className="mb-6">
        <Link to="/grades/submit">
          <Button 
            fullWidth 
            disabled={remainingGrades === 0}
            className="flex items-center justify-center space-x-2"
          >
            <span className="text-xl">📦</span>
            <span>Submit New Cards for Grading</span>
          </Button>
        </Link>
        {remainingGrades === 0 && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
            Monthly grade limit reached. <Link to="/subscription" className="underline">Upgrade</Link> for more.
          </p>
        )}
      </div>

      {grades.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">💎</div>
          <h2 className="text-xl font-semibold mb-2">No Grades Yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Submit your first cards for professional grading and track their progress here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grades.map((grade) => (
            <Link key={grade.id} to={`/grades/${grade.id}`}>
              <div className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {/* Card name would come from the card data */}
                      Card #{grade.cardId}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span className="text-gray-500">
                        {GRADING_SERVICE_NAMES[grade.service]}
                      </span>
                      {grade.grade && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="font-bold text-primary-600">
                            Grade: {grade.grade}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grade.status)}`}>
                        {grade.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default GradesPage;