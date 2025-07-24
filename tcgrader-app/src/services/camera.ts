import { Camera, CameraResultType, CameraSource, ImageOptions } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

interface CaptureOptions {
  quality?: number;
  allowEditing?: boolean;
  saveToGallery?: boolean;
}

class CameraService {
  async captureCardImage(options: CaptureOptions = {}): Promise<string> {
    const imageOptions: ImageOptions = {
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      saveToGallery: options.saveToGallery || false
    };

    try {
      const photo = await Camera.getPhoto(imageOptions);
      
      if (!photo.webPath) {
        throw new Error('Failed to capture image');
      }

      // Convert to base64 for upload
      const base64Data = await this.readAsBase64(photo.webPath);
      
      // Save to local storage
      const fileName = `card_${Date.now()}.jpg`;
      await this.saveImage(fileName, base64Data);
      
      return base64Data;
    } catch (error) {
      console.error('Camera capture failed:', error);
      throw error;
    }
  }

  async selectFromGallery(): Promise<string> {
    const imageOptions: ImageOptions = {
      quality: 90,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos
    };

    try {
      const photo = await Camera.getPhoto(imageOptions);
      
      if (!photo.webPath) {
        throw new Error('Failed to select image');
      }

      const base64Data = await this.readAsBase64(photo.webPath);
      return base64Data;
    } catch (error) {
      console.error('Gallery selection failed:', error);
      throw error;
    }
  }

  async captureMultipleAngles(): Promise<string[]> {
    const angles = ['front', 'back', 'left-corner', 'right-corner'];
    const images: string[] = [];

    for (const angle of angles) {
      const confirmed = confirm(`Please capture the ${angle} of the card`);
      if (!confirmed) break;

      try {
        const image = await this.captureCardImage({ quality: 95 });
        images.push(image);
      } catch (error) {
        console.error(`Failed to capture ${angle}:`, error);
      }
    }

    return images;
  }

  async captureGradingPhotos(): Promise<{
    front: string;
    back: string;
    angles?: string[];
  }> {
    const result: any = {};

    // Capture front
    alert('Please capture the FRONT of the card');
    result.front = await this.captureCardImage({ quality: 95 });

    // Capture back
    alert('Please capture the BACK of the card');
    result.back = await this.captureCardImage({ quality: 95 });

    // Ask for additional angles
    const wantsAngles = confirm('Would you like to capture additional angles for better grading assessment?');
    if (wantsAngles) {
      result.angles = await this.captureMultipleAngles();
    }

    return result;
  }

  private async readAsBase64(webPath: string): Promise<string> {
    const response = await fetch(webPath);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async saveImage(fileName: string, base64Data: string): Promise<void> {
    try {
      await Filesystem.writeFile({
        path: `cards/${fileName}`,
        data: base64Data,
        directory: Directory.Data
      });

      // Save reference in preferences
      const { value } = await Preferences.get({ key: 'saved_images' });
      const savedImages = value ? JSON.parse(value) : [];
      savedImages.push({ fileName, timestamp: Date.now() });
      
      await Preferences.set({
        key: 'saved_images',
        value: JSON.stringify(savedImages)
      });
    } catch (error) {
      console.error('Failed to save image locally:', error);
    }
  }

  async getLocalImages(): Promise<Array<{ fileName: string; timestamp: number }>> {
    try {
      const { value } = await Preferences.get({ key: 'saved_images' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Failed to get local images:', error);
      return [];
    }
  }

  async deleteLocalImage(fileName: string): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path: `cards/${fileName}`,
        directory: Directory.Data
      });

      // Update preferences
      const { value } = await Preferences.get({ key: 'saved_images' });
      const savedImages = value ? JSON.parse(value) : [];
      const filtered = savedImages.filter((img: any) => img.fileName !== fileName);
      
      await Preferences.set({
        key: 'saved_images',
        value: JSON.stringify(filtered)
      });
    } catch (error) {
      console.error('Failed to delete local image:', error);
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      if (permissions.camera === 'granted' && permissions.photos === 'granted') {
        return true;
      }
      
      const requested = await Camera.requestPermissions();
      return requested.camera === 'granted' && requested.photos === 'granted';
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }
}

export default new CameraService();