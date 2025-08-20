import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGradeStore, useAuthStore } from '../store';
import { GradingService, Card, GradeImages } from '../types';
import { SUBSCRIPTION_LIMITS, GRADING_SERVICE_NAMES } from '../constants';
import cameraService from '../services/camera';
import apiService from '../services/api';
import Button from '../components/common/Button';
import CardScanner from '../components/cards/CardScanner';

const GradeSubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addGrade } = useGradeStore();
  
  const [step, setStep] = useState<'card' | 'service' | 'photos' | 'review'>('card');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [gradingService, setGradingService] = useState<GradingService | null>(null);
  const [images, setImages] = useState<GradeImages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userCredits, setUserCredits] = useState<number>(0);
  const [creditInfo, setCreditInfo] = useState<{ used: number; total: number } | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  useEffect(() => {
    const fetchUserCredits = async () => {
      try {
        setLoadingCredits(true);
        const usage = await apiService.getUsage();
        if (usage && usage.credits !== undefined) {
          setUserCredits(usage.credits);
          setCreditInfo({
            used: usage.creditsUsed || 0,
            total: usage.creditsTotal || usage.credits || 0
          });
        } else if (user && user.credits !== undefined) {
          setUserCredits(user.credits);
          setCreditInfo({
            used: 0,
            total: user.credits
          });
        }
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
        if (user && user.credits !== undefined) {
          setUserCredits(user.credits);
        }
      } finally {
        setLoadingCredits(false);
      }
    };

    if (user) {
      fetchUserCredits();
    }
  }, [user]);

  const limits = user ? SUBSCRIPTION_LIMITS[user.isPremium ? 'premium' : 'free'] : null;
  const canSubmit = userCredits > 0;

  const handleCardScanned = (card: Card) => {
    setSelectedCard(card);
    setStep('service');
  };

  const handleManualEntry = () => {
    // For now, create a placeholder card
    const card: Card = {
      id: 'manual-' + Date.now(),
      name: 'Manual Entry Card',
      setName: 'Unknown Set',
      setCode: 'UNK',
      number: '000',
      rarity: 'common' as any,
      condition: 'near_mint' as any,
      language: 'English',
      foil: false,
      signed: false,
      altered: false
    };
    setSelectedCard(card);
    setStep('service');
  };

  const handleServiceSelect = (service: GradingService) => {
    setGradingService(service);
    setStep('photos');
  };

  const handlePhotosCapture = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const gradingPhotos = await cameraService.captureGradingPhotos();
      
      if (!gradingPhotos || !gradingPhotos.front || !gradingPhotos.back) {
        throw new Error('Failed to capture required photos');
      }
      
      setImages(gradingPhotos);
      setStep('review');
    } catch (error: any) {
      console.error('Photo capture error:', error);
      setError(error.message || 'Failed to capture photos. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCard || !gradingService || !images) {
      setError('Please complete all steps before submitting');
      return;
    }

    if (!images.front || !images.back) {
      setError('Front and back photos are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Create form data
      const formData = new FormData();
      formData.append('cardId', selectedCard.id);
      formData.append('cardName', selectedCard.name);
      formData.append('cardSet', selectedCard.setName);
      formData.append('cardNumber', selectedCard.number);
      formData.append('service', gradingService);
      
      // Convert base64 images to blobs
      const base64ToBlob = (base64: string): Blob => {
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
      };

      // Add images
      const frontBlob = base64ToBlob(images.front);
      const backBlob = base64ToBlob(images.back);
      
      formData.append('frontImage', frontBlob, 'front.jpg');
      formData.append('backImage', backBlob, 'back.jpg');

      if (images.angles && images.angles.length > 0) {
        for (let i = 0; i < images.angles.length; i++) {
          const angleBlob = base64ToBlob(images.angles[i]);
          formData.append(`angleImage${i}`, angleBlob, `angle${i}.jpg`);
        }
      }

      const grade = await apiService.createGradeSubmission(formData);
      
      if (grade && grade.id) {
        addGrade(grade);
        // Update user credits after successful submission
        setUserCredits(prev => Math.max(0, prev - 1));
        if (creditInfo) {
          setCreditInfo({
            ...creditInfo,
            used: creditInfo.used + 1
          });
        }
        navigate('/grades');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Grade submission error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to submit for grading');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingCredits) {
    return (
      <div className="min-h-screen px-4 py-8 safe-area-top">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4 animate-pulse">⏳</div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Checking your grading credits...
          </p>
        </div>
      </div>
    );
  }

  if (!canSubmit) {
    return (
      <div className="min-h-screen px-4 py-8 safe-area-top">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">💳</div>
          <h2 className="text-xl font-semibold mb-2">No Grading Credits Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You have {userCredits} grading credits remaining. Purchase more credits to submit cards for grading.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/subscription')}>
              Purchase Credits
            </Button>
            <Button variant="secondary" onClick={() => navigate('/grades')}>
              View Your Grades
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 safe-area-top">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Submit for Grading
        </h1>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span className={step === 'card' ? 'text-primary-600 font-medium' : ''}>Card</span>
            <span>→</span>
            <span className={step === 'service' ? 'text-primary-600 font-medium' : ''}>Service</span>
            <span>→</span>
            <span className={step === 'photos' ? 'text-primary-600 font-medium' : ''}>Photos</span>
            <span>→</span>
            <span className={step === 'review' ? 'text-primary-600 font-medium' : ''}>Review</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {userCredits} {userCredits === 1 ? 'Credit' : 'Credits'} Available
            </div>
            {creditInfo && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {creditInfo.used} of {creditInfo.total} used
              </div>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 text-sm mt-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {step === 'card' && (
        <div className="space-y-6">
          <CardScanner
            onCardScanned={handleCardScanned}
            onError={setError}
          />
          
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Or add card details manually
            </p>
            <Button variant="secondary" onClick={handleManualEntry}>
              Manual Entry
            </Button>
          </div>
        </div>
      )}

      {step === 'service' && selectedCard && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Selected Card</h3>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎴</span>
              </div>
              <div>
                <h4 className="font-medium">{selectedCard.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedCard.setName} • #{selectedCard.number}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Choose Grading Service</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Each submission uses 1 grading credit. You have {userCredits} {userCredits === 1 ? 'credit' : 'credits'} available.
              </p>
            </div>
            <div className="space-y-3">
              {Object.entries(GRADING_SERVICE_NAMES).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => handleServiceSelect(key as GradingService)}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-600 transition-colors text-left"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Professional grading service
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      1 Credit
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'photos' && (
        <div className="space-y-6">
          <div className="card text-center">
            <h3 className="text-lg font-semibold mb-4">Capture Grading Photos</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Take high-quality photos of your card for accurate grading assessment.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Photo Requirements:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Front and back photos required</li>
                <li>• Well-lit, no shadows or glare</li>
                <li>• Card centered and in focus</li>
                <li>• Show any defects clearly</li>
              </ul>
            </div>

            <Button
              fullWidth
              onClick={handlePhotosCapture}
              loading={isLoading}
            >
              Start Photo Capture
            </Button>
          </div>
        </div>
      )}

      {step === 'review' && selectedCard && gradingService && images && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Review Submission</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Card</label>
                <p className="text-gray-900 dark:text-white">{selectedCard.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Service</label>
                <p className="text-gray-900 dark:text-white">{GRADING_SERVICE_NAMES[gradingService]}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Photos</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Front</p>
                    <img src={images.front} alt="Front" className="w-full h-32 object-cover rounded" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Back</p>
                    <img src={images.back} alt="Back" className="w-full h-32 object-cover rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              fullWidth
              onClick={handleSubmit}
              loading={isLoading}
            >
              Submit for Grading
            </Button>
            
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setStep('photos')}
            >
              Retake Photos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeSubmitPage;