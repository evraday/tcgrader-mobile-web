import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGradeStore, useAuthStore } from '../store';
import { GradingService, Card, GradeImages } from '../types';
import { SUBSCRIPTION_LIMITS, GRADING_SERVICE_NAMES } from '../constants';
import cameraService from '../services/camera';
import apiService from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
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

  const limits = user ? SUBSCRIPTION_LIMITS[user.isPremium ? 'premium' : 'free'] : null;
  const canSubmit = limits && (limits.gradesPerMonth === -1 || true); // TODO: Check actual usage

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
      const gradingPhotos = await cameraService.captureGradingPhotos();
      setImages(gradingPhotos);
      setStep('review');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCard || !gradingService || !images) return;

    try {
      setIsLoading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('cardId', selectedCard.id);
      formData.append('service', gradingService);
      
      // Add images
      const frontBlob = await fetch(images.front).then(r => r.blob());
      const backBlob = await fetch(images.back).then(r => r.blob());
      
      formData.append('frontImage', frontBlob, 'front.jpg');
      formData.append('backImage', backBlob, 'back.jpg');

      if (images.angles) {
        for (let i = 0; i < images.angles.length; i++) {
          const angleBlob = await fetch(images.angles[i]).then(r => r.blob());
          formData.append(`angleImage${i}`, angleBlob, `angle${i}.jpg`);
        }
      }

      const grade = await apiService.createGradeSubmission(formData);
      addGrade(grade);
      
      navigate('/grades');
    } catch (error: any) {
      setError(error.message || 'Failed to submit for grading');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canSubmit) {
    return (
      <div className="min-h-screen px-4 py-8 safe-area-top">
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold mb-2">Grade Limit Reached</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You've reached your monthly grading limit. Upgrade your plan to submit more cards.
          </p>
          <Button onClick={() => navigate('/subscription')}>
            Upgrade Plan
          </Button>
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
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span className={step === 'card' ? 'text-primary-600 font-medium' : ''}>Card</span>
          <span>→</span>
          <span className={step === 'service' ? 'text-primary-600 font-medium' : ''}>Service</span>
          <span>→</span>
          <span className={step === 'photos' ? 'text-primary-600 font-medium' : ''}>Photos</span>
          <span>→</span>
          <span className={step === 'review' ? 'text-primary-600 font-medium' : ''}>Review</span>
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
            <div className="space-y-3">
              {Object.entries(GRADING_SERVICE_NAMES).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => handleServiceSelect(key as GradingService)}
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-600 transition-colors text-left"
                >
                  <div className="font-medium">{name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Professional grading service
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