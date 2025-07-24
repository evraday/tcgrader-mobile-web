import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store';

interface TabItem {
  path: string;
  label: string;
  icon: string;
  requiresAuth?: boolean;
}

const tabs: TabItem[] = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/collection', label: 'Collection', icon: '📚', requiresAuth: true },
  { path: '/grades', label: 'Grades', icon: '💎', requiresAuth: true },
  { path: '/search', label: 'Search', icon: '🔍' },
  { path: '/profile', label: 'Profile', icon: '👤', requiresAuth: true }
];

const TabBar: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const visibleTabs = tabs.filter(tab => !tab.requiresAuth || isAuthenticated);

  return (
    <nav className="tab-bar safe-area-bottom">
      <div className="grid grid-cols-5 h-16">
        {visibleTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default TabBar;