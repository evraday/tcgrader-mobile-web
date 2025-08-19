import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import { useUIStore } from '../store';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import tcgraderLogo from '../assets/tcgrader-logo.png';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setLoading, setError } = useUIStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setError(null);
    setLoading(true);

    try {
      await authService.register(formData.email, formData.password, formData.name);
      navigate('/');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({
        ...prev,
        [e.target.name]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="max-w-md w-full mx-auto px-5 py-8">
        <div className="text-center mb-8">
          <img src={tcgraderLogo} alt="TCGrader" className="h-20 w-auto mx-auto mb-6 float-animation" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Start managing your collection today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
            <Input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              autoComplete="name"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800/70 rounded-xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <Input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800/70 rounded-xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <Input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800/70 rounded-xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-white dark:bg-slate-800/70 rounded-xl border border-gray-200 dark:border-slate-700/40 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all text-gray-900 dark:text-gray-200"
            />
          </div>

          <div className="space-y-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1"
                required
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <Button type="submit" fullWidth size="lg" variant="primary">
              Create Free Account
            </Button>
          </div>

          <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-5 border border-primary-100">
            <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-3 flex items-center">
              <svg className="w-5 h-5 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Free Plan Includes:
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>5 free card grades per month</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>1 collection with unlimited cards</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Basic price tracking</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-success-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Mobile app access</span>
              </li>
            </ul>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;