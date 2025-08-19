import React, { useState, useImperativeHandle, forwardRef } from 'react';
import cameraService from '../../services/camera';
import apiService from '../../services/api';
import Button from '../common/Button';
import { Card } from '../../types';

interface CardScannerProps {
  onCardScanned?: (card: Card) => void;
  onImageCaptured?: (imageUrl: string) => void;
  onError: (error: string) => void;
  captureMode?: 'front' | 'back' | 'scan';
  hideButtons?: boolean;
}

export interface CardScannerRef {
  capturePhoto: () => Promise<void>;
  selectFromGallery: () => Promise<void>;
}

const CardScanner: React.ForwardRefRenderFunction<CardScannerRef, CardScannerProps> = (props, ref) => {
  const { onCardScanned, onImageCaptured, onError, captureMode = 'scan', hideButtons = false } = props;
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);

  const handleScanCard = async () => {
    try {
      setIsScanning(true);
      
      // Check camera permissions
      const hasPermission = await cameraService.checkPermissions();
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      // Capture image
      const imageData = await cameraService.captureCardImage({
        quality: 90,
        allowEditing: true
      });

      // If we're just capturing an image (front/back), don't scan and don't show preview
      if (captureMode === 'front' || captureMode === 'back') {
        if (onImageCaptured) {
          onImageCaptured(imageData);
          // Don't set scannedImage to avoid showing preview
          return;
        }
      }
      
      // Only set scanned image for card recognition mode
      setScannedImage(imageData);
      
      // Convert base64 to blob for API
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Send to API for recognition
      const scanResult = await apiService.scanCard(blob);
      
      if (scanResult.card && onCardScanned) {
        onCardScanned(scanResult.card);
      } else {
        onError('Card not recognized. Please try manual entry.');
      }
    } catch (error: any) {
      console.error('Card scanning failed:', error);
      onError(error.message || 'Failed to scan card');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGallerySelect = async () => {
    try {
      setIsScanning(true);
      
      const imageData = await cameraService.selectFromGallery();
      setScannedImage(imageData);

      // If we're just capturing an image (front/back), don't scan
      if (captureMode === 'front' || captureMode === 'back') {
        if (onImageCaptured) {
          onImageCaptured(imageData);
        }
      } else {
        // Convert and scan
        const response = await fetch(imageData);
        const blob = await response.blob();
        const scanResult = await apiService.scanCard(blob);
        
        if (scanResult.card && onCardScanned) {
          onCardScanned(scanResult.card);
        } else {
          onError('Card not recognized. Please try manual entry.');
        }
      }
    } catch (error: any) {
      console.error('Gallery selection failed:', error);
      onError(error.message || 'Failed to select image');
    } finally {
      setIsScanning(false);
    }
  };

  const retryScanning = () => {
    setScannedImage(null);
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    capturePhoto: handleScanCard,
    selectFromGallery: handleGallerySelect
  }));

  return (
    <div>
      {/* Removed redundant header since it's already in the parent component */}
      
      {scannedImage ? (
        <div className="text-center">
          <img 
            src={scannedImage} 
            alt="Scanned card"
            className="w-full max-w-xs mx-auto rounded-lg mb-4"
          />
          <div className="space-y-2">
            <Button 
              fullWidth 
              onClick={retryScanning}
              variant="secondary"
            >
              {captureMode === 'front' || captureMode === 'back' ? 'Retake Photo' : 'Scan Different Card'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 flex flex-col justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {captureMode === 'front' ? 'Capture the front of your card' :
               captureMode === 'back' ? 'Capture the back of your card' :
               'Point your camera at a trading card to automatically identify it'}
            </p>
          </div>

          {!hideButtons && (
            <div className="space-y-3">
              <Button
                fullWidth
                onClick={handleScanCard}
                loading={isScanning}
                className="flex items-center justify-center space-x-2"
                data-capture-button
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Take Photo</span>
              </Button>

              <Button
                fullWidth
                variant="secondary"
                onClick={handleGallerySelect}
                loading={isScanning}
                className="flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Choose from Gallery</span>
              </Button>
            </div>
          )}

          {!hideButtons && (
            <div className="bg-gray-50 dark:bg-slate-900/50 dark:text-gray-200 p-4 rounded-xl mt-10">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center  dark:text-gray-200">
                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Scanning Tips
              </h4>
              <ul className="text-sm  dark:text-gray-400 text-gray-600 space-y-1">
                <li className="flex items-start">
                  <svg className="w-3 h-3  dark:text-gray-200 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Ensure good lighting</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-3 h-3 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Keep the card flat and centered</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-3 h-3 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Avoid shadows and glare</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-3 h-3 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Make sure text is readable</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ForwardedCardScanner = forwardRef(CardScanner);
ForwardedCardScanner.displayName = 'CardScanner';

export default ForwardedCardScanner;