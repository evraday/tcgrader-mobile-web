import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGradeStore, useAuthStore } from '../store';
import { GradingService, Card, GradeImages, SubscriptionType } from '../types';
import { SUBSCRIPTION_LIMITS, GRADING_SERVICE_NAMES } from '../constants';
import cameraService from '../services/camera';
import apiService from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import CardScanner, { CardScannerRef } from '../components/cards/CardScanner';
import PhotoEditor from '../components/cards/PhotoEditor';
import GradingImageViewer from '../components/cards/GradingImageViewer';
import { useGrading } from '../hooks/useGrading';
import tcgraderLogo from '../assets/tcgrader-logo.png';

const GradeSubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addGrade } = useGradeStore();
  const { grade, result, loading: grading, error: gradingError, status: gradingStatus, progress: gradingProgress, resetGrading } = useGrading();
  
  const [gradingMode, setGradingMode] = useState<'instant' | 'bulk' | null>(null);
  const [step, setStep] = useState<'mode-select' | 'front' | 'flip' | 'back' | 'confirm' | 'grading' | 'result' | 'bulk-intro' | 'bulk-capture' | 'bulk-review'>('mode-select');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [tempFrontImage, setTempFrontImage] = useState<string | null>(null);
  const [tempBackImage, setTempBackImage] = useState<string | null>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<'front' | 'back' | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [gradingService, setGradingService] = useState<GradingService | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ gradesUsedThisMonth: number } | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [animatingStep, setAnimatingStep] = useState(false);
  const [qualityChecks, setQualityChecks] = useState({
    edgesVisible: false,
    noGlare: false,
    sharpDetails: false
  });
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [frontImageInFront, setFrontImageInFront] = useState(true);
  
  // Bulk grading states with draft support
  const [bulkPhotos, setBulkPhotos] = useState<{ front: string; back: string; id: string }[]>(() => {
    // Load draft from localStorage with error handling
    try {
      const draft = localStorage.getItem('bulk-grading-draft');
      return draft ? JSON.parse(draft) : [];
    } catch (error) {
      console.warn('Unable to load draft from localStorage:', error);
      return [];
    }
  });
  const [currentBulkCard, setCurrentBulkCard] = useState<{ front: string | null; back: string | null }>({ front: null, back: null });
  const [bulkStep, setBulkStep] = useState<'front' | 'back'>('front');
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [showBulkSuccess, setShowBulkSuccess] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const bulkScannerRef = useRef<CardScannerRef>(null);
  const [showBulkPhotoEditor, setShowBulkPhotoEditor] = useState(false);
  const [tempBulkImage, setTempBulkImage] = useState<string | null>(null);
  const [editingBulkStep, setEditingBulkStep] = useState<'front' | 'back'>('front');
  const [showCardComplete, setShowCardComplete] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkQueueId, setBulkQueueId] = useState<string | null>(null);
  const [bulkSubmissionStatus, setBulkSubmissionStatus] = useState<'idle' | 'creating' | 'submitting' | 'success' | 'error'>('idle');
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showFrontCardSuccess, setShowFrontCardSuccess] = useState(false);
  const [showBulkCaptureUI, setShowBulkCaptureUI] = useState(false);
  
  // Scroll to top when entering bulk-review step
  useEffect(() => {
    if (step === 'bulk-review') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [step]);

  // Trigger fade-in when entering bulk-capture
  useEffect(() => {
    if (step === 'bulk-capture') {
      setShowBulkCaptureUI(false);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setShowBulkCaptureUI(true);
      }, 50);
    }
  }, [step]);

  const subscriptionType = user?.subscription?.type === 'merchant' 
    ? SubscriptionType.BUSINESS 
    : user?.subscription?.type === 'collector'
    ? SubscriptionType.COLLECTOR
    : (user?.subscription?.type as SubscriptionType) || SubscriptionType.FREE;
  
  const limits = user ? SUBSCRIPTION_LIMITS[subscriptionType] : null;
  const canSubmit = limits && (limits.gradesPerMonth === -1 || 
    (usage && usage.gradesUsedThisMonth < limits.gradesPerMonth));
  
  // Check if user can upgrade (not on Collector or Appraiser plans)
  const canUpgradePlan = subscriptionType !== SubscriptionType.PRO && 
    subscriptionType !== SubscriptionType.BUSINESS;
  
  const allQualityChecksPassed = qualityChecks.edgesVisible && 
    qualityChecks.noGlare && 
    qualityChecks.sharpDetails;

  useEffect(() => {
    fetchUsage();
  }, []);

  // Auto-save bulk photos to draft with error handling
  useEffect(() => {
    try {
      if (bulkPhotos.length > 0) {
        // Limit to last 10 cards to prevent quota issues
        const limitedPhotos = bulkPhotos.slice(-10);
        localStorage.setItem('bulk-grading-draft', JSON.stringify(limitedPhotos));
      } else {
        localStorage.removeItem('bulk-grading-draft');
      }
    } catch (error) {
      console.warn('Unable to save draft to localStorage:', error);
      // If quota exceeded, try to clear some space
      if (error instanceof DOMException && error.code === 22) {
        try {
          // Clear old drafts or other cached data
          const keysToCheck = ['bulk-grading-draft', 'grading-draft', 'card-cache'];
          keysToCheck.forEach(key => {
            if (localStorage.getItem(key)) {
              localStorage.removeItem(key);
            }
          });
          // Try again with just the last 5 cards
          const minimalPhotos = bulkPhotos.slice(-5);
          localStorage.setItem('bulk-grading-draft', JSON.stringify(minimalPhotos));
        } catch (retryError) {
          console.error('Unable to save draft even after cleanup:', retryError);
        }
      }
    }
  }, [bulkPhotos]);

  useEffect(() => {
    if (result) {
      setStep('result');
    }
  }, [result]);

  const fetchUsage = async () => {
    try {
      const data = await apiService.getUsage();
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
      // Set default usage if API fails
      setUsage({ gradesUsedThisMonth: 0 });
    } finally {
      setUsageLoading(false);
    }
  };

  const handleFrontImageCaptured = (imageUrl: string) => {
    setTempFrontImage(imageUrl);
    setEditingPhoto('front');
    setShowPhotoEditor(true);
  };

  const handleBackImageCaptured = (imageUrl: string) => {
    setTempBackImage(imageUrl);
    setEditingPhoto('back');
    setShowPhotoEditor(true);
  };

  const handlePhotoEditorConfirm = (editedImageUrl: string) => {
    setAnimatingStep(true);
    if (editingPhoto === 'front') {
      setFrontImage(editedImageUrl);
      setTimeout(() => {
        setStep('flip');
        setAnimatingStep(false);
      }, 300);
    } else if (editingPhoto === 'back') {
      setBackImage(editedImageUrl);
      setTimeout(() => {
        setStep('confirm');
        setAnimatingStep(false);
      }, 300);
    }
    setShowPhotoEditor(false);
    setEditingPhoto(null);
  };

  const handlePhotoEditorCancel = () => {
    setShowPhotoEditor(false);
    setEditingPhoto(null);
    setTempFrontImage(null);
    setTempBackImage(null);
  };

  const handleBulkPhotoEditorConfirm = (editedImageUrl: string) => {
    if (editingBulkStep === 'front') {
      setCurrentBulkCard({ front: editedImageUrl, back: null });
      setShowBulkPhotoEditor(false); // Hide editor immediately
      setShowFrontCardSuccess(true);
      
      // Show success message for 1.5 seconds before transitioning
      setTimeout(() => {
        setShowFrontCardSuccess(false);
        setShowBulkCaptureUI(false); // Fade out
        
        // Small delay then fade in with new content
        setTimeout(() => {
          setBulkStep('back');
          setShowBulkCaptureUI(true); // Fade in
        }, 100);
      }, 1500);
    } else {
      const newCard = {
        id: Date.now().toString(),
        front: currentBulkCard.front!,
        back: editedImageUrl
      };
      setBulkPhotos([...bulkPhotos, newCard]);
      
      // Clear current card FIRST to prevent showing old images
      setCurrentBulkCard({ front: null, back: null });
      setBulkStep('front');
      
      // Then show success animation and card complete message
      setShowBulkSuccess(true);
      setShowCardComplete(true);
      
      // Hide the success message after 2.5 seconds to show "Scan Front" again
      setTimeout(() => {
        setShowBulkSuccess(false);
        setShowCardComplete(false);
        setShowBulkCaptureUI(false); // Fade out
        
        // Small delay then fade in with new content
        setTimeout(() => {
          setBulkStep('front');
          setShowBulkCaptureUI(true); // Fade in
        }, 100);
      }, 2500);
    }
    setShowBulkPhotoEditor(false);
    setTempBulkImage(null);
  };

  const handleBulkPhotoEditorCancel = () => {
    setShowBulkPhotoEditor(false);
    setTempBulkImage(null);
  };

  const openImageViewer = (imageUrl: string) => {
    setViewerImage(imageUrl);
    setShowImageViewer(true);
  };

  const handleRetakeFront = () => {
    setStep('front');
    setFrontImage(null);
  };

  const handleRetakeBack = () => {
    setStep('back');
    setBackImage(null);
  };

  const handleBulkSubmit = async () => {
    try {
      setIsSubmittingBulk(true);
      setBulkSubmissionStatus('creating');
      
      // Create bulk grading queue
      const queueResponse = await apiService.createBulkGradingQueue(bulkPhotos);
      setBulkQueueId(queueResponse.queueId);
      
      setBulkSubmissionStatus('submitting');
      
      // Submit the queue for processing
      await apiService.submitGradingQueue(queueResponse.queueId);
      
      setBulkSubmissionStatus('success');
      
      // Clear draft after successful submission
      localStorage.removeItem('bulk-grading-draft');
      setBulkPhotos([]);
      
      // Show success message and navigate
      setTimeout(() => {
        navigate('/grades');
      }, 2000);
      
    } catch (error: any) {
      console.error('Bulk submission error:', error);
      setBulkSubmissionStatus('error');
      alert(error.message || 'Failed to submit cards for grading. Please try again.');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleImagesConfirmed = async () => {
    if (!frontImage || !backImage || !allQualityChecksPassed) return;
    
    try {
      setIsLoading(true);
      setStep('grading');
      
      // Create FormData for the grading API
      const formData = new FormData();
      
      // Convert images to blobs
      const frontResponse = await fetch(frontImage);
      const frontBlob = await frontResponse.blob();
      const backResponse = await fetch(backImage);
      const backBlob = await backResponse.blob();
      
      // Add images to FormData
      formData.append('front', frontBlob, 'front.jpg');
      formData.append('back', backBlob, 'back.jpg');
      
      // Start the grading process
      grade(formData);
    } catch (error: any) {
      setError(error.message || 'Failed to process card images');
      setStep('confirm');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save card when grading is complete
  useEffect(() => {
    const autoSaveCard = async () => {
      if (result && step === 'result') {
        try {
          const response = await fetch('/api/grading/save-card-v4', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({
              gradingResult: result,
              frontImageUrl: result.images?.frontUrl,
              backImageUrl: result.images?.backUrl
            })
          });

          if (response.ok) {
            const savedCard = await response.json();
            console.log('Card auto-saved:', savedCard);
          } else {
            console.error('Failed to auto-save card:', response.statusText);
          }
        } catch (error) {
          console.error('Error auto-saving card:', error);
        }
      }
    };

    autoSaveCard();
  }, [result, step]);

  const handleRetakePhotos = () => {
    setFrontImage(null);
    setBackImage(null);
    setStep('front');
  };

  const handleServiceSelect = (service: GradingService) => {
    setGradingService(service);
    setStep('bulk-review');
  };

  const handleSubmit = async () => {
    if (!selectedCard || !gradingService || !frontImage || !backImage) return;

    try {
      setIsLoading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('cardId', selectedCard.id);
      formData.append('service', gradingService);
      
      // Add images
      const frontBlob = await fetch(frontImage).then(r => r.blob());
      const backBlob = await fetch(backImage).then(r => r.blob());
      
      formData.append('front', frontBlob, 'front.jpg');
      formData.append('back', backBlob, 'back.jpg');

      const grade = await apiService.createGradeSubmission(formData);
      addGrade(grade);
      
      navigate('/grades');
    } catch (error: any) {
      setError(error.message || 'Failed to submit for grading');
    } finally {
      setIsLoading(false);
    }
  };

  if (usageLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        {/* Fixed Header Skeleton */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/40 safe-area-top">
          <div className="max-w-md mx-auto px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-md mx-auto px-5 py-6 pb-24 pt-24">
          <div className="mb-8">
            <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded mb-2 animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
          
          {/* Card Preview Skeleton */}
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-6 mb-6 animate-pulse">
            <div className="aspect-[3/4] bg-gray-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
          
          {/* Button Skeleton */}
          <div className="h-14 bg-gray-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!canSubmit && usage && limits) {
    return (
      <div className="min-h-screen bg-transparent">
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/40 safe-area-top">
          <div className="max-w-md mx-auto px-5 py-3">
            <div className="flex items-center justify-between">
              <Link to="/">
                <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
              </Link>
              <Link to="/profile">
                <div className="flex items-center space-x-3 bg-gray-100 dark:bg-slate-700/50 rounded-full pl-3 pr-1 py-1 hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-all">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{user?.username || user?.name?.split(' ')[0]}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user?.subscription?.type || 'Free'} Plan</p>
                  </div>
                  {user?.avatar ? (
                    <img 
                      src={`https://www.tcgrader.com${user.avatar}`} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {user?.username?.charAt(0) || user?.name?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-md mx-auto px-5 py-6 pb-24 pt-24">
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700/40">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-2 text-center">Grade Limit Reached</h2>
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Usage</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-200">
                  {usage.gradesUsedThisMonth} / {limits.gradesPerMonth}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gray-900 dark:bg-gray-600 h-2 rounded-full transition-all"
                  style={{ width: `${(usage.gradesUsedThisMonth / limits.gradesPerMonth) * 100}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
              {canUpgradePlan 
                ? 'Purchase additional grades or upgrade your plan for more monthly grades.'
                : 'Purchase additional grades to continue grading this month.'
              }
            </p>
            
            <div className="space-y-3">
              <Button 
                fullWidth 
                variant="primary"
                onClick={() => navigate('/subscription?purchase=grades')}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Purchase Grades</span>
                </div>
              </Button>
              
              {canUpgradePlan && (
                <Button 
                  fullWidth 
                  variant="secondary"
                  onClick={() => navigate('/subscription')}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>Upgrade Plan</span>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className=" bg-transparent">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700/40 safe-area-top">
        <div className="max-w-md mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <Link to="/">
              <img src={tcgraderLogo} alt="TCGrader" className="h-10 w-auto" />
            </Link>
            <Link to="/profile">
              <div className="flex items-center space-x-3 bg-gray-100 dark:bg-slate-700/50 rounded-full pl-3 pr-1 py-1 hover:bg-gray-200 dark:hover:bg-slate-600/50 transition-all">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{user?.username || user?.name?.split(' ')[0]}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user?.subscription?.type || 'Free'} Plan</p>
                </div>
                {user?.avatar ? (
                  <img 
                    src={`https://www.tcgrader.com${user.avatar}`} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {user?.username?.charAt(0) || user?.name?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-md mx-auto px-5 py-6 pb-24 pt-24">
        {/* Mode Selection Screen */}
        {step === 'mode-select' && (
          <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center animate-fade-in">
            <div className="w-full max-w-sm space-y-8">
              {/* Title */}
              <div className="text-center space-y-3">
                <h1 className="text-4xl font-black bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400 bg-clip-text text-transparent">
                  GRADING MODE
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  Choose your authentication method
                </p>
              </div>

              {/* Mode Options */}
              <div className="space-y-4">
                {/* Instant Grade Option */}
                <button
                  onClick={() => {
                    setGradingMode('instant');
                    setStep('front');
                  }}
                  className="group relative w-full bg-white dark:bg-slate-800/70 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Instant Grade
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Grade a single card with real-time AI analysis
                      </p>
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">~60 seconds</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">Immediate results</span>
                        </div>
                      </div>
                    </div>
                    
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Bulk Grade Option */}
                <button
                  onClick={() => {
                    setGradingMode('bulk');
                    setStep('bulk-intro');
                  }}
                  className="group relative w-full bg-white dark:bg-slate-800/70 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-accent-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-500/10 to-accent-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Bulk Grade
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300">
                          NEW
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Scan multiple cards efficiently in one session
                      </p>
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">Multiple cards</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">Queue processing</span>
                        </div>
                      </div>
                    </div>
                    
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-accent-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              {/* Usage Info */}
              {usage && limits && (
                <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have{' '}
                    <span className="font-bold text-gray-900 dark:text-gray-200">
                      {limits.gradesPerMonth === -1 
                        ? 'unlimited' 
                        : `${limits.gradesPerMonth - usage.gradesUsedThisMonth}`}
                    </span>
                    {' '}grades remaining this month
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remaining Grades Info - Only show for instant grading */}
        {gradingMode === 'instant' && usage && limits && limits.gradesPerMonth !== -1 && step !== 'mode-select' && (
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Allowance</span>
              <span className="text-sm font-bold text-gray-900 dark:text-gray-200">
                {limits.gradesPerMonth - usage.gradesUsedThisMonth} remaining
              </span>
            </div>
          </div>
        )}
        
        {/* Progress Indicator - Only for instant grading */}
        {gradingMode === 'instant' && step !== 'mode-select' && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className={`flex flex-col items-center flex-1 ${['front', 'flip', 'back', 'confirm'].includes(step) ? 'text-gray-900 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  ['front', 'flip', 'back', 'confirm'].includes(step) ? 'bg-gray-900 dark:bg-gray-700 text-white border-gray-900 dark:border-gray-700' : 'bg-white dark:bg-slate-800/70 border-gray-300 dark:border-slate-600'
                }`}>1</div>
                <span className="text-xs font-medium mt-1">Photos</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 -mt-5"></div>
              <div className={`flex flex-col items-center flex-1 ${['grading'].includes(step) ? 'text-gray-900 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  ['grading'].includes(step) ? 'bg-gray-900 dark:bg-gray-700 text-white border-gray-900 dark:border-gray-700' : 'bg-white dark:bg-slate-800/70 border-gray-300 dark:border-slate-600'
                }`}>2</div>
                <span className="text-xs font-medium mt-1">AI Grading</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-700 -mt-5"></div>
              <div className={`flex flex-col items-center flex-1 ${step === 'result' ? 'text-gray-900 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  step === 'result' ? 'bg-gray-900 dark:bg-gray-700 text-white border-gray-900 dark:border-gray-700' : 'bg-white dark:bg-slate-800/70 border-gray-300 dark:border-slate-600'
                }`}>3</div>
                <span className="text-xs font-medium mt-1">AI Results</span>
              </div>
            </div>
          </div>
        )}

        {(error || gradingError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-300">{error || gradingError}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    if (gradingError) {
                      resetGrading();
                    }
                  }}
                  className="text-red-600 dark:text-red-400 text-sm mt-2 font-medium hover:text-red-700 dark:hover:text-red-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

      {step === 'front' && (
        <div className={`transition-all duration-300 ${animatingStep ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          {/* Clean Header */}
          <div className="text-center mb-8">
            
            <h2 className="text-3xl font-black text-gray-900 dark:text-gray-200 mb-2">CARD FRONT</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Capture the front of your card</p>
          </div>

          {/* Scanner Card */}
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-slate-700/40">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200">Capture Zone</h3>
                <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>SECURE</span>
                </div>
              </div>
              
              <CardScanner
                onImageCaptured={handleFrontImageCaptured}
                onError={setError}
                captureMode="front"
              />
            </div>

            {/* Guidelines */}
            <div className="border-t border-gray-200 dark:border-slate-700/40 pt-6">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-4">Capture Guidelines</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-200">Natural Light</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">No harsh shadows</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-200">Flat Surface</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Keep card level</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-200">Center Card</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Fill the frame</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-200">No Glare</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Avoid reflections</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {step === 'flip' && frontImage && (
        <div className={`transition-all duration-300 ${animatingStep ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          {/* Success State */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2">Great Shot!</h2>
            <p className="text-gray-600 dark:text-gray-400">Now let's capture the back of your card</p>
          </div>

          {/* Instruction Card */}
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700/40">
            {/* Captured Card Preview */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-20 bg-gray-100 dark:bg-slate-700/50 rounded-lg shadow-sm overflow-hidden">
                <img src={frontImage} alt="Front of card" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-200 mb-1">Front Captured</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your card front has been saved</p>
              </div>
            </div>

            {/* Flip Instructions */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-700 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-1">Turn Your Card Over</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Flip your card to show the back side, then continue to capture the next photo.</p>
                </div>
              </div>
            </div>

            {/* Premium Visual Guide */}
            <div className="bg-gray-900 dark:bg-slate-900 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">Card Position Guide</h4>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-center transform hover:scale-110 transition-transform">
                    <div className="relative">
                      <div className="w-24 h-32 bg-primary-600 rounded-xl shadow-2xl flex items-center justify-center mb-3 transform perspective-1000 rotate-y-0">
                        <span className="text-sm font-bold text-white">FRONT</span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-400">CAPTURED</p>
                  </div>
                  
                  <div className="relative">
                    <svg className="w-12 h-12 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    <div className="absolute inset-0 blur-xl bg-white opacity-30"></div>
                  </div>
                  
                  <div className="text-center transform hover:scale-110 transition-transform">
                    <div className="relative">
                      <div className="w-24 h-32 bg-accent-600 rounded-xl shadow-2xl flex items-center justify-center mb-3 transform perspective-1000 rotate-y-180">
                        <span className="text-sm font-bold text-white">BACK</span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-white">NEXT STEP</p>
                  </div>
                </div>
              </div>
          </div>

          {/* Premium Continue Button */}
          <button
            onClick={() => {
              setAnimatingStep(true);
              setTimeout(() => {
                setStep('back');
                setAnimatingStep(false);
              }, 300);
            }}
            className="w-full relative group"
          >
            <div className="relative bg-gray-900 dark:bg-gray-800 rounded-2xl p-[2px] shadow-2xl">
              <div className="bg-gray-900 dark:bg-gray-800 rounded-2xl py-5 px-8 flex items-center justify-center space-x-3 group-hover:from-gray-800 group-hover:to-gray-700 transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white font-black text-lg uppercase tracking-wider">Capture Back Side</span>
                <svg className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Premium Progress Indicator */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded-full shadow-lg"></div>
              <div className="w-16 h-1 bg-green-600 rounded-full"></div>
            </div>
            <div className="bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-black shadow-xl">
              50% COMPLETE
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-16 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {step === 'back' && (
        <div className={`transition-all duration-300 ${animatingStep ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          {/* Premium Header with Gradient Background */}
          <div className="text-center mb-8 relative">
            <h2 className="text-3xl font-black text-gray-900 dark:text-gray-200 mb-2 relative">
              CARD BACK
            </h2>
            <p className="text-gray-700 dark:text-gray-300 font-medium relative">Complete Your Authentication</p>
          </div>

          {/* Scanner Card */}
          <div className="relative mb-8">
            <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700/40">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-1 h-8 bg-primary-600 dark:bg-primary-500 rounded-full"></div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-gray-200 uppercase tracking-wider">Final Capture</h3>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg text-xs font-medium">
                      <span>Final Step</span>
                    </div>
                  </div>
                  
                  {/* Scanner */}
                  <div>
                    <CardScanner
                      onImageCaptured={handleBackImageCaptured}
                      onError={setError}
                      captureMode="back"
                    />
                  </div>
                </div>

                {/* Back-Specific Guidelines */}
                <div className="border-t-2 border-gray-100 dark:border-slate-700/40 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-black text-gray-900 dark:text-gray-200 uppercase tracking-wider">Back Requirements</h4>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Important
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-200">All Text Visible</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Show full details</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-200">Show Barcode</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">If applicable</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-200">Include Stats</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Full card info</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-xl">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-200">Authenticity</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Security features</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Badge */}
          <div className="text-center relative">
            <div className="inline-flex items-center space-x-4 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg border border-gray-200 dark:border-slate-600/40">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-bold">FRONT COMPLETE</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white rounded-full animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Capturing Back</span>
              </div>
            </div>
          </div>

          {/* Progress Badge */}
          <div className="text-center relative">
            <div className="inline-flex items-center space-x-4 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg border border-gray-200 dark:border-slate-600/40">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-bold">FRONT COMPLETE</span>
              </div>
              <div className="w-px h-4 bg-gray-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white rounded-full animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Capturing Back</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'confirm' && frontImage && backImage && (
        <div className={`transition-all duration-300 ${animatingStep ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-slate-700/50 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg text-sm font-medium mb-4">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Photos Complete</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2">Final Review</h2>
            <p className="text-gray-600 dark:text-gray-400">Verify your submission details</p>
          </div>

          {/* Photo Review Card */}
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700/40 mb-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Front Photo Card */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative">
                      <div className="mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-6 bg-primary-600 dark:bg-primary-500 rounded-full"></div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-200">Front Side</h3>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="aspect-[3/4] bg-gray-100 dark:bg-slate-700/50 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600/40">
                          <img 
                            src={frontImage} 
                            alt="Front of card" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={handleRetakeFront}
                          className="absolute bottom-2 right-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-600/40 flex items-center space-x-1 hover:bg-gray-50 dark:hover:bg-slate-700/70 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Retake</span>
                        </button>
                      </div>
                      {/* Quality indicator */}
                      <div className="mt-3 flex items-center justify-between px-1">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Image Quality</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back Photo Card */}
                  <div>
                      <div className="mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-6 bg-primary-600 dark:bg-primary-500 rounded-full"></div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-200">Back Side</h3>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="aspect-[3/4] bg-gray-100 dark:bg-slate-700/50 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600/40">
                          <img 
                            src={backImage} 
                            alt="Back of card" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={handleRetakeBack}
                          className="absolute bottom-2 right-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-600/40 flex items-center space-x-1 hover:bg-gray-50 dark:hover:bg-slate-700/70 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Retake</span>
                        </button>
                      </div>
                      {/* Quality indicator */}
                      <div className="mt-3 flex items-center justify-between px-1">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Image Quality</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Quality Checklist */}
                <div className="mt-8 bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-600/40">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-200 text-base">Quality Check</h4>
                            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">Confirm before AI grading</p>
                          </div>
                        </div>
                        {allQualityChecksPassed && (
                          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-slate-600/50 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg text-xs font-medium">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Ready</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <label className="flex items-start space-x-3 cursor-pointer group">
                          <div className="relative mt-0.5">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={qualityChecks.edgesVisible}
                              onChange={(e) => setQualityChecks(prev => ({ ...prev, edgesVisible: e.target.checked }))}
                            />
                            <div className={`w-6 h-6 rounded-lg border-2 transition-all ${
                              qualityChecks.edgesVisible 
                                ? 'bg-green-600 border-green-600' 
                                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 group-hover:border-gray-400 dark:group-hover:border-slate-500'
                            }`}>
                              {qualityChecks.edgesVisible && (
                                <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 dark:text-gray-200 text-sm">Card Edges Visible</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">All four edges clearly shown in frame</p>
                          </div>
                        </label>
                        
                        <label className="flex items-start space-x-3 cursor-pointer group">
                          <div className="relative mt-0.5">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={qualityChecks.noGlare}
                              onChange={(e) => setQualityChecks(prev => ({ ...prev, noGlare: e.target.checked }))}
                            />
                            <div className={`w-6 h-6 rounded-lg border-2 transition-all ${
                              qualityChecks.noGlare 
                                ? 'bg-green-600 border-green-600' 
                                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 group-hover:border-gray-400 dark:group-hover:border-slate-500'
                            }`}>
                              {qualityChecks.noGlare && (
                                <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 dark:text-gray-200 text-sm">No Glare Present</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Free from reflections and hot spots</p>
                          </div>
                        </label>
                        
                        <label className="flex items-start space-x-3 cursor-pointer group">
                          <div className="relative mt-0.5">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={qualityChecks.sharpDetails}
                              onChange={(e) => setQualityChecks(prev => ({ ...prev, sharpDetails: e.target.checked }))}
                            />
                            <div className={`w-6 h-6 rounded-lg border-2 transition-all ${
                              qualityChecks.sharpDetails 
                                ? 'bg-green-600 border-green-600' 
                                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 group-hover:border-gray-400 dark:group-hover:border-slate-500'
                            }`}>
                              {qualityChecks.sharpDetails && (
                                <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 dark:text-gray-200 text-sm">Sharp & Clear Details</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Text and features are in perfect focus</p>
                          </div>
                        </label>
                      </div>
                      
                      {!allQualityChecksPassed && (
                        <div className="mt-4 flex items-start space-x-2 bg-amber-100 dark:bg-amber-900/20 rounded-xl p-3">
                          <svg className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-300">All checks required for accurate AI grading</p>
                        </div>
                      )}
                </div>
          
          {/* Submit Button */}
          <button
            onClick={handleImagesConfirmed}
            disabled={!allQualityChecksPassed || isLoading}
            className={`w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center space-x-3 ${!allQualityChecksPassed || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Submit for Grading</span>
              </>
            )}
          </button>

          {/* Processing Information */}
          <div className="mt-8 bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-6 border border-gray-200 dark:border-slate-600/40">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-200 mb-4">Processing Steps</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-200">Card Recognition</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">AI identification system</p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">~15s</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-200">Condition Analysis</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">4-point inspection</p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">~30s</div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-200">Market Valuation</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Real-time pricing</p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">~15s</div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-600/40">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Processing Time</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">~60 seconds</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'service' && selectedCard && (
        <div>
          {/* Professional Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Service</h2>
            <p className="text-gray-600">Choose your preferred authentication partner</p>
          </div>

          {/* Selected Card Display */}
          <div className="bg-gray-50 dark:bg-slate-800/70 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-slate-700/40">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-28 bg-white dark:bg-slate-700/50 rounded-lg shadow-sm flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 dark:text-gray-200">{selectedCard.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCard.setName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {selectedCard.number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Verified</p>
                <svg className="w-5 h-5 text-green-600 ml-auto mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-3">
            {Object.entries(GRADING_SERVICE_NAMES).map(([key, name]) => (
              <button
                key={key}
                onClick={() => handleServiceSelect(key as GradingService)}
                className="w-full bg-white dark:bg-slate-800/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all text-left group border border-gray-100 dark:border-slate-700/40 hover:border-gray-200 dark:hover:border-slate-600/60"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-slate-600/50 transition-colors">
                      <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-200 text-lg">{name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">Professional Authentication Service</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Est. 5-7 days</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">• Insured shipping</span>
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* Service Features */}
          <div className="mt-6 bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-xs text-gray-600 dark:text-gray-300">Authenticated</p>
              </div>
              <div>
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-xs text-gray-600 dark:text-gray-300">Encapsulated</p>
              </div>
              <div>
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-gray-600 dark:text-gray-300">Tracked</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'photos' && (
        <div>
          {/* Professional Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Documentation</h2>
            <p className="text-gray-600">Capture professional-grade images for authentication</p>
          </div>

          {/* Photo Capture Section */}
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-slate-700/40">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-200">Professional Photography</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Capture required angles for complete assessment</p>
            </div>

            {/* Requirements Grid */}
            <div className="border-t border-gray-100 dark:border-slate-700/40 pt-6 mb-6">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-200 mb-4">Documentation Standards</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h5 className="font-semibold text-gray-900 dark:text-gray-200">Front View</h5>
                  </div>
                  <ul className="space-y-1.5">
                    <li className="flex items-start">
                      <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Full card visible</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Sharp focus</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Natural lighting</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <h5 className="font-semibold text-gray-900 dark:text-gray-200">Back View</h5>
                  </div>
                  <ul className="space-y-1.5">
                    <li className="flex items-start">
                      <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Complete surface</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-300">No reflections</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-300">Flat positioning</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              fullWidth
              onClick={() => setStep('front')}
              loading={isLoading}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Begin Documentation</span>
              </div>
            </Button>
          </div>

          {/* Quality Assurance */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4">
            <div className="flex items-center justify-center space-x-3">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-xs text-gray-600 dark:text-gray-300">Images verified before submission</p>
            </div>
          </div>
        </div>
      )}

      {step === 'bulk-review' && selectedCard && gradingService && frontImage && backImage && (
        <div>
          {/* Professional Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-200 mb-2">Final Review</h2>
            <p className="text-gray-600 dark:text-gray-400">Confirm your submission details</p>
          </div>

          {/* Submission Summary */}
          <div className="bg-white dark:bg-slate-800/70 rounded-2xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-slate-700/40">
            {/* Card Information */}
            <div className="border-b border-gray-100 dark:border-slate-700/40 pb-4 mb-4">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Card Authentication</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 dark:text-gray-200">{selectedCard.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCard.setName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {selectedCard.number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Service</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-200">{GRADING_SERVICE_NAMES[gradingService]}</p>
                </div>
              </div>
            </div>

            {/* Documentation Review */}
            <div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Documentation</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Front Image</p>
                  <div className="relative aspect-[3/4] bg-gray-100 dark:bg-slate-700/50 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600/40">
                    <img src={frontImage} alt="Front" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Back Image</p>
                  <div className="relative aspect-[3/4] bg-gray-100 dark:bg-slate-700/50 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600/40">
                    <img src={backImage} alt="Back" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Processing</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">5-7 days</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Insurance</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">$5,000</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tracking</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Included</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              fullWidth
              onClick={handleSubmit}
              loading={isLoading}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Confirm Submission</span>
              </div>
            </Button>
            
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setStep('confirm')}
              className="bg-white dark:bg-slate-800/70 border-gray-200 dark:border-slate-600/40 hover:bg-gray-50 dark:hover:bg-slate-700/50"
            >
              <span className="text-gray-700 dark:text-gray-300">Retake Photos</span>
            </Button>
          </div>

          {/* Terms Notice */}
          <p className="text-xs text-center text-gray-500 mt-6">
            By submitting, you agree to our grading terms and conditions
          </p>
        </div>
      )}
      </div>
      </div>

      {/* Grading Progress Step */}
      {step === 'grading' && (
        <div className="min-h-screen bg-transparent relative overflow-hidden">
          {/* Premium Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Animated gradient orbs */}
            <div className="absolute top-20 -left-20 w-96 h-96 bg-primary-500/10 dark:bg-primary-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute bottom-20 -right-20 w-96 h-96 bg-accent-500/10 dark:bg-accent-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.01]" style={{
              backgroundImage: `repeating-linear-gradient(0deg, #000 0px, transparent 1px, transparent 40px, #000 41px),
                               repeating-linear-gradient(90deg, #000 0px, transparent 1px, transparent 40px, #000 41px)`
            }}></div>
          </div>
          
          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
            <div className="w-full max-w-sm space-y-8">
            {gradingError ? (
              <>
                {/* Error Icon with Animation */}
                <div className="flex justify-center animate-scale-in">
                  <div className="relative">
                    {/* Glowing Ring Effect */}
                    <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping animation-delay-200"></div>
                    
                    {/* Main Error Container */}
                    <div className="relative w-32 h-32 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-full flex items-center justify-center shadow-xl border-4 border-red-200 dark:border-red-800">
                      <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                        <svg className="w-12 h-12 text-red-500 animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Content */}
                <div className="text-center space-y-4 animate-fade-in animation-delay-300">
                  {/* Title with gradient */}
                  <h3 className="text-2xl font-bold">
                    <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                      Unable to Complete Grading
                    </span>
                  </h3>
                  
                  {/* Error Message Container */}
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
                    <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                      {gradingError}
                    </p>
                  </div>

                  {/* Additional Help Text */}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Don't worry, your images are saved. You can try again or start over.
                  </p>
                </div>

                {/* Action Buttons with better styling */}
                <div className="space-y-3 w-full animate-fade-in animation-delay-500">
                  <button
                    onClick={() => {
                      setAnimatingStep(true);
                      setTimeout(() => {
                        resetGrading();
                        setStep('confirm');
                        setAnimatingStep(false);
                      }, 300);
                    }}
                    className="w-full relative overflow-hidden group rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 transition-transform group-hover:scale-105"></div>
                    <div className="relative px-6 py-4 flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-white font-semibold">Try Again</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setAnimatingStep(true);
                      setTimeout(() => {
                        resetGrading();
                        setStep('front');
                        setFrontImage(null);
                        setBackImage(null);
                        setAnimatingStep(false);
                      }, 300);
                    }}
                    className="w-full px-6 py-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl font-semibold text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 group"
                  >
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Start Over</span>
                  </button>

                  {/* Contact Support Link */}
                  <div className="text-center pt-2">
                    <a href="#" className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors">
                      Need help? Contact support
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Premium AI Processing Animation */}
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Outer glow rings */}
                    <div className="absolute inset-0 -m-8">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500/20 to-accent-500/20 animate-pulse blur-xl"></div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500/10 to-accent-500/10 animate-pulse blur-2xl" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                    
                    {/* Main card display */}
                    <div className="relative w-40 h-56">
                      {/* Card placeholder with premium effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-2xl shadow-2xl transform rotate-3 transition-transform duration-1000 animate-pulse">
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 rounded-2xl"></div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-600 dark:to-slate-700 rounded-2xl shadow-2xl transform -rotate-3 transition-transform duration-1000 animate-pulse" style={{ animationDelay: '0.3s' }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10 rounded-2xl"></div>
                      </div>
                      
                      {/* Scanning line effect */}
                      <div className="absolute inset-0 overflow-hidden rounded-2xl">
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary-400 to-transparent animate-scan"></div>
                      </div>
                      
                      {/* Center AI badge */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-black/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-primary-500/50 shadow-lg">
                          <div className="text-xs font-black text-primary-400 animate-pulse">AI</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Orbiting elements */}
                    <div className="absolute inset-0 -m-16">
                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary-400 rounded-full shadow-lg shadow-primary-400/50"></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent-400 rounded-full shadow-lg shadow-accent-400/50"></div>
                      </div>
                      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }}>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-400 rounded-full shadow-lg shadow-green-400/50"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Status Text */}
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-black tracking-tight">
                    <span className="bg-gradient-to-r from-primary-600 to-accent-600 dark:from-primary-400 dark:to-accent-400 bg-clip-text text-transparent">AI GRADING</span>
                    <span className="block text-lg font-medium text-gray-700 dark:text-gray-300 mt-2 tracking-widest">IN PROGRESS</span>
                  </h3>
                  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-200/50 dark:border-slate-700/30 shadow-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 min-h-[20px] transition-all duration-300">
                      {gradingStatus || 'Initializing authentication protocol...'}
                    </p>
                  </div>
                </div>

                {/* Premium Progress Bar */}
                <div className="relative bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/30 shadow-lg">
                  <div className="relative mb-4">
                    <div className="h-4 bg-gray-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-700 ease-out relative shadow-lg"
                        style={{ width: `${Math.round(gradingProgress)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                        <div className="absolute inset-0 shimmer"></div>
                      </div>
                    </div>
                    {/* Progress indicator dot */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-8 h-8 transition-all duration-700 ease-out"
                      style={{ left: `calc(${Math.round(gradingProgress)}% - 16px)` }}
                    >
                      <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-lg border-2 border-primary-500 flex items-center justify-center">
                        <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Authentication Progress</span>
                    <span className="text-sm font-black text-gray-900 dark:text-gray-100">{Math.round(gradingProgress)}%</span>
                  </div>
                </div>

            {/* Premium Processing Steps */}
            <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/30 shadow-lg space-y-4">
              <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-4">Authentication Phases</h4>
              {[
                { label: 'Surface Analysis', icon: '🔍', complete: gradingProgress > 20 },
                { label: 'Edge Detection', icon: '📐', complete: gradingProgress > 40 },
                { label: 'Corner Assessment', icon: '⚡', complete: gradingProgress > 60 },
                { label: 'Centering Validation', icon: '🎯', complete: gradingProgress > 80 },
                { label: 'Grade Certification', icon: '🏆', complete: gradingProgress === 100 }
              ].map((step, index) => (
                <div key={index} className="relative">
                  <div className={`flex items-center space-x-4 transition-all duration-500 ${
                    step.complete ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-60'
                  }`}>
                    {/* Step indicator */}
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-md ${
                        step.complete 
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 scale-110' 
                          : 'bg-gray-200 dark:bg-slate-700 scale-100'
                      }`}>
                        {step.complete ? (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-lg opacity-50">{step.icon}</span>
                        )}
                      </div>
                      {step.complete && (
                        <div className="absolute inset-0 rounded-xl bg-primary-400 animate-ping opacity-30"></div>
                      )}
                    </div>
                    
                    {/* Step label */}
                    <div className="flex-1">
                      <span className={`text-sm font-semibold transition-all duration-300 ${
                        step.complete 
                          ? 'text-gray-900 dark:text-gray-100' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                      {step.complete && (
                        <div className="h-0.5 bg-gradient-to-r from-primary-500 to-transparent mt-1 animate-expand-width"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

                {/* Premium Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-slate-700/30">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">EST. TIME</p>
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100 text-center">30-60s</p>
                  </div>
                  
                  <div className="bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-slate-700/30">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">ACCURACY</p>
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100 text-center">99.8%</p>
                  </div>
                </div>
                
                {/* Premium footer text */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Powered by TCGrader Advanced AI Authentication
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                    <span>🔒 Secure</span>
                    <span>•</span>
                    <span>⚡ Fast</span>
                    <span>•</span>
                    <span>🎯 Accurate</span>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      )}

      {/* AI Results Step */}
      {step === 'result' && result && (
        <div className="min-h-screen bg-white dark:bg-slate-900">
          <div className="space-y-6 safe-area-bottom">
            {/* Card Images - Overlapping Display */}
            {result.images && (result.images.frontUrl || result.images.backUrl) && (
              <div className="w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-slate-900 py-8">
                <div className="relative h-[400px] max-w-md mx-auto">
                  {/* Back Image (initially behind) */}
                  {result.images.backUrl && (
                    <div 
                      className={`absolute transition-all duration-500 ease-in-out cursor-pointer ${
                        frontImageInFront 
                          ? 'left-[55%] -translate-x-1/2 z-10 scale-95 opacity-90' 
                          : 'left-[45%] -translate-x-1/2 z-20 scale-100 opacity-100'
                      }`}
                      onClick={() => {
                        if (frontImageInFront) {
                          // If back is behind, bring it to front
                          setFrontImageInFront(false);
                        } else {
                          // If back is in front, open viewer
                          openImageViewer(result.images.backUrl);
                        }
                      }}
                    >
                      <div className={`relative w-[280px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${
                        !frontImageInFront 
                          ? 'ring-4 ring-primary-500/50 transform hover:scale-[1.02]' 
                          : 'ring-2 ring-gray-300/50 hover:ring-4 hover:ring-primary-400/50'
                      }`}>
                        <img
                          src={result.images.backUrl}
                          alt="Card Back"
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${
                          !frontImageInFront ? 'opacity-0 hover:opacity-100' : 'opacity-20'
                        }`} />
                        <div className="absolute bottom-3 left-3 text-sm font-semibold text-white bg-black/70 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          Back Side
                        </div>
                        {!frontImageInFront && (
                          <div className="absolute top-3 right-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </div>
                        )}
                        {frontImageInFront && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/30">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Front Image (initially in front) */}
                  {result.images.frontUrl && (
                    <div 
                      className={`absolute transition-all duration-500 ease-in-out cursor-pointer ${
                        frontImageInFront 
                          ? 'left-[45%] -translate-x-1/2 z-20 scale-100 opacity-100' 
                          : 'left-[55%] -translate-x-1/2 z-10 scale-95 opacity-90'
                      }`}
                      onClick={() => {
                        if (!frontImageInFront) {
                          // If front is behind, bring it to front
                          setFrontImageInFront(true);
                        } else {
                          // If front is in front, open viewer
                          openImageViewer(result.images.frontUrl);
                        }
                      }}
                    >
                      <div className={`relative w-[280px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${
                        frontImageInFront 
                          ? 'ring-4 ring-primary-500/50 transform hover:scale-[1.02]' 
                          : 'ring-2 ring-gray-300/50 hover:ring-4 hover:ring-primary-400/50'
                      }`}>
                        <img
                          src={result.images.frontUrl}
                          alt="Card Front"
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${
                          frontImageInFront ? 'opacity-0 hover:opacity-100' : 'opacity-20'
                        }`} />
                        <div className="absolute bottom-3 left-3 text-sm font-semibold text-white bg-black/70 px-3 py-1.5 rounded-full backdrop-blur-sm">
                          Front Side
                        </div>
                        {frontImageInFront && (
                          <div className="absolute top-3 right-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </div>
                        )}
                        {!frontImageInFront && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/30">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Instructions */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Click background card to flip • Click foreground card to view full screen
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Grading Results */}
            <div className="p-6 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700/40">
                {/* Overall Grade */}
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Grading Result</h2>
                  <div className="inline-flex flex-col items-center justify-center gap-1 animate-scale-in">
                    <span className={`text-6xl font-bold bg-gradient-to-br ${result.combined.overall >= 9 ? 'from-emerald-400 to-emerald-600' : result.combined.overall >= 7 ? 'from-yellow-400 to-yellow-600' : 'from-red-400 to-red-600'} bg-clip-text text-transparent`}>
                      {result.combined.overall}
                    </span>
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      {result.combined.overall >= 9 ? 'Near Mint' : result.combined.overall >= 7 ? 'Good' : 'Poor'}
                    </span>
                  </div>
                </div>

                {/* Card Information */}
                {result.cardInfo && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Card Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{result.cardInfo.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Set</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{result.cardInfo.set}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Number</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{result.cardInfo.number}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Year</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{result.cardInfo.year}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Type</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{result.cardInfo.type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Model</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{result.tcgmodel}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {result.combined.summary && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis Summary</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{result.combined.summary}</p>
                  </div>
                )}

                {/* Detailed Scores */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">Corners</h4>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.front.grades.corners.grade}</div>
                    <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                        style={{ width: `${result.front.grades.corners.grade * 10}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">Edges</h4>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.front.grades.edges.grade}</div>
                    <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-1000 ease-out"
                        style={{ width: `${result.front.grades.edges.grade * 10}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">Surface</h4>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.front.grades.surface.grade}</div>
                    <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-1000 ease-out"
                        style={{ width: `${result.front.grades.surface.grade * 10}%` }}
                      />
                    </div>
                  </div>
                  {result.front.grades.holographic && (
                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">Holographic</h4>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.front.grades.holographic.grade}</div>
                      <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 transition-all duration-1000 ease-out"
                          style={{ width: `${result.front.grades.holographic.grade * 10}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Front Side Analysis */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Front Side Analysis</h4>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.front.grades.overall.grade}/10</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{result.front.grades.overall.description}</p>
                    
                  <div className="space-y-3">
                    {[
                      { label: 'Corners', grade: result.front.grades.corners.grade, description: result.front.grades.corners.description, icon: 'corners' },
                      { label: 'Edges', grade: result.front.grades.edges.grade, description: result.front.grades.edges.description, icon: 'edges' },
                      { label: 'Surface', grade: result.front.grades.surface.grade, description: result.front.grades.surface.description, icon: 'surface' },
                      ...(result.front.grades.holographic ? [{ label: 'Holographic', grade: result.front.grades.holographic.grade, description: result.front.grades.holographic.description, icon: 'holographic' }] : [])
                    ].map((subgrade) => (
                      <div key={subgrade.label} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {subgrade.icon === 'corners' && <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                            {subgrade.icon === 'edges' && <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
                            {subgrade.icon === 'surface' && <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            {subgrade.icon === 'holographic' && <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                          </div>
                          <div className="flex-1">
                            <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">{subgrade.label}</h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{subgrade.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{subgrade.grade}</span>
                            <span className="text-xs text-gray-500">/10</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Back Side Analysis */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Back Side Analysis</h4>
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.back.grades.overall.grade}/10</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{result.back.grades.overall.description}</p>
                  
                  <div className="space-y-3">
                    {[
                      { label: 'Corners', grade: result.back.grades.corners.grade, description: result.back.grades.corners.description, icon: 'corners' },
                      { label: 'Edges', grade: result.back.grades.edges.grade, description: result.back.grades.edges.description, icon: 'edges' },
                      { label: 'Surface', grade: result.back.grades.surface.grade, description: result.back.grades.surface.description, icon: 'surface' },
                      ...(result.back.grades.holographic ? [{ label: 'Holographic', grade: result.back.grades.holographic.grade, description: result.back.grades.holographic.description, icon: 'holographic' }] : [])
                    ].map((subgrade) => (
                      <div key={subgrade.label} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {subgrade.icon === 'corners' && <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
                            {subgrade.icon === 'edges' && <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
                            {subgrade.icon === 'surface' && <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            {subgrade.icon === 'holographic' && <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                          </div>
                          <div className="flex-1">
                            <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">{subgrade.label}</h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{subgrade.description}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{subgrade.grade}</span>
                            <span className="text-xs text-gray-500">/10</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certificate badge */}
                <div className="mt-8 text-center">
                  <div className="inline-block">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 bg-gray-100 dark:bg-gray-800/30">
                      <svg className="w-4 h-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                      </svg>
                      <span>Grade verified by <span className="font-semibold">Advanced AI Analysis</span></span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-6">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigate('/collection')}
                    className="shadow-lg"
                  >
                    Add to Collection
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      resetGrading();
                      setStep('mode-select');
                      setGradingMode(null);
                      setFrontImage(null);
                      setBackImage(null);
                      setQualityChecks({
                        edgesVisible: false,
                        noGlare: false,
                        sharpDetails: false
                      });
                    }}
                  >
                    Grade Another Card
                  </Button>
                </div>

                {/* Disclaimer */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
                  This is an AI-generated grade estimate. For official grading, please submit to a professional grading service.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Grade Introduction with Grid Background */}
      {step === 'bulk-intro' && (
        <div className="fixed inset-0 z-50">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-gray-100 dark:bg-slate-900 p-4 overflow-auto">
            <div className="grid grid-cols-2 gap-4">
              {/* Render all grid slots */}
              {Array.from({ length: 20 }).map((_, index) => {
                const card = bulkPhotos[index];
                const isActiveSlot = index === bulkPhotos.length;
                
                // Debug: Add data attribute to track position
                const dataAttrs = {
                  'data-grid-index': index,
                  'data-is-active': isActiveSlot,
                  'data-has-card': !!card
                };
                
                if (card) {
                  // Filled slot with card
                  return (
                    <div
                      key={`slot-${index}`}
                      {...dataAttrs}
                      className="aspect-[3/4] bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden relative"
                      style={{
                        opacity: 1,
                        transform: 'scale(1)',
                      }}
                    >
                      {/* Front and Back Images */}
                      <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
                        <img src={card.front} alt="Front" className="w-full h-full object-cover" />
                        <img src={card.back} alt="Back" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <span className="text-white text-xs font-bold">Card #{index + 1}</span>
                      </div>
                    </div>
                  );
                } else if (isActiveSlot) {
                  // Active slot (currently being scanned)
                  return (
                    <div
                      key={`slot-${index}`}
                      {...dataAttrs}
                      id={`bulk-grid-slot-${index}`}
                      className={`aspect-[3/4] bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 bulk-grid-item-active border-primary-400 dark:border-primary-500 transition-all duration-300`}
                      style={{
                        opacity: 0.5,
                        transform: 'scale(0.95)',
                        position: 'relative',
                        zIndex: 10
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{index + 1}</span>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Ready</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Empty slot
                  return (
                    <div
                      key={`slot-${index}`}
                      {...dataAttrs}
                      id={`bulk-grid-slot-${index}`}
                      className="aspect-[3/4] bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-slate-700"
                      style={{
                        opacity: 0.3,
                        transform: 'scale(0.95)',
                      }}
                    />
                  );
                }
              })}
            </div>
          </div>

          {/* Modal Overlay */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center animate-fade-in px-4 transition-all duration-800 z-50" id="bulk-intro-modal-container">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all duration-800" id="bulk-intro-modal">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>

              {/* Message */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Ready to scan cards?
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  We'll guide you through each step
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={() => {
                    // Animate modal fade out with dramatic effect
                    const modalContainer = document.getElementById('bulk-intro-modal-container');
                    const modal = document.getElementById('bulk-intro-modal');
                    
                    if (modalContainer && modal) {
                      // Fade out the modal
                      modalContainer.style.opacity = '0';
                      modal.style.transform = 'scale(0.85)';
                      modal.style.opacity = '0';
                      
                      // Hide modal completely after fade
                      setTimeout(() => {
                        modalContainer.style.display = 'none';
                      }, 300);
                    }
                    
                    // After modal starts fading, handle grid animation
                    setTimeout(() => {
                      const activeSlotIndex = bulkPhotos.length;
                      const activeGridItem = document.getElementById(`bulk-grid-slot-${activeSlotIndex}`);
                      const gridContainer = document.getElementById('bulk-grid-container');
                      
                      console.log('Animation Debug:');
                      console.log('- Active slot index:', activeSlotIndex);
                      console.log('- Active grid item found:', !!activeGridItem);
                      console.log('- Grid container found:', !!gridContainer);
                      console.log('- Bulk photos length:', bulkPhotos.length);
                      console.log('- DOM element:', activeGridItem);
                      
                      if (activeGridItem) {
                        console.log('Starting animation for grid item');
                        
                        // First, scroll to the grid item if it's not in view
                        const rect = activeGridItem.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        const isInView = rect.top >= 0 && rect.bottom <= viewportHeight;
                        
                        console.log('Grid item visibility check:');
                        console.log('- Item top:', rect.top);
                        console.log('- Item bottom:', rect.bottom);
                        console.log('- Viewport height:', viewportHeight);
                        console.log('- Is in view:', isInView);
                        
                        if (!isInView) {
                          console.log('Scrolling to grid item');
                          // Scroll the grid item into view with smooth animation
                          activeGridItem.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'center'
                          });
                          
                          // Wait for scroll to complete (slower)
                          setTimeout(() => {
                            console.log('Scroll complete, starting poke animation');
                            startPokeAndZoomAnimation();
                          }, 1200);
                        } else {
                          console.log('Grid item already in view, starting animation immediately');
                          startPokeAndZoomAnimation();
                        }
                        
                        function startPokeAndZoomAnimation() {
                          // Add poke effect
                          console.log('Adding poked class');
                          activeGridItem.classList.add('poked');
                          // Force reflow to ensure animation starts
                          activeGridItem.offsetHeight;
                          
                          // After wiggle/bounce effect completes, create overlay and expand
                          setTimeout(() => {
                            console.log('Creating expanding overlay');
                            
                            // Get the grid item's current position and size (after potential scroll)
                            const currentRect = activeGridItem.getBoundingClientRect();
                            console.log('Grid item rect:', currentRect);
                            
                            // Create an overlay div that will expand
                            const overlay = document.createElement('div');
                            overlay.className = 'fixed rounded-xl bg-primary-900';
                            overlay.style.left = `${currentRect.left}px`;
                            overlay.style.top = `${currentRect.top}px`;
                            overlay.style.width = `${currentRect.width}px`;
                            overlay.style.height = `${currentRect.height}px`;
                            overlay.style.zIndex = '9999';
                            overlay.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
                            document.body.appendChild(overlay);
                            
                            // Force reflow
                            overlay.offsetHeight;
                            
                            // Expand to fullscreen
                            requestAnimationFrame(() => {
                              console.log('Expanding overlay to fullscreen');
                              overlay.style.left = '0';
                              overlay.style.top = '0';
                              overlay.style.width = '100vw';
                              overlay.style.height = '100vh';
                              overlay.style.borderRadius = '0';
                            });
                            
                            // Transition to capture after expansion
                            setTimeout(() => {
                              console.log('Transitioning to bulk-capture');
                              setStep('bulk-capture');
                              // Remove overlay after transition
                              setTimeout(() => {
                                overlay.remove();
                              }, 100);
                            }, 1000);
                          }, 1200);
                        }
                      } else {
                        console.log('ERROR: Animation elements not found!');
                        console.log('- Available elements on page:');
                        const allElements = document.querySelectorAll('[id*="bulk-grid-slot"]');
                        allElements.forEach(el => console.log('  Found element:', el.id));
                      }
                    }, 100);
                }}
                className="shadow-lg"
              >
                <span className="font-bold">Let's Start</span>
              </Button>
              
              {bulkPhotos.length > 0 && (
                <Button
                  variant="secondary"
                  fullWidth
                  size="lg"
                  onClick={() => {
                    setStep('bulk-review');
                  }}
                >
                  Review and Grade ({bulkPhotos.length} cards)
                </Button>
              )}

              {/* Cancel button */}
              <button
                onClick={() => {
                  setGradingMode(null);
                  setStep('mode-select');
                }}
                className="w-full text-center text-gray-600 dark:text-gray-400 text-sm hover:underline mt-4"
              >
                Cancel
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Bulk Capture Screen with Grid */}
      {step === 'bulk-capture' && (
        <div className="fixed inset-0 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 z-50">
          {/* Grid Background */}
          <div className="absolute inset-0 p-4 overflow-y-auto" id="bulk-grid-container">
            <div className="grid grid-cols-2 gap-4 pb-20">
              {/* Render all grid slots */}
              {Array.from({ length: 20 }).map((_, index) => {
                const card = bulkPhotos[index];
                const isActiveSlot = index === bulkPhotos.length;
                
                // Debug: Add data attribute to track position
                const dataAttrs = {
                  'data-grid-index': index,
                  'data-is-active': isActiveSlot,
                  'data-has-card': !!card
                };
                
                if (card) {
                  // Filled slot with card
                  return (
                    <div
                      key={`slot-${index}`}
                      {...dataAttrs}
                      className="aspect-[3/4] bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden grid-item-filled relative"
                    >
                      {/* Front and Back Images */}
                      <div className="absolute inset-0 grid grid-cols-2 gap-0.5">
                        <img src={card.front} alt="Front" className="w-full h-full object-cover" />
                        <img src={card.back} alt="Back" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <span className="text-white font-bold text-xs">Card #{index + 1}</span>
                      </div>
                    </div>
                  );
                } else if (isActiveSlot) {
                  // Active slot (currently being scanned)
                  return (
                    <div
                      key={`slot-${index}`}
                      {...dataAttrs}
                      className="aspect-[3/4] bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-dashed border-primary-500 animate-pulse relative"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-12 h-12 text-primary-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm text-primary-600 dark:text-primary-400 font-medium">Scanning...</span>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Empty slot
                  return (
                    <div
                      key={`slot-${index}`}
                      {...dataAttrs}
                      id={`bulk-grid-slot-${index}`}
                      className="aspect-[3/4] bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-slate-700"
                      style={{
                        opacity: 0.3,
                        transform: 'scale(0.95)',
                      }}
                    />
                  );
                }
              })}
            </div>
          </div>

          {/* Camera Overlay */}
          <div className={`fixed inset-0 z-10 transition-all duration-300 ${
            showGrid ? 'bg-gradient-to-br from-primary-900/95 to-primary-800/95' : 'bg-primary-900'
          }`}>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-primary-900/80 to-transparent p-4 safe-area-top">
              <div className="flex items-center justify-between">
                {/* Exit Button */}
                <button
                  onClick={() => {
                    if (bulkPhotos.length > 0) {
                      setShowExitConfirmModal(true);
                    } else {
                      setStep('mode-select');
                    }
                  }}
                  className="p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Middle Controls */}
                <div className="flex items-center space-x-3">
                  {/* Card Counter */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="text-white font-bold">{bulkPhotos.length} cards</span>
                  </div>

                  {/* Review Button */}
                  {bulkPhotos.length > 0 && (
                    <button
                      onClick={() => setStep('bulk-review')}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all font-medium"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Scanner Area */}
            <div className="absolute inset-0">
              <CardScanner
                ref={bulkScannerRef}
                onImageCaptured={(imageData) => {
                  // Show photo editor for both front and back
                  setTempBulkImage(imageData);
                  setEditingBulkStep(bulkStep);
                  setShowBulkPhotoEditor(true);
                }}
                onError={setError}
                captureMode={bulkStep}
                hideButtons={true}
              />
            </div>
          </div>

          {/* Bottom UI */}
          <div className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-primary-900/80 to-transparent p-6 pb-8 safe-area-bottom ${showBulkCaptureUI ? 'animate-fade-in' : 'opacity-0'}`}>
            {/* Current Step Indicator */}
            <div className="text-center mb-6">
              {showCardComplete ? (
                <>
                  <div className="mb-3">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Great! {bulkPhotos.length} {bulkPhotos.length === 1 ? 'card' : 'cards'} added</h3>
                  <p className="text-white/70 text-sm">Ready to scan another?</p>
                </>
              ) : bulkStep === 'back' ? (
                <>
                  {/* Step Indicator */}
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="w-12 h-1 bg-white/30 rounded-full" />
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-primary-900 font-bold text-sm">2</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Scan Back</h3>
                  <p className="text-white/90 text-sm">Turn your card over to capture the back</p>
                </>
              ) : (
                <>
                  {/* Step Indicator */}
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-primary-900 font-bold text-sm">1</span>
                    </div>
                    <div className="w-12 h-1 bg-white/30 rounded-full" />
                    <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                      <span className="text-white/70 font-bold text-sm">2</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Scan Front</h3>
                  <p className="text-white/90 text-sm">Place the front of your card</p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Main Capture Button */}
              <button
                onClick={async () => {
                  // Trigger camera capture programmatically
                  if (bulkScannerRef.current) {
                    await bulkScannerRef.current.capturePhoto();
                  }
                }}
                className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white text-primary-900 rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-lg">
                  {showCardComplete ? 'Capture Another' : (bulkStep === 'front' ? 'Capture Front' : 'Capture Back')}
                </span>
              </button>

            </div>

            {/* Recent Cards Strip */}
            {bulkPhotos.length > 0 && (
              <div className="mt-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {bulkPhotos.slice(-5).reverse().map((card, index) => (
                    <div
                      key={card.id}
                      className="relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 border-white/20"
                      onClick={() => {
                        // Add functionality to view/edit this card
                      }}
                    >
                      <img src={card.front} alt={`Card ${bulkPhotos.length - index}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                        #{bulkPhotos.length - index}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Success Animation Overlay */}
          {showBulkSuccess && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div className="bg-green-500 text-white rounded-2xl px-6 py-4 shadow-2xl animate-scale-in">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-lg font-bold">Card Added!</p>
                    <p className="text-sm opacity-90">{bulkPhotos.length} cards scanned</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Front Card Success Animation */}
          {showFrontCardSuccess && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div className="bg-primary-600 text-white rounded-2xl px-6 py-4 shadow-2xl animate-scale-in">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-lg font-bold">Front Card Added!</p>
                    <p className="text-sm opacity-90">Now capture the back</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Simplified Bulk Review */}
      {step === 'bulk-review' && (
        <div className="-mt-32 pb-24 min-h-screen bg-gray-50 dark:bg-slate-900">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-20">
            <div className="px-4 py-4 flex items-center justify-between">
              <button
                onClick={() => setStep('bulk-capture')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-200">Review Cards</h1>
              <div className="w-9"></div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="p-4">
            <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
              {bulkPhotos.length} cards ready for grading
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {bulkPhotos.map((card, index) => (
                <div key={card.id} className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm">
                  <div className="aspect-[3/4] bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden mb-2">
                    <img src={card.front} alt={`Card ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-200">Card #{index + 1}</span>
                    <button
                      onClick={() => {
                        setBulkPhotos(bulkPhotos.filter(c => c.id !== card.id));
                        if (bulkPhotos.length === 1) {
                          setStep('bulk-capture');
                        }
                      }}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Submission Progress */}
            {isSubmittingBulk && (
              <div className="mb-6 bg-gray-100 dark:bg-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {bulkSubmissionStatus === 'creating' ? 'Creating queue...' : 'Submitting cards...'}
                  </span>
                  <svg className="animate-spin h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: bulkSubmissionStatus === 'creating' ? '50%' : '90%' }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleBulkSubmit}
                loading={isSubmittingBulk}
                disabled={bulkPhotos.length === 0 || isSubmittingBulk}
                className="shadow-lg"
              >
                {isSubmittingBulk ? 'Submitting...' : 'Submit All Cards'}
              </Button>
              
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setStep('bulk-capture')}
              >
                Add More Cards
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Submission Success Modal */}
      {bulkSubmissionStatus === 'success' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Submission Complete!
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {bulkPhotos.length} cards have been successfully submitted for grading.
            </p>
            
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
              Queue ID: {bulkQueueId}
            </p>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Redirecting to your grades...
            </div>
          </div>
        </div>
      )}

      {/* Bulk Preview Modal */}
      {showBulkPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200">
                  All Scanned Cards ({bulkPhotos.length})
                </h3>
                <button
                  onClick={() => setShowBulkPreview(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {bulkPhotos.map((card, index) => (
                  <div key={card.id} className="group relative">
                    <div className="aspect-[3/4] bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <img src={card.front} alt={`Card ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setBulkPhotos(bulkPhotos.filter(c => c.id !== card.id));
                          if (bulkPhotos.length === 1) {
                            setShowBulkPreview(false);
                          }
                        }}
                        className="bg-red-500 text-white p-1.5 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">Card #{index + 1}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-slate-700">
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowBulkPreview(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setShowBulkPreview(false);
                    setStep('bulk-review');
                  }}
                >
                  Continue to Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Editor Modal */}
      {showPhotoEditor && (tempFrontImage || tempBackImage) && (
        <PhotoEditor
          imageUrl={(editingPhoto === 'front' ? tempFrontImage : tempBackImage) || ''}
          onConfirm={handlePhotoEditorConfirm}
          onCancel={handlePhotoEditorCancel}
          title={editingPhoto === 'front' ? 'Edit Front Photo' : 'Edit Back Photo'}
        />
      )}

      {/* Bulk Photo Editor Modal */}
      {showBulkPhotoEditor && tempBulkImage && (
        <PhotoEditor
          imageUrl={tempBulkImage}
          onConfirm={handleBulkPhotoEditorConfirm}
          onCancel={handleBulkPhotoEditorCancel}
          title={editingBulkStep === 'front' ? 'Edit Front Photo' : 'Edit Back Photo'}
        />
      )}

      {/* Grading Image Viewer */}
      {showImageViewer && viewerImage && (
        <GradingImageViewer
          imageUrl={viewerImage}
          altText="Card Image"
          onClose={() => {
            setShowImageViewer(false);
            setViewerImage(null);
          }}
        />
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full shadow-xl">
            <div className="p-6 text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Save Your Progress?
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You have <span className="font-semibold text-gray-900 dark:text-gray-200">{bulkPhotos.length} cards</span> scanned. 
                Your cards will be saved as a draft and you can continue grading them later.
              </p>
              
              {/* Features */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your draft includes:</p>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    All scanned card photos
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Both front and back images
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Ready to submit for grading
                  </li>
                </ul>
              </div>
              
              {/* Actions */}
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowExitConfirmModal(false)}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Continue Scanning
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setCurrentBulkCard({ front: null, back: null });
                    setBulkStep('front');
                    setStep('mode-select');
                    setShowExitConfirmModal(false);
                  }}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  Save & Exit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>)
};

export default GradeSubmitPage;