import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store';

const FooterNav: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Don't show on auth pages or when not authenticated
  if (['/login', '/register'].includes(location.pathname) || !isAuthenticated) {
    return null;
  }

  const mainNavItems = [
    {
      path: '/',
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/collection',
      label: 'Collection',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      requiresAuth: true
    },
    {
      path: '/market',
      label: 'Market',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      requiresAuth: true
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      requiresAuth: true
    }
  ];

  const quickActions = [
    {
      path: '/grades/submit',
      label: 'Grade',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
      color: 'from-red-600 to-red-700'
    },
    {
      path: '/search',
      label: 'Search',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'from-blue-600 to-blue-700'
    },
    {
      path: '/grades',
      label: 'Grades',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'from-green-600 to-green-700'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <>
      {/* Quick Actions Modal */}
      {showQuickActions && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowQuickActions(false)}
        >
          <div 
            className="absolute bottom-20 left-0 right-0 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-md mx-auto grid grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  onClick={() => setShowQuickActions(false)}
                  className="relative group"
                >
                  <div className={`relative p-6 bg-gradient-to-br ${action.color} rounded-2xl shadow-xl transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-50"></div>
                    <div className="relative z-10 flex flex-col items-center space-y-2">
                      <div className="text-white">
                        {action.icon}
                      </div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {action.label}
                      </span>
                    </div>
                    {/* Premium shine effect */}
                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 safe-area-bottom">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-slate-700/30 shadow-2xl">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center justify-around relative">
              {mainNavItems.map((item) => {
                if (item.requiresAuth && !isAuthenticated) return null;
                
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center justify-center p-3 rounded-xl transition-all duration-300 group ${
                      active 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'
                    }`}
                  >
                    {active && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl"></div>
                        <div className="absolute inset-0 bg-primary-500/10 dark:bg-primary-400/10 rounded-xl blur-md"></div>
                      </>
                    )}
                    <div className={`relative z-10 transition-all duration-300 ${active ? 'scale-110 drop-shadow-lg' : 'scale-100 group-hover:scale-105'}`}>
                      {React.cloneElement(item.icon, {
                        className: "w-7 h-7",
                        strokeWidth: active ? 2.5 : 2
                      })}
                    </div>
                  </Link>
                );
              })}
              
              {/* Center Quick Actions Button */}
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="absolute left-1/2 -translate-x-1/2 -top-8 group"
              >
                <div className="relative">
                  {/* Outer glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-red-600 rounded-full blur-lg opacity-70 group-hover:opacity-90 transition-opacity scale-110"></div>
                  
                  {/* Main button */}
                  <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-red-600 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 group-hover:scale-110 group-active:scale-95">
                    {/* Inner shine */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-full"></div>
                    
                    {/* Icon */}
                    <svg 
                      className={`w-7 h-7 text-white relative z-10 transition-transform duration-300 ${showQuickActions ? 'rotate-45' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    
                    {/* Pulse effect */}
                    {!showQuickActions && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-red-600 rounded-full animate-ping opacity-30"></div>
                    )}
                  </div>
                  
                  {/* Premium ring effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 via-purple-500 to-red-500 rounded-full opacity-0 group-hover:opacity-75 blur-sm transition-opacity"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FooterNav;