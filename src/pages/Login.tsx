import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { useUIStore } from '../store';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { RECAPTCHA_SITE_KEY } from '../constants';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import tcgraderLogo from '../assets/tcgrader-logo.png';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading, setLoading } = useUIStore();
  const { executeRecaptcha } = useRecaptcha();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get reCAPTCHA token
      const captchaToken = await executeRecaptcha('login');
      
      await authService.login(formData.email, formData.password, captchaToken);
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Invalid email or password';
      
      // Check if the error is due to missing captcha
      if (errorMessage === 'Missing captcha.' && !RECAPTCHA_SITE_KEY) {
        errorMessage = 'Login requires reCAPTCHA verification. Please configure RECAPTCHA_SITE_KEY in your environment.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };


  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-5">
        <div className="text-center mb-8">
          <img src={tcgraderLogo} alt="TCGrader" className="h-20 w-auto mx-auto mb-6 float-animation" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your TCGrader account
          </p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-200">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" fullWidth size="lg" variant="primary" loading={isLoading}>
            Sign In
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              className="flex items-center justify-center py-3 px-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#000"/>
              </svg>
            </button>
            <button
              type="button"
              className="flex items-center justify-center py-3 px-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
                <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00"/>
                <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.399 18 7.1905 16.3415 6.3585 14.027L3.0975 16.5395C4.7525 19.778 8.1135 22 12 22Z" fill="#4CAF50"/>
                <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.785L18.7045 19.404C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
              </svg>
            </button>
            <button
              type="button"
              className="flex items-center justify-center py-3 px-4 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up free
            </Link>
          </p>

          {RECAPTCHA_SITE_KEY && (
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500">
                This site is protected by reCAPTCHA and the Google{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  Terms of Service
                </a>{' '}
                apply.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;