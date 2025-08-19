import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from './store';
import authService from './services/auth';
import FooterNav from './components/navigation/FooterNav';

// Pages (we'll create these next)
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import CollectionPage from './pages/Collection';
import CollectionDetailPage from './pages/CollectionDetail';
import GradesPage from './pages/Grades';
import SearchPage from './pages/Search';
import ProfilePage from './pages/Profile';
import ProfileEditPage from './pages/ProfileEdit';
import SubscriptionPage from './pages/Subscription';
import GradeSubmitPage from './pages/GradeSubmit';
import NotificationsSettingsPage from './pages/settings/Notifications';
import SecurityPage from './pages/settings/Security';
import PrivacyPage from './pages/settings/Privacy';
import ContactPage from './pages/Contact';
import HelpCenterPage from './pages/Help';
import MarketPage from './pages/Market';
import NotificationsPage from './pages/Notifications';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const backgroundImage = useUIStore((state) => state.backgroundImage);
  const backgroundPosition = useUIStore((state) => state.backgroundPosition);
  const backgroundScale = useUIStore((state) => state.backgroundScale);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [bgOpacity, setBgOpacity] = useState(85);

  useEffect(() => {
    // Initialize auth on app load
    authService.initialize();
  }, []);

  useEffect(() => {
    // Apply theme
    const effectiveTheme = user?.settings?.appearance?.theme || theme;
    
    if (effectiveTheme === 'dark' || (effectiveTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, user?.settings?.appearance?.theme]);

  useEffect(() => {
    // Apply custom background class
    if (backgroundImage) {
      document.body.classList.add('has-custom-bg');
    } else {
      document.body.classList.remove('has-custom-bg');
    }
  }, [backgroundImage]);

  // Animate background opacity on grades/submit page
  useEffect(() => {
    if (location.pathname === '/grades/submit' && backgroundImage) {
      // Start animation to 95% opacity
      const startTime = Date.now();
      const duration = 800; // 800ms animation
      const startOpacity = 85;
      const endOpacity = 95;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-in-out animation
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        const currentOpacity = startOpacity + (endOpacity - startOpacity) * easeProgress;
        setBgOpacity(currentOpacity);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      // Animate back to 85% when leaving the page
      const startTime = Date.now();
      const duration = 600; // 600ms animation back
      const startOpacity = bgOpacity;
      const endOpacity = 85;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out animation
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        
        const currentOpacity = startOpacity + (endOpacity - startOpacity) * easeProgress;
        setBgOpacity(currentOpacity);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      if (startOpacity !== endOpacity) {
        requestAnimationFrame(animate);
      }
    }
  }, [location.pathname, backgroundImage]);

  // Sync user theme preference when user data changes
  useEffect(() => {
    if (user?.settings?.appearance?.theme && user.settings.appearance.theme !== theme) {
      setTheme(user.settings.appearance.theme);
    }
  }, [user?._id]); // Only run when user ID changes (login/logout)

  return (
    <div className="relative min-h-screen">
        {/* Custom Background Image Layer */}
        {backgroundImage && (
          <div 
            className="fixed inset-0 z-0"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%`,
              backgroundSize: backgroundScale > 1 ? `${backgroundScale * 100}%` : 'cover',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}
        
        {/* Color Overlay with animated opacity */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 z-10 transition-opacity duration-300"
          style={{ opacity: backgroundImage ? bgOpacity / 100 : 1 }}
        >
          <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-gray-800/10 to-transparent"></div>
        </div>
        
        {/* Content Layer */}
        <div className="relative z-20 md:mobile-container min-h-screen bg-transparent">
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
            
            <Route path="/collection/:id" element={
              <ProtectedRoute>
                <CollectionDetailPage />
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
            
            <Route path="/market" element={
              <ProtectedRoute>
                <MarketPage />
              </ProtectedRoute>
            } />
            
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/settings/notifications" element={
              <ProtectedRoute>
                <NotificationsSettingsPage />
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
          
          {/* Premium Footer Navigation */}
          <FooterNav />
        </div>
      </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;