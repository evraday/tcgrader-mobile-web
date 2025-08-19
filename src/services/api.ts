import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../constants';
import { useAuthStore } from '../store';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string, captchaToken?: string) {
    const response = await this.api.post('/api/auth/login', { 
      email, 
      password,
      captchaToken: captchaToken || ''
    });
    return response.data;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.api.post('/api/auth/register', { email, password, name });
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.api.post('/api/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await this.api.post('/api/auth/reset-password', { token, password });
    return response.data;
  }

  async refreshToken() {
    const response = await this.api.post('/api/auth/refresh');
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.api.get('/api/user/profile');
    return response.data;
  }

  async updateProfile(data: FormData) {
    const response = await this.api.patch('/api/user/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async uploadAvatar(file: Blob) {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await this.api.post('/api/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async updateNotificationSettings(settings: any) {
    const response = await this.api.patch('/api/user/settings/notifications', settings);
    return response.data;
  }

  async updateSecuritySettings(settings: any) {
    const response = await this.api.patch('/api/user/settings/security', settings);
    return response.data;
  }

  // Subscription endpoints
  async getSubscription() {
    const response = await this.api.get('/api/subscription');
    return response.data;
  }

  async createCheckoutSession(priceId: string) {
    const response = await this.api.post('/api/subscription/checkout', { priceId });
    return response.data;
  }

  async cancelSubscription() {
    const response = await this.api.post('/api/subscription/cancel');
    return response.data;
  }

  async getUsage() {
    const response = await this.api.get('/api/subscription/usage');
    return response.data;
  }

  // Collection endpoints
  async getCollections() {
    const response = await this.api.get('/api/collections');
    return response.data;
  }

  async getCollection(id: string) {
    const response = await this.api.get(`/api/collections/${id}`);
    return response.data;
  }

  async createCollection(data: { name: string; description?: string; isPublic: boolean }) {
    const response = await this.api.post('/api/collections', data);
    return response.data;
  }

  async updateCollection(id: string, data: Partial<{ name: string; description?: string; isPublic: boolean; coverImage?: string }>) {
    const response = await this.api.put(`/api/collections/${id}`, data);
    return response.data;
  }

  async deleteCollection(id: string) {
    await this.api.delete(`/api/collections/${id}`);
  }

  async addCardToCollection(collectionId: string, cardData: any) {
    const response = await this.api.post(`/api/collections/${collectionId}/cards`, cardData);
    return response.data;
  }

  async removeCardFromCollection(collectionId: string, cardId: string) {
    await this.api.delete(`/api/collections/${collectionId}/cards/${cardId}`);
  }

  // Card endpoints
  async searchCards(query: string, filters?: any) {
    const response = await this.api.get('/api/cards/search', { params: { q: query, ...filters } });
    return response.data;
  }

  async getCard(id: string) {
    const response = await this.api.get(`/api/cards/${id}`);
    return response.data;
  }

  async scanCard(image: Blob) {
    const formData = new FormData();
    formData.append('image', image);
    const response = await this.api.post('/api/cards/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async getPriceHistory(cardId: string, days: number = 30) {
    const response = await this.api.get(`/api/cards/${cardId}/prices`, { params: { days } });
    return response.data;
  }

  async getMyCards() {
    const response = await this.api.get('/api/cards/me');
    return response.data;
  }

  async getUncollectedCards() {
    const response = await this.api.get('/api/cards/uncollected');
    return response.data;
  }

  // Marketplace endpoints
  async getMyListings() {
    const response = await this.api.get('/api/marketplace/me');
    return response.data;
  }

  async getMarketInsights(timeframe: string = '30d') {
    const response = await this.api.get('/api/marketplace/analytics/market-insights', { 
      params: { timeframe } 
    });
    return response.data;
  }

  async getComprehensiveStats() {
    const response = await this.api.get('/api/marketplace/analytics/comprehensive-stats');
    return response.data;
  }

  async getRecentActivity() {
    try {
      const response = await this.api.get('/api/activity/recent');
      return response.data;
    } catch (error) {
      // Return mock data for development
      return {
        activity: [
          {
            id: '1',
            type: 'grade',
            title: 'Grade Received',
            description: 'Charizard VMAX received PSA 10',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'collection',
            title: 'Card Added',
            description: 'Added Pikachu to Japanese Collection',
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'price_alert',
            title: 'Price Alert',
            description: 'Black Lotus increased by 15%',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
    }
  }

  async getTopPerformers(limit: number = 10, timeframe: string = '30d') {
    const response = await this.api.get('/api/marketplace/analytics/top-performers', { 
      params: { limit, timeframe } 
    });
    return response.data;
  }

  // Grade endpoints
  async getGrades() {
    const response = await this.api.get('/api/grades');
    return response.data;
  }

  async getGrade(id: string) {
    const response = await this.api.get(`/api/grades/${id}`);
    return response.data;
  }

  async createGradeSubmission(data: FormData) {
    const response = await this.api.post('/api/grades/submit', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async updateGradeStatus(id: string, status: string, data?: any) {
    const response = await this.api.patch(`/api/grades/${id}/status`, { status, ...data });
    return response.data;
  }

  // Bulk grading queue endpoints
  async createBulkGradingQueue(cards: { front: string; back: string }[]) {
    const response = await this.api.post('/api/grading/queue/bulk', { 
      cards,
      mode: 'bulk'
    });
    return response.data;
  }

  async getGradingQueue(queueId: string) {
    const response = await this.api.get(`/api/grading/queue/${queueId}`);
    return response.data;
  }

  async submitGradingQueue(queueId: string) {
    const response = await this.api.post(`/api/grading/queue/${queueId}/submit`);
    return response.data;
  }

  async cancelGradingQueue(queueId: string) {
    const response = await this.api.delete(`/api/grading/queue/${queueId}`);
    return response.data;
  }

  async addToGradingQueue(queueId: string, card: { front: string; back: string }) {
    const response = await this.api.post(`/api/grading/queue/${queueId}/cards`, card);
    return response.data;
  }

  async removeFromGradingQueue(queueId: string, cardId: string) {
    const response = await this.api.delete(`/api/grading/queue/${queueId}/cards/${cardId}`);
    return response.data;
  }

  async getGradingQueueStatus(queueId: string) {
    const response = await this.api.get(`/api/grading/queue/${queueId}/status`);
    return response.data;
  }

  // Price alert endpoints
  async getPriceAlerts() {
    const response = await this.api.get('/api/alerts');
    return response.data;
  }

  async createPriceAlert(data: any) {
    const response = await this.api.post('/api/alerts', data);
    return response.data;
  }

  async updatePriceAlert(id: string, data: any) {
    const response = await this.api.patch(`/api/alerts/${id}`, data);
    return response.data;
  }

  async deletePriceAlert(id: string) {
    await this.api.delete(`/api/alerts/${id}`);
  }

  // Image upload
  async uploadImage(file: Blob, type: 'card' | 'grade' | 'profile') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    const response = await this.api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // Generic methods for custom endpoints
  async get(url: string, config?: any) {
    const response = await this.api.get(url, config);
    return response.data;
  }

  async post(url: string, data?: any, config?: any) {
    const response = await this.api.post(url, data, config);
    return response.data;
  }

  async put(url: string, data?: any, config?: any) {
    const response = await this.api.put(url, data, config);
    return response.data;
  }

  async delete(url: string, config?: any) {
    const response = await this.api.delete(url, config);
    return response.data;
  }
}

export default new ApiService();