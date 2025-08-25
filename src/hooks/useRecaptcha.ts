import { useEffect, useCallback } from 'react';
import { RECAPTCHA_SITE_KEY } from '../constants';

interface WindowWithRecaptcha extends Window {
  grecaptcha: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
  };
}

export const useRecaptcha = () => {
  // Load reCAPTCHA script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Skip if no site key is configured
    if (!RECAPTCHA_SITE_KEY) {
      console.info('reCAPTCHA site key not configured. Skipping reCAPTCHA initialization.');
      return;
    }

    // Check if already loaded
    if (document.querySelector('script[src*="recaptcha"]')) return;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Execute reCAPTCHA and get token
  const executeRecaptcha = useCallback(async (action: string): Promise<string> => {
    if (typeof window === 'undefined') {
      return '';
    }
    
    // Return empty token if no site key is configured
    if (!RECAPTCHA_SITE_KEY) {
      console.info('reCAPTCHA site key not configured. Returning empty token.');
      return '';
    }

    const win = window as unknown as WindowWithRecaptcha;

    // Wait a bit for grecaptcha to load
    let attempts = 0;
    while (!win.grecaptcha && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!win.grecaptcha) {
      console.warn('grecaptcha not loaded after waiting');
      return '';
    }

    try {
      return await new Promise<string>((resolve, reject) => {
        win.grecaptcha.ready(() => {
          win.grecaptcha
            .execute(RECAPTCHA_SITE_KEY, { action })
            .then(resolve)
            .catch((error: any) => {
              console.error('reCAPTCHA execute error:', error);
              resolve(''); // Return empty string instead of rejecting
            });
        });
      });
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      return '';
    }
  }, []);

  return { executeRecaptcha };
};