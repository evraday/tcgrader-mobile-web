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
      const currentState = useAuthStore.getState();
      
      // If we already have user data and token matches, don't refetch
      if (currentState.user && currentState.token === token && token) {
        return;
      }
      
      if (token) {
        try {
          const profile = await apiService.getProfile();
          if (profile.user) {
            // Clean user data - remove sensitive fields
            const { password: _, passwordHash, confirm, ...user } = profile.user;
            
            // Add computed fields
            user.isPremium = user.subscription?.type !== 'free';
            user.id = user._id; // For backward compatibility
            
            // Merge with existing user data to preserve fields like credits
            const existingUser = currentState.user;
            const mergedUser = existingUser ? { ...existingUser, ...user } : user;
            
            useAuthStore.getState().login(mergedUser, token);
          }
        } catch (profileError) {
          // If profile fetch fails but we have stored user data, keep it
          if (currentState.user && currentState.token === token) {
            console.warn('Failed to refresh profile, using cached data');
            return;
          }
          throw profileError;
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await this.logout();
    }
  }

  async login(email: string, password: string, captchaToken?: string): Promise<{ user: User; token: string }> {
    const response = await apiService.login(email, password, captchaToken);
    const { user: rawUser, token } = response;
    
    // Clean user data - remove sensitive fields
    const { password: _, passwordHash, confirm, ...user } = rawUser;
    
    // Add computed fields
    user.isPremium = user.subscription?.type !== 'free';
    user.id = user._id; // For backward compatibility
    
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