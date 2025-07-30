import { SubscriptionType, SubscriptionLimits } from '../types';

export const SUBSCRIPTION_LIMITS: Record<SubscriptionType, SubscriptionLimits> = {
  [SubscriptionType.FREE]: {
    gradesPerMonth: 5,
    collectionsAllowed: 1,
    priceTrackingInterval: 'none',
    bulkOperations: false,
    apiAccess: false
  },
  [SubscriptionType.BASIC]: {
    gradesPerMonth: 25,
    collectionsAllowed: 5,
    priceTrackingInterval: 'daily',
    bulkOperations: false,
    apiAccess: false
  },
  [SubscriptionType.PRO]: {
    gradesPerMonth: 100,
    collectionsAllowed: -1, // unlimited
    priceTrackingInterval: 'realtime',
    bulkOperations: true,
    apiAccess: false
  },
  [SubscriptionType.BUSINESS]: {
    gradesPerMonth: -1, // unlimited
    collectionsAllowed: -1, // unlimited
    priceTrackingInterval: 'realtime',
    bulkOperations: true,
    apiAccess: true
  }
};

export const SUBSCRIPTION_PRICES = {
  [SubscriptionType.FREE]: 0,
  [SubscriptionType.BASIC]: 4.99,
  [SubscriptionType.PRO]: 9.99,
  [SubscriptionType.BUSINESS]: 29.99
};

export const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '' // Use proxy in development
  : (process.env.API_BASE_URL || 'https://www.tcgrader.com');
export const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY || '';
// Note: You need to get your own reCAPTCHA site key from https://www.google.com/recaptcha/admin
export const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY || '';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  COLLECTION: '/collection',
  COLLECTION_DETAIL: '/collection/:id',
  GRADES: '/grades',
  GRADE_DETAIL: '/grades/:id',
  GRADE_SUBMIT: '/grades/submit',
  SEARCH: '/search',
  PROFILE: '/profile',
  SUBSCRIPTION: '/subscription',
  SETTINGS: '/settings'
};

export const GRADING_SERVICE_NAMES = {
  psa: 'PSA',
  bgs: 'Beckett (BGS)',
  cgc: 'CGC',
  sgc: 'SGC'
};

export const CONDITION_NAMES = {
  mint: 'Mint',
  near_mint: 'Near Mint',
  excellent: 'Excellent',
  good: 'Good',
  light_played: 'Lightly Played',
  played: 'Played',
  poor: 'Poor'
};

export const RARITY_COLORS = {
  common: '#000000',
  uncommon: '#708090',
  rare: '#FFD700',
  mythic: '#FF4500',
  special: '#9400D3'
};