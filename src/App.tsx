import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from './store';
import authService from './services/auth';
import TabBar from './components/navigation/TabBar';

// Pages (we'll create these next)
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import CollectionPage from './pages/Collection';
import GradesPage from './pages/Grades';
import SearchPage from './pages/Search';
import ProfilePage from './pages/Profile';
import SubscriptionPage from './pages/Subscription';
import GradeSubmitPage from './pages/GradeSubmit';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { theme } = useUIStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Initialize auth on app load
    authService.initialize();

    // Apply theme
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<SearchPage />} />
          
          <Route path="/collection" element={
            <ProtectedRoute>
              <CollectionPage />
            </ProtectedRoute>
          } />
          
          <Route path="/grades" element={
            <ProtectedRoute>
              <GradesPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/subscription" element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          } />
          
          <Route path="/grades/submit" element={
            <ProtectedRoute>
              <GradeSubmitPage />
            </ProtectedRoute>
          } />
        </Routes>
        
        {/* Show tab bar on main pages */}
        <TabBar />
      </div>
    </Router>
  );
};

export default App;