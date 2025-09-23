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
        
        // Enhance error message
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'An unexpected error occurred';
        
        error.message = errorMessage;
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string, captchaToken?: string, rememberMe?: boolean) {
    const response = await this.api.post('/api/auth/login', { 
      email, 
      password,
      captchaToken: captchaToken || '',
      rememberMe: rememberMe || false
    });
    return response.data;
  }

  async register(email: string, password: string, username: string, captchaToken?: string) {
    const response = await this.api.post('/api/auth/signup', { 
      email, 
      password, 
      username,
      captchaToken: captchaToken || ''
    });
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

  async logout() {
    const response = await this.api.post('/api/auth/logout');
    return response.data;
  }

  async getAuthMe() {
    const response = await this.api.get('/api/auth/me');
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.api.post('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }

  async verifyEmail(token: string) {
    const response = await this.api.post('/api/auth/verify-email', { token });
    return response.data;
  }

  async generate2FA() {
    const response = await this.api.post('/api/auth/generate-2fa');
    return response.data;
  }

  async verify2FA(code: string) {
    const response = await this.api.post('/api/auth/verify-2fa', { code });
    return response.data;
  }

  async disable2FA(code: string) {
    const response = await this.api.post('/api/auth/disable-2fa', { code });
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.api.get('/api/user/profile');
    return response.data;
  }

  async updateProfile(data: FormData | any) {
    const isFormData = data instanceof FormData;
    const response = await this.api.put('/api/user/profile', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  async uploadAvatar(image: File) {
    const formData = new FormData();
    formData.append('image', image);
    const response = await this.api.post('/api/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async getUserStats() {
    const response = await this.api.get('/api/user/stats');
    return response.data;
  }

  async getCreditHistory() {
    const response = await this.api.get('/api/user/credit-history');
    return response.data;
  }

  async getNotificationSettings() {
    const response = await this.api.get('/api/user/notification-settings');
    return response.data;
  }

  async updateNotificationSettings(settings: any) {
    const response = await this.api.put('/api/user/notification-settings', settings);
    return response.data;
  }

  async deleteAccount(password: string) {
    const response = await this.api.post('/api/user/delete-account', { 
      password,
      confirmation: 'DELETE'
    });
    return response.data;
  }

  // Payment/Subscription endpoints
  async createCheckoutSession(planType: string, billingCycle: 'monthly' | 'yearly', selectedSubscriptions?: string[]) {
    const response = await this.api.post('/api/payment/create-checkout', { 
      planType, 
      billingCycle,
      selectedSubscriptions
    });
    return response.data;
  }

  async cancelSubscription() {
    const response = await this.api.post('/api/payment/cancel-subscription');
    return response.data;
  }

  async createCreditCheckout(creditAmount: number) {
    const response = await this.api.post('/api/payment/create-credit-checkout', { creditAmount });
    return response.data;
  }

  // Collection endpoints
  async getCollections() {
    try {
      const response = await this.api.get('/api/collections');
      return response.data;
    } catch (error) {
      // Return empty array if API fails (development fallback)
      console.warn('Collections API failed, returning empty array');
      return [];
    }
  }

  async getCollection(id: string) {
    const response = await this.api.get(`/api/collections/${id}`);
    // Handle nested response structure
    return response.data.collection || response.data;
  }

  async createCollection(data: { name: string; description?: string; isPublic: boolean }) {
    const response = await this.api.post('/api/collections', data);
    // Handle nested response structure
    return response.data.collection || response.data;
  }

  async updateCollection(id: string, data: Partial<{ name: string; description?: string; isPublic: boolean; coverImage?: string }>) {
    const response = await this.api.put(`/api/collections/${id}`, data);
    // Handle nested response structure
    return response.data.collection || response.data;
  }

  async deleteCollection(id: string) {
    await this.api.delete(`/api/collections/${id}`);
  }

  async getCollectionCards(collectionId: string, params?: any) {
    const response = await this.api.get(`/api/collections/${collectionId}/cards`, { params });
    return response.data;
  }

  async addCardsToCollection(collectionId: string, cardIds: string[]) {
    const response = await this.api.post('/api/collections/add-cards', {
      collectionId,
      cardIds
    });
    return response.data;
  }

  async removeCardsFromCollection(collectionId: string, cardIds: string[]) {
    const response = await this.api.post(`/api/collections/${collectionId}/remove-cards`, {
      cardIds
    });
    return response.data;
  }

  async getCollectionAnalytics(collectionId: string) {
    const response = await this.api.get(`/api/collections/${collectionId}/analytics`);
    return response.data;
  }

  // Card endpoints
  async getGradedCards(params?: any) {
    const response = await this.api.get('/api/cards/graded', { params });
    return response.data;
  }

  async voteOnCard(cardId: string, vote: 'up' | 'down') {
    const response = await this.api.post(`/api/cards/${cardId}/vote`, { vote });
    return response.data;
  }

  async addCardComment(cardId: string, comment: string) {
    const response = await this.api.post(`/api/cards/${cardId}/comments`, { comment });
    return response.data;
  }

  async getCardComments(cardId: string) {
    const response = await this.api.get(`/api/cards/${cardId}/comments`);
    return response.data;
  }

  async reportCard(cardId: string, reason: string, details: string) {
    const response = await this.api.post(`/api/cards/${cardId}/report`, { reason, details });
    return response.data;
  }

  async getCardPrice(cardId: string) {
    const response = await this.api.get(`/api/cards/${cardId}/price`);
    return response.data;
  }

  async getCardPriceHistory(cardId: string) {
    const response = await this.api.get(`/api/cards/${cardId}/price-history`);
    return response.data;
  }

  async getCard(id: string) {
    const response = await this.api.get(`/api/cards/${id}`);
    return response.data;
  }

  async getPriceHistory(cardId: string, days: number = 30) {
    const response = await this.api.get(`/api/cards/${cardId}/price-history`);
    return response.data;
  }

  async getMyCards() {
    const response = await this.api.get('/api/cards/me');
    return response.data;
  }

  // Grading endpoints
  async gradingStream(frontImage: File, backImage: File) {
    const formData = new FormData();
    formData.append('front', frontImage);
    formData.append('back', backImage);
    const response = await this.api.post('/api/grading/stream', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async gradingStreamV2(frontImage: File, backImage: File) {
    const formData = new FormData();
    formData.append('front', frontImage);
    formData.append('back', backImage);
    const response = await this.api.post('/api/grading/stream-v2', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async gradingStreamV4(frontImage: File, backImage: File) {
    const formData = new FormData();
    formData.append('front', frontImage);
    formData.append('back', backImage);
    const response = await this.api.post('/api/grading/stream-v4', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async saveGradedCard(gradingResult: any, frontImageUrl: string, backImageUrl: string) {
    const response = await this.api.post('/api/grading/save-card', {
      gradingResult,
      frontImageUrl,
      backImageUrl
    });
    return response.data;
  }

  async getPriceEstimate(cardName: string, set: string, grade: number) {
    const response = await this.api.post('/api/grading/price-estimate', {
      cardName,
      set,
      grade
    });
    return response.data;
  }

  // Marketplace endpoints
  async getMarketplace(params?: any) {
    const response = await this.api.get('/api/marketplace', { params });
    return response.data;
  }

  async createMarketplaceListing(data: any) {
    const response = await this.api.post('/api/marketplace', data);
    return response.data;
  }

  async getMarketplaceListing(id: string) {
    const response = await this.api.get(`/api/marketplace/listing/${id}`);
    return response.data;
  }

  async updateMarketplaceListing(id: string, data: any) {
    const response = await this.api.put(`/api/marketplace/listing/${id}`, data);
    return response.data;
  }

  async deleteMarketplaceListing(id: string) {
    const response = await this.api.delete(`/api/marketplace/listing/${id}`);
    return response.data;
  }

  async makeOffer(listingId: string, offerAmount: number, message: string) {
    const response = await this.api.post('/api/marketplace/offer', {
      listingId,
      offerAmount,
      message
    });
    return response.data;
  }

  async placeBid(bidId: string, bidAmount: number) {
    const response = await this.api.post(`/api/marketplace/bid/${bidId}`, { bidAmount });
    return response.data;
  }

  async createTradeOffer(data: any) {
    const response = await this.api.post('/api/marketplace/trade-offer', data);
    return response.data;
  }

  async getMyListings() {
    const response = await this.api.get('/api/marketplace/me');
    return response.data;
  }

  async getMyOffers(type?: 'sent' | 'received') {
    const response = await this.api.get('/api/marketplace/offers/me', { 
      params: type ? { type } : undefined 
    });
    return response.data;
  }

  // Notification endpoints
  async getNotifications(params?: any) {
    const response = await this.api.get('/api/notifications', { params });
    return response.data;
  }

  async getNotificationCount() {
    const response = await this.api.get('/api/notifications/count');
    return response.data;
  }

  async markNotificationRead(id: string) {
    const response = await this.api.put(`/api/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.api.post('/api/notifications/read-all');
    return response.data;
  }

  // Dashboard/Analytics endpoints
  async getCollectionStats() {
    const response = await this.api.get('/api/dashboard/collection-stats');
    return response.data;
  }

  async getGradingStats() {
    const response = await this.api.get('/api/dashboard/grading-stats');
    return response.data;
  }

  async getMarketStats() {
    const response = await this.api.get('/api/dashboard/market-stats');
    return response.data;
  }

  async getRecentGrades() {
    const response = await this.api.get('/api/dashboard/recent-grades');
    return response.data;
  }

  async getGradeDistribution() {
    const response = await this.api.get('/api/dashboard/grade-analysis/distribution');
    return response.data;
  }

  // Public endpoints
  async getPublicRecentGrades() {
    const response = await this.api.get('/api/public/recent-grades');
    return response.data;
  }

  async getPublicRecentListings() {
    const response = await this.api.get('/api/public/recent-listings');
    return response.data;
  }

  async getPublicRecentSales() {
    const response = await this.api.get('/api/public/recent-sales');
    return response.data;
  }

  async getPlatformStats() {
    const response = await this.api.get('/api/stats');
    return response.data;
  }

  async getApiVersion() {
    const response = await this.api.get('/api/version');
    return response.data;
  }

  // Upload endpoints
  async uploadToS3(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post('/api/upload/s3', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async uploadTradeImages(images: File[]) {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append(`image${index}`, image);
    });
    const response = await this.api.post('/api/upload/trade-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // Contact/Feedback endpoints
  async sendContactMessage(name: string, email: string, message: string, captchaToken: string) {
    const response = await this.api.post('/api/contact/send', {
      name,
      email,
      message,
      captchaToken
    });
    return response.data;
  }

  async sendFeedback(type: string, message: string) {
    const response = await this.api.post('/api/feedback/send', {
      type,
      message
    });
    return response.data;
  }

  // Geocoding endpoint
  async geocodeAddress(address: string) {
    const response = await this.api.get('/api/geocoding', {
      params: { address }
    });
    return response.data;
  }

  // Legacy compatibility methods - keeping for backward compatibility
  async uploadImage(file: Blob, type: 'card' | 'grade' | 'profile') {
    return this.uploadToS3(file as File);
  }

  async searchCards(query: string, filters?: any) {
    return this.getGradedCards({ search: query, ...filters });
  }

  async getTopPerformers(period: 'day' | 'week' | 'month' = 'month') {
    return this.getMarketStats();
  }

  async scanCard(image: Blob) {
    return this.gradingStream(image as File, image as File);
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