import { loadStripe, Stripe } from '@stripe/stripe-js';
import { STRIPE_PUBLIC_KEY } from '../constants';
import { SubscriptionType } from '../types';
import apiService from './api';

class StripeService {
  private stripePromise: Promise<Stripe | null>;

  constructor() {
    this.stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }

  async createCheckoutSession(priceId: string): Promise<void> {
    try {
      const stripe = await this.stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Get checkout session from backend
      const { sessionId } = await apiService.createCheckoutSession(priceId);

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      throw error;
    }
  }

  async createPaymentMethod(cardElement: any): Promise<string> {
    try {
      const stripe = await this.stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw error;
      }

      return paymentMethod!.id;
    } catch (error) {
      console.error('Failed to create payment method:', error);
      throw error;
    }
  }

  async confirmCardPayment(clientSecret: string, paymentMethodId: string): Promise<void> {
    try {
      const stripe = await this.stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw error;
    }
  }

  async handleSubscriptionSuccess(sessionId: string): Promise<void> {
    try {
      // Verify the session with backend
      await apiService.post('/subscription/verify-session', { sessionId });
    } catch (error) {
      console.error('Failed to verify subscription session:', error);
      throw error;
    }
  }

  getPriceIds() {
    return {
      [SubscriptionType.BASIC]: process.env.VITE_STRIPE_BASIC_PRICE_ID || '',
      [SubscriptionType.PRO]: process.env.VITE_STRIPE_PRO_PRICE_ID || '',
      [SubscriptionType.BUSINESS]: process.env.VITE_STRIPE_BUSINESS_PRICE_ID || '',
    };
  }
}

export default new StripeService();