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
import NotificationsPage from './pages/settings/Notifications';
import SecurityPage from './pages/settings/Security';
import PrivacyPage from './pages/settings/Privacy';
import ContactPage from './pages/Contact';
import HelpCenterPage from './pages/Help';
import MarketPage from './pages/Market';
import ProfileEditPage from './pages/ProfileEdit';
import ActivityPage from './pages/Activity';
import TopPerformersPage from './pages/TopPerformers';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Initialize auth on app load
    authService.initialize();
  }, []);

  useEffect(() => {
    // Apply theme
    const applyTheme = () => {
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes when in 'system' mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return (
    <Router>
      <div className="md:bg-gray-100 dark:md:bg-gray-900 min-h-screen">
        <div className="md:mobile-container min-h-screen bg-white dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/market/top-performers" element={<TopPerformersPage />} />
            
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
            
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <ProfileEditPage />
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
            
            <Route path="/activity" element={
              <ProtectedRoute>
                <ActivityPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings/security" element={
              <ProtectedRoute>
                <SecurityPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings/privacy" element={
              <ProtectedRoute>
                <PrivacyPage />
              </ProtectedRoute>
            } />
            
            <Route path="/contact" element={
              <ProtectedRoute>
                <ContactPage />
              </ProtectedRoute>
            } />
            
            <Route path="/help" element={
              <ProtectedRoute>
                <HelpCenterPage />
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* Show tab bar on main pages */}
          <TabBar />
        </div>
      </div>
    </Router>
  );
};

export default App;