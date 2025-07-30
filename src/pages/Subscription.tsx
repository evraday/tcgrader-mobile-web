import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import Button from '../components/common/Button';
import tcgraderLogo from '../assets/tcgrader-logo.png';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
}

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const currentPlanId = user?.subscription?.type || 'free';

  const plans: Plan[] = [
    {
      id: 'collector',
      name: 'The Collector',
      tagline: 'Best Value - Mix & Match',
      monthlyPrice: 12.99,
      yearlyPrice: 129.99,
      popular: true,
      features: [
        { text: 'Choose ANY 2 features:', included: true },
        { text: '• Merchant (Marketplace)', included: true },
        { text: '• Appraiser (Pro-Grading)', included: true },
        { text: 'All benefits of both plans', included: true },
        { text: 'Save 35% vs individual plans', included: true },
        { text: 'Priority support', included: true },
        { text: 'Early access to new features', included: true },
      ],
    },
    {
      id: 'free',
      name: 'Free Explorer',
      tagline: 'Try Before You Buy',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        { text: 'Pay-per-grade pricing', included: true },
        { text: 'Basic collection management', included: true },
        { text: 'Single collection', included: true },
        { text: 'Standard support', included: true },
        { text: 'No monthly credits', included: false },
        { text: 'No bulk operations', included: false },
        { text: 'No marketplace access', included: false },
      ],
    },
    {
      id: 'appraiser',
      name: 'The Appraiser',
      tagline: 'Grade Everything',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      features: [
        { text: '100x grading credits per month', included: true },
        { text: 'Advanced AI analysis', included: true },
        { text: 'Bulk grading tools (coming soon)', included: true },
        { text: 'Grading history', included: true },
        { text: 'Export grade certificates', included: true },
        { text: 'Priority support', included: true },
        { text: 'No marketplace access', included: false },
      ],
    },
    {
      id: 'merchant',
      name: 'The Merchant',
      tagline: 'Marketplace Pro',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      features: [
        { text: 'Full marketplace access', included: true },
        { text: 'Buy & sell cards', included: true },
        { text: '10x free credits per month', included: true },
        { text: 'Transaction analytics', included: true },
        { text: 'Price alerts', included: true },
        { text: 'Seller tools', included: true },
        { text: 'No unlimited grading', included: false },
      ],
    },
  ];

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (planId === currentPlanId) return;

    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      // TODO: Integrate with Stripe API
      console.log('Creating checkout session for plan:', planId, billingCycle);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, just show a message
      alert(`Would create checkout session for ${planId} plan (${billingCycle})`);
    } catch (error) {
      console.error('Error processing plan selection:', error);
      alert('There was an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    setIsLoading(true);
    try {
      // TODO: Implement subscription cancellation
      console.log('Cancelling subscription');
      // await apiService.cancelSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
            </Link>
            <Link to="/profile" className="text-primary-600 hover:text-primary-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 pt-24">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Plan
          </h1>
          <p className="text-gray-600">
            Upgrade anytime to unlock more features
          </p>
        </header>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-full p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs text-accent-600">Save 16%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 shadow-sm relative ${
                plan.popular ? 'ring-2 ring-primary-600' : ''
              } ${currentPlanId === plan.id ? 'bg-primary-50' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {currentPlanId === plan.id && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-success-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {plan.tagline}
                </p>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-gray-900">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-gray-600 ml-1">
                      /{billingCycle === 'monthly' ? 'month' : 'year'}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className={`mr-3 mt-0.5 ${feature.included ? 'text-success-600' : 'text-gray-400'}`}>
                      {feature.included ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {currentPlanId === plan.id ? (
                <Button fullWidth disabled variant="secondary">
                  Current Plan
                </Button>
              ) : currentPlanId !== 'free' && plan.id === 'free' ? (
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={handleCancelSubscription}
                  loading={isLoading}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Downgrade to Free
                </Button>
              ) : (
                <Button
                  fullWidth
                  onClick={() => handleSelectPlan(plan.id)}
                  loading={isLoading && selectedPlan === plan.id}
                  variant={plan.popular ? 'primary' : 'secondary'}
                >
                  {plan.id === 'free' ? 'Select Plan' : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-primary-50 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Good to know
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Cancel or change your plan anytime</li>
            <li>• All plans include mobile app access</li>
            <li>• Prices are in USD</li>
          </ul>
        </div>

        {/* Help Link */}
        <div className="mt-8 text-center">
          <Link to="/help" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Need help choosing? Contact support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;