import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';
import apiService from './api';
import { useAuthStore } from '../store';
import { User } from '../types';

const TOKEN_KEY = 'auth_token';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

class AuthService {
  async initialize() {
    try {
      const { value: token } = await Preferences.get({ key: TOKEN_KEY });
      if (token) {
        const profile = await apiService.getProfile();
        useAuthStore.getState().login(profile.user, token);
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await this.logout();
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await apiService.login(email, password);
    const { user, token } = response;
    
    await Preferences.set({ key: TOKEN_KEY, value: token });
    useAuthStore.getState().login(user, token);
    
    return { user, token };
  }

  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    const response = await apiService.register(email, password, name);
    const { user, token } = response;
    
    await Preferences.set({ key: TOKEN_KEY, value: token });
    useAuthStore.getState().login(user, token);
    
    return { user, token };
  }

  async logout() {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: BIOMETRIC_ENABLED_KEY });
    useAuthStore.getState().logout();
  }

  async enableBiometric() {
    const info = await Device.getInfo();
    if (info.platform === 'web') {
      throw new Error('Biometric authentication not available on web');
    }
    
    // This would integrate with native biometric plugins
    await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: 'true' });
  }

  async disableBiometric() {
    await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: 'false' });
  }

  async isBiometricEnabled(): Promise<boolean> {
    const { value } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
    return value === 'true';
  }

  async authenticateWithBiometric(): Promise<boolean> {
    const info = await Device.getInfo();
    if (info.platform === 'web') {
      return false;
    }
    
    // This would integrate with native biometric plugins
    // For now, we'll simulate success
    return true;
  }

  async refreshToken() {
    try {
      const response = await apiService.refreshToken();
      const { token } = response;
      
      await Preferences.set({ key: TOKEN_KEY, value: token });
      useAuthStore.getState().updateUser({});
      
      return token;
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  async forgotPassword(email: string) {
    return apiService.forgotPassword(email);
  }

  async resetPassword(token: string, password: string) {
    return apiService.resetPassword(token, password);
  }
}

export default new AuthService();