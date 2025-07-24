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
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.api.post('/auth/register', { email, password, name });
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  async resetPassword(token: string, password: string) {
    const response = await this.api.post('/auth/reset-password', { token, password });
    return response.data;
  }

  async refreshToken() {
    const response = await this.api.post('/auth/refresh');
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.api.get('/user/profile');
    return response.data;
  }

  async updateProfile(data: FormData) {
    const response = await this.api.patch('/user/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // Subscription endpoints
  async getSubscription() {
    const response = await this.api.get('/subscription');
    return response.data;
  }

  async createCheckoutSession(priceId: string) {
    const response = await this.api.post('/subscription/checkout', { priceId });
    return response.data;
  }

  async cancelSubscription() {
    const response = await this.api.post('/subscription/cancel');
    return response.data;
  }

  async getUsage() {
    const response = await this.api.get('/subscription/usage');
    return response.data;
  }

  // Collection endpoints
  async getCollections() {
    const response = await this.api.get('/collections');
    return response.data;
  }

  async getCollection(id: string) {
    const response = await this.api.get(`/collections/${id}`);
    return response.data;
  }

  async createCollection(data: { name: string; description?: string; isPublic: boolean }) {
    const response = await this.api.post('/collections', data);
    return response.data;
  }

  async updateCollection(id: string, data: Partial<{ name: string; description?: string; isPublic: boolean }>) {
    const response = await this.api.patch(`/collections/${id}`, data);
    return response.data;
  }

  async deleteCollection(id: string) {
    await this.api.delete(`/collections/${id}`);
  }

  async addCardToCollection(collectionId: string, cardData: any) {
    const response = await this.api.post(`/collections/${collectionId}/cards`, cardData);
    return response.data;
  }

  async removeCardFromCollection(collectionId: string, cardId: string) {
    await this.api.delete(`/collections/${collectionId}/cards/${cardId}`);
  }

  // Card endpoints
  async searchCards(query: string, filters?: any) {
    const response = await this.api.get('/cards/search', { params: { q: query, ...filters } });
    return response.data;
  }

  async getCard(id: string) {
    const response = await this.api.get(`/cards/${id}`);
    return response.data;
  }

  async scanCard(image: Blob) {
    const formData = new FormData();
    formData.append('image', image);
    const response = await this.api.post('/cards/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async getPriceHistory(cardId: string, days: number = 30) {
    const response = await this.api.get(`/cards/${cardId}/prices`, { params: { days } });
    return response.data;
  }

  // Grade endpoints
  async getGrades() {
    const response = await this.api.get('/grades');
    return response.data;
  }

  async getGrade(id: string) {
    const response = await this.api.get(`/grades/${id}`);
    return response.data;
  }

  async createGradeSubmission(data: FormData) {
    const response = await this.api.post('/grades/submit', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async updateGradeStatus(id: string, status: string, data?: any) {
    const response = await this.api.patch(`/grades/${id}/status`, { status, ...data });
    return response.data;
  }

  // Price alert endpoints
  async getPriceAlerts() {
    const response = await this.api.get('/alerts');
    return response.data;
  }

  async createPriceAlert(data: any) {
    const response = await this.api.post('/alerts', data);
    return response.data;
  }

  async updatePriceAlert(id: string, data: any) {
    const response = await this.api.patch(`/alerts/${id}`, data);
    return response.data;
  }

  async deletePriceAlert(id: string) {
    await this.api.delete(`/alerts/${id}`);
  }

  // Image upload
  async uploadImage(file: Blob, type: 'card' | 'grade' | 'profile') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    const response = await this.api.post('/upload', formData, {
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