import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import tcgraderLogo from '../assets/tcgrader-logo.png';

interface HelpCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  articles: HelpArticle[];
}

interface HelpArticle {
  id: string;
  title: string;
  preview: string;
  content?: string;
}

const HelpCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      articles: [
        {
          id: 'create-account',
          title: 'Creating Your TCGrader Account',
          preview: 'Learn how to sign up and set up your profile',
          content: 'To create your TCGrader account, visit our website and click "Sign Up". You\'ll need to provide your email address and create a secure password...'
        },
        {
          id: 'first-collection',
          title: 'Creating Your First Collection',
          preview: 'Step-by-step guide to organizing your cards',
          content: 'Collections help you organize your trading cards by set, type, or any way you prefer. To create your first collection...'
        },
        {
          id: 'app-navigation',
          title: 'Navigating the App',
          preview: 'Overview of main features and how to access them',
          content: 'The TCGrader app is designed to be intuitive and easy to use. Here\'s a quick tour of the main sections...'
        }
      ]
    },
    {
      id: 'grading',
      name: 'Card Grading',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      articles: [
        {
          id: 'submit-cards',
          title: 'How to Submit Cards for Grading',
          preview: 'Complete guide to the submission process',
          content: 'Submitting cards for grading is easy with TCGrader. First, make sure your cards are properly prepared...'
        },
        {
          id: 'grading-services',
          title: 'Choosing a Grading Service',
          preview: 'PSA, BGS, CGC, and more - which is right for you?',
          content: 'TCGrader supports multiple grading services. Each has its own strengths and specialties...'
        },
        {
          id: 'track-submissions',
          title: 'Tracking Your Submissions',
          preview: 'Monitor the status of your graded cards',
          content: 'Once you\'ve submitted cards for grading, you can track their progress in real-time...'
        },
        {
          id: 'grading-tips',
          title: 'Tips for Better Grades',
          preview: 'How to prepare your cards for optimal grading results',
          content: 'Getting the best possible grade starts with proper card care and preparation...'
        }
      ]
    },
    {
      id: 'collections',
      name: 'Collections',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      articles: [
        {
          id: 'organize-collections',
          title: 'Organizing Your Collections',
          preview: 'Best practices for collection management',
          content: 'Well-organized collections make it easy to track your cards and their values...'
        },
        {
          id: 'add-cards',
          title: 'Adding Cards to Collections',
          preview: 'Multiple ways to add cards quickly',
          content: 'TCGrader offers several ways to add cards to your collections, including barcode scanning...'
        },
        {
          id: 'collection-stats',
          title: 'Understanding Collection Statistics',
          preview: 'Track value, completion, and more',
          content: 'Your collection dashboard provides valuable insights into your card portfolio...'
        }
      ]
    },
    {
      id: 'subscription',
      name: 'Subscription & Billing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      articles: [
        {
          id: 'plans-comparison',
          title: 'Comparing TCGrader Plans',
          preview: 'Find the right plan for your needs',
          content: 'TCGrader offers several subscription tiers to match different collecting needs...'
        },
        {
          id: 'upgrade-account',
          title: 'Upgrading Your Account',
          preview: 'How to upgrade to Premium',
          content: 'Upgrading to Premium unlocks unlimited grades, collections, and real-time pricing...'
        },
        {
          id: 'manage-subscription',
          title: 'Managing Your Subscription',
          preview: 'Update payment methods and billing info',
          content: 'You can manage all aspects of your subscription from your account settings...'
        },
        {
          id: 'cancel-subscription',
          title: 'Canceling or Downgrading',
          preview: 'What happens when you change plans',
          content: 'If you need to cancel or downgrade your subscription, here\'s what you need to know...'
        }
      ]
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      articles: [
        {
          id: 'login-issues',
          title: 'Can\'t Log In?',
          preview: 'Solutions for common login problems',
          content: 'If you\'re having trouble logging in, try these troubleshooting steps...'
        },
        {
          id: 'camera-not-working',
          title: 'Camera Scanner Issues',
          preview: 'Fix card scanning problems',
          content: 'If the camera scanner isn\'t working properly, check these settings...'
        },
        {
          id: 'sync-issues',
          title: 'Data Not Syncing',
          preview: 'Resolve sync problems between devices',
          content: 'TCGrader syncs your data across all devices. If you\'re experiencing sync issues...'
        },
        {
          id: 'app-crashes',
          title: 'App Crashes or Freezes',
          preview: 'Steps to resolve stability issues',
          content: 'If the app is crashing or freezing, try these troubleshooting steps...'
        }
      ]
    }
  ];

  const filteredCategories = searchQuery
    ? helpCategories.map(category => ({
        ...category,
        articles: category.articles.filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.preview.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.articles.length > 0)
    : helpCategories;

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {selectedArticle ? (
                <>
                  <button onClick={() => setSelectedArticle(null)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h1 className="text-lg font-semibold text-gray-900">Article</h1>
                </>
              ) : (
                <>
                  <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h1 className="text-lg font-semibold text-gray-900">Help Center</h1>
                </>
              )}
            </div>
            <Link to="/profile">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-full pl-3 pr-1 py-1 hover:bg-gray-100 transition-all">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-gray-500">{user?.isPremium ? 'Premium' : 'Free'} Plan</p>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 pb-8 pt-20">
        {selectedArticle ? (
          // Article View
          <div className="animate-in slide-in-from-right">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedArticle.title}</h2>
              <p className="text-gray-600">{selectedArticle.preview}</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <p className="text-gray-700 leading-relaxed">
                {selectedArticle.content || 'Full article content would be displayed here...'}
              </p>
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Was this helpful?</span> Let us know how we can improve this article.
                </p>
                <div className="flex space-x-3 mt-3">
                  <button className="text-sm text-blue-700 hover:text-blue-800 font-medium">Yes</button>
                  <button className="text-sm text-blue-700 hover:text-blue-800 font-medium">No</button>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Still need help?</p>
                <Link to="/contact">
                  <Button variant="secondary" size="sm">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Category List View
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <Input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                />
              </div>
            </div>

            {/* Popular Articles */}
            {!searchQuery && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Popular Articles</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleArticleClick(helpCategories[0].articles[0])}
                    className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                          Creating Your TCGrader Account
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Get started in minutes</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleArticleClick(helpCategories[1].articles[0])}
                    className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                          How to Submit Cards for Grading
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Step-by-step submission guide</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="space-y-6">
              {filteredCategories.map(category => (
                <div key={category.id}>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="text-primary-600">{category.icon}</div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  </div>
                  <div className="space-y-2">
                    {category.articles.map(article => (
                      <button
                        key={article.id}
                        onClick={() => handleArticleClick(article)}
                        className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                              {article.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{article.preview}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Support CTA */}
            <div className="mt-8 bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-6 text-center border border-primary-100">
              <svg className="w-12 h-12 text-primary-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="font-semibold text-gray-900 mb-2">Can't find what you need?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Our support team is here to help
              </p>
              <Link to="/contact">
                <Button variant="primary" size="sm">
                  Contact Support
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HelpCenterPage;