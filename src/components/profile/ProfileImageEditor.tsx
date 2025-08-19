import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';
import PhotoEditor from '../cards/PhotoEditor';

interface ProfileImageEditorProps {
  currentImage?: string;
  onConfirm: (imageData: string | { type: 'color'; value: string }) => void;
  onCancel: () => void;
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Green', value: '#10B981' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' }
];

const ProfileImageEditor: React.FC<ProfileImageEditorProps> = ({ currentImage, onConfirm, onCancel }) => {
  const [mode, setMode] = useState<'choose' | 'color' | 'image' | 'crop'>('choose');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    // Generate a solid color image
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 400, 400);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      onConfirm(imageData);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
          setMode('crop');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageConfirm = (croppedImage: string) => {
    onConfirm(croppedImage);
  };

  if (mode === 'crop' && selectedImage) {
    return (
      <PhotoEditor
        imageUrl={selectedImage}
        onConfirm={handleImageConfirm}
        onCancel={() => setMode('choose')}
        title="Adjust Profile Photo"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Change Profile Photo
            </h3>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'choose' && (
            <div className="space-y-6">
              {/* Upload Image Option */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Upload Photo
                </h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Choose from gallery
                    </span>
                  </div>
                </button>
              </div>

              {/* Solid Colors Option */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Solid Colors
                </h4>
                <div className="grid grid-cols-6 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorSelect(color.value)}
                      className="relative w-full aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {color.value === '#FFFFFF' && (
                        <div className="absolute inset-0 border border-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Photo Option */}
              {currentImage && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Current Photo
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedImage(currentImage);
                      setMode('crop');
                    }}
                    className="relative w-24 h-24 rounded-full overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={currentImage}
                      alt="Current profile"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileImageEditor;