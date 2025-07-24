import React, { useState } from 'react';
import { useAuthStore } from '../store';
import { SUBSCRIPTION_PRICES, SUBSCRIPTION_LIMITS } from '../constants';
import { SubscriptionType } from '../types';
import Button from '../components/common/Button';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  type: SubscriptionType;
  name: string;
  price: number;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    type: SubscriptionType.FREE,
    name: 'Free',
    price: 0,
    features: [
      { text: '5 grades per month', included: true },
      { text: '1 collection', included: true },
      { text: 'Basic price tracking', included: true },
      { text: 'Mobile app access', included: true },
      { text: 'Daily price updates', included: false },
      { text: 'Bulk operations', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    type: SubscriptionType.BASIC,
    name: 'Basic',
    price: SUBSCRIPTION_PRICES[SubscriptionType.BASIC],
    features: [
      { text: '25 grades per month', included: true },
      { text: '5 collections', included: true },
      { text: 'Daily price updates', included: true },
      { text: 'Price alerts', included: true },
      { text: 'Export data', included: true },
      { text: 'Real-time prices', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    type: SubscriptionType.PRO,
    name: 'Pro',
    price: SUBSCRIPTION_PRICES[SubscriptionType.PRO],
    popular: true,
    features: [
      { text: '100 grades per month', included: true },
      { text: 'Unlimited collections', included: true },
      { text: 'Real-time price updates', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Bulk operations', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: false },
    ],
  },
  {
    type: SubscriptionType.BUSINESS,
    name: 'Business',
    price: SUBSCRIPTION_PRICES[SubscriptionType.BUSINESS],
    features: [
      { text: 'Unlimited grades', included: true },
      { text: 'Unlimited collections', included: true },
      { text: 'Real-time price updates', included: true },
      { text: 'Full API access', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'Team collaboration', included: true },
    ],
  },
];

const SubscriptionPage: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentPlan = user?.subscription.type || SubscriptionType.FREE;

  const handleSelectPlan = async (planType: SubscriptionType) => {
    if (planType === currentPlan || planType === SubscriptionType.FREE) return;

    setSelectedPlan(planType);
    setIsLoading(true);

    try {
      // TODO: Implement Stripe checkout
      console.log('Creating checkout session for plan:', planType);
      // const { sessionUrl } = await apiService.createCheckoutSession(planType);
      // window.location.href = sessionUrl;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen px-4 py-8 safe-area-top">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Your Plan
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upgrade anytime to unlock more features
        </p>
      </header>

      <div className="space-y-6 max-w-lg mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.type}
            className={`card relative ${
              plan.popular ? 'ring-2 ring-primary-600' : ''
            } ${currentPlan === plan.type ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            {currentPlan === plan.type && (
              <div className="absolute -top-3 right-4">
                <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Current Plan
                </span>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                )}
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className={`mr-2 ${feature.included ? 'text-green-600' : 'text-gray-400'}`}>
                    {feature.included ? '✓' : '×'}
                  </span>
                  <span className={`text-sm ${feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {currentPlan === plan.type ? (
              <Button fullWidth disabled variant="secondary">
                Current Plan
              </Button>
            ) : currentPlan !== SubscriptionType.FREE && plan.type === SubscriptionType.FREE ? (
              <Button
                fullWidth
                variant="danger"
                onClick={handleCancelSubscription}
                loading={isLoading}
              >
                Downgrade to Free
              </Button>
            ) : (
              <Button
                fullWidth
                onClick={() => handleSelectPlan(plan.type)}
                loading={isLoading && selectedPlan === plan.type}
                variant={plan.popular ? 'primary' : 'secondary'}
              >
                {plan.type === SubscriptionType.FREE ? 'Select' : `Upgrade to ${plan.name}`}
              </Button>
            )}
          </div>
        ))}
      </div>

      {user?.subscription.cancelAtPeriodEnd && (
        <div className="mt-8 card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 max-w-lg mx-auto">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
            Your subscription will end on {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}.
            You'll be downgraded to the Free plan after this date.
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;