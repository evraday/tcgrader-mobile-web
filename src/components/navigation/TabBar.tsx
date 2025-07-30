import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  // Tab bar is completely disabled - return null for all pages
  return null;
};

export default TabBar;