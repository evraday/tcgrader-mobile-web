import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import Button from '../components/common/Button';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div className="min-h-screen px-4 py-8 safe-area-top">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          TCGrader
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Professional Trading Card Management & Grading
        </p>
      </header>

      {isAuthenticated ? (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-2">Welcome back, {user?.name}!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage your collection, track grades, and monitor prices.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/collection">
                <Button fullWidth>My Collection</Button>
              </Link>
              <Link to="/grades">
                <Button fullWidth variant="secondary">My Grades</Button>
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/search" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="flex items-center space-x-3">
                  <span className="text-2xl">🔍</span>
                  <span>Search Cards</span>
                </span>
                <span className="text-gray-400">→</span>
              </Link>
              <Link to="/grades/submit" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="flex items-center space-x-3">
                  <span className="text-2xl">📦</span>
                  <span>Submit for Grading</span>
                </span>
                <span className="text-gray-400">→</span>
              </Link>
              <Link to="/subscription" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="flex items-center space-x-3">
                  <span className="text-2xl">⭐</span>
                  <span>Manage Subscription</span>
                </span>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card text-center py-8">
            <h2 className="text-2xl font-semibold mb-4">
              Start Managing Your Collection
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Join thousands of collectors using TCGrader to track, grade, and value their trading card collections.
            </p>
            <div className="space-y-3 max-w-sm mx-auto">
              <Link to="/register">
                <Button fullWidth size="lg">Get Started Free</Button>
              </Link>
              <Link to="/login">
                <Button fullWidth size="lg" variant="ghost">Sign In</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="card">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="text-2xl mr-2">📱</span>
                Mobile First
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scan cards, take photos, and manage your collection on the go.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="text-2xl mr-2">💎</span>
                Professional Grading
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Submit cards to PSA, BGS, CGC, and more with our guided workflow.
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold mb-2 flex items-center">
                <span className="text-2xl mr-2">📈</span>
                Real-Time Prices
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track market values and get alerts when prices change.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;