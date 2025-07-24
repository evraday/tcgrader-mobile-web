import React, { useState } from 'react';
import cameraService from '../../services/camera';
import apiService from '../../services/api';
import Button from '../common/Button';
import { Card } from '../../types';

interface CardScannerProps {
  onCardScanned: (card: Card) => void;
  onError: (error: string) => void;
}

const CardScanner: React.FC<CardScannerProps> = ({ onCardScanned, onError }) => {
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

      setScannedImage(imageData);

      // Convert base64 to blob for API
      const response = await fetch(imageData);
      const blob = await response.blob();

      // Send to API for recognition
      const scanResult = await apiService.scanCard(blob);
      
      if (scanResult.card) {
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

      // Convert and scan
      const response = await fetch(imageData);
      const blob = await response.blob();
      const scanResult = await apiService.scanCard(blob);
      
      if (scanResult.card) {
        onCardScanned(scanResult.card);
      } else {
        onError('Card not recognized. Please try manual entry.');
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

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 text-center">Scan Your Card</h3>
      
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
              Scan Different Card
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Point your camera at a trading card to automatically identify it
            </p>
          </div>

          <div className="space-y-3">
            <Button
              fullWidth
              onClick={handleScanCard}
              loading={isScanning}
              className="flex items-center justify-center space-x-2"
            >
              <span className="text-xl">📸</span>
              <span>Take Photo</span>
            </Button>

            <Button
              fullWidth
              variant="secondary"
              onClick={handleGallerySelect}
              loading={isScanning}
              className="flex items-center justify-center space-x-2"
            >
              <span className="text-xl">🖼️</span>
              <span>Choose from Gallery</span>
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Scanning Tips:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Ensure good lighting</li>
              <li>• Keep the card flat and centered</li>
              <li>• Avoid shadows and glare</li>
              <li>• Make sure text is readable</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardScanner;