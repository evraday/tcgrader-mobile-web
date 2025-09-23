import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface TabItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  requiresAuth?: boolean;
}

const TabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [showGradeMenu, setShowGradeMenu] = useState(false);

  // Hide tab bar on certain pages
  const hiddenPaths = ['/login', '/register', '/forgot-password'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  const tabs: TabItem[] = [
    { 
      path: '/', 
      label: 'Home', 
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      )
    },
    { 
      path: '/collection', 
      label: 'Collection', 
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 5v14a1 1 0 0 0 1 1h3v-2H7V6h2V4H6a1 1 0 0 0-1 1zm14.242-.97-8-2A1 1 0 0 0 10 3v18a.998.998 0 0 0 1.242.97l8-2A1 1 0 0 0 20 19V5a1 1 0 0 0-.758-.97zM15 12.188a1.001 1.001 0 0 1-2 0v-.377a1 1 0 1 1 2 0v.377z"/>
        </svg>
      ),
      requiresAuth: true
    },
    { 
      path: '/search', 
      label: 'Search', 
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
        </svg>
      )
    },
    { 
      path: '/profile', 
      label: 'Profile', 
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
      ),
      requiresAuth: true
    }
  ];

  const handleGradeClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setShowGradeMenu(!showGradeMenu);
  };

  const handleMenuItemClick = (path: string) => {
    setShowGradeMenu(false);
    navigate(path);
  };

  return (
    <>
      {/* Grade Menu Overlay */}
      {showGradeMenu && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300" 
          onClick={() => setShowGradeMenu(false)}
        />
      )}

      {/* Grade Menu */}
      <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        showGradeMenu ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden min-w-[320px] border border-gray-100 dark:border-gray-700">
          <div className="p-2">
            <button
              onClick={() => handleMenuItemClick('/grades/submit')}
              className="flex items-center space-x-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 w-full group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">Single Grade</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Submit one card for grading</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => handleMenuItemClick('/grades/bulk')}
              className="flex items-center space-x-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 w-full group mt-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">Bulk Grade</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Submit multiple cards at once</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="border-t border-gray-100 dark:border-gray-700 p-2">
            <button
              onClick={() => handleMenuItemClick('/grades')}
              className="flex items-center space-x-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 w-full group"
            >
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">My Grades</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View your grading history</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        {/* Backdrop blur effect */}
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl" />
        
        {/* Content */}
        <div className="relative">
          {/* Top border with gradient */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
          
          <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
            {tabs.slice(0, 2).map((tab) => {
              if (tab.requiresAuth && !isAuthenticated) return null;
              
              const isActive = location.pathname === tab.path;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className="flex flex-col items-center py-2 px-4 flex-1 group relative"
                >
                  <div className={`transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}>
                    {isActive ? tab.activeIcon : tab.icon}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full" />
                  )}
                </NavLink>
              );
            })}

            {/* Center Floating Action Button */}
            <div className="relative px-3">
              <button
                onClick={handleGradeClick}
                className={`relative bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl p-4 shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 ${
                  showGradeMenu ? 'rotate-45' : 'rotate-0'
                }`}
              >
                {/* Pulse animation */}
                {!showGradeMenu && (
                  <div className="absolute inset-0 rounded-2xl bg-primary-500 animate-ping opacity-20" />
                )}
                
                {/* Icon */}
                <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent" />
              </button>
            </div>

            {tabs.slice(2).map((tab) => {
              if (tab.requiresAuth && !isAuthenticated) return null;
              
              const isActive = location.pathname === tab.path;
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className="flex flex-col items-center py-2 px-4 flex-1 group relative"
                >
                  <div className={`transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}>
                    {isActive ? tab.activeIcon : tab.icon}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default TabBar;