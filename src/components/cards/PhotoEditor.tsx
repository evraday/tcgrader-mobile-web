import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';

interface PhotoEditorProps {
  imageUrl: string;
  onConfirm: (editedImageUrl: string) => void;
  onCancel: () => void;
  title?: string;
}

interface Transform {
  scale: number;
  rotation: number;
  x: number;
  y: number;
  brightness: number;
  contrast: number;
}

const PhotoEditor: React.FC<PhotoEditorProps> = ({ imageUrl, onConfirm, onCancel, title = "Edit Photo" }) => {
  const [transform, setTransform] = useState<Transform>({
    scale: 0.6,
    rotation: 0,
    x: 0,
    y: 0,
    brightness: 100,
    contrast: 100
  });
  
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardOverlay, setCardOverlay] = useState({ width: 0, height: 0, x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchPosition = useRef<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    loadImage();
    calculateCardOverlay();
  }, [imageUrl]);

  useEffect(() => {
    if (imageRef.current && canvasRef.current) {
      renderCanvas();
    }
  }, [transform, cropArea]);

  useEffect(() => {
    const handleResize = () => calculateCardOverlay();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadImage = () => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      if (canvasRef.current && containerRef.current) {
        // Set canvas size to container size
        const container = containerRef.current;
        canvasRef.current.width = container.clientWidth;
        canvasRef.current.height = container.clientHeight;
        
        // Set crop area to full image - no cropping by default
        setCropArea({
          x: 0,
          y: 0,
          width: img.width,
          height: img.height
        });
        
        renderCanvas();
      }
    };
    img.src = imageUrl;
  };

  const calculateCardOverlay = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Standard trading card aspect ratio (2.5" x 3.5" = 5:7)
    const cardAspectRatio = 5 / 7;
    
    // Calculate overlay size - 60% of container with proper aspect ratio
    let overlayWidth, overlayHeight;
    if (containerWidth / containerHeight > cardAspectRatio) {
      // Container is wider - fit to height
      overlayHeight = containerHeight * 0.6;
      overlayWidth = overlayHeight * cardAspectRatio;
    } else {
      // Container is taller - fit to width
      overlayWidth = containerWidth * 0.6;
      overlayHeight = overlayWidth / cardAspectRatio;
    }
    
    setCardOverlay({
      width: overlayWidth,
      height: overlayHeight,
      x: (containerWidth - overlayWidth) / 2,
      y: (containerHeight - overlayHeight) / 2
    });
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;
    
    if (!canvas || !ctx || !img) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((transform.rotation * Math.PI) / 180);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(-canvas.width / 2 + transform.x, -canvas.height / 2 + transform.y);
    
    // Apply filters
    ctx.filter = `brightness(${transform.brightness}%) contrast(${transform.contrast}%)`;
    
    // Calculate destination rectangle to fit canvas while maintaining aspect ratio
    // This ensures the entire image is visible (letterboxed if necessary)
    const imageAspect = cropArea.width / cropArea.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let destWidth, destHeight;
    if (imageAspect > canvasAspect) {
      // Image is wider than canvas - fit to width
      destWidth = canvas.width * 0.9; // 90% to leave some padding
      destHeight = destWidth / imageAspect;
    } else {
      // Image is taller than canvas - fit to height
      destHeight = canvas.height * 0.9; // 90% to leave some padding
      destWidth = destHeight * imageAspect;
    }
    
    const destX = (canvas.width - destWidth) / 2;
    const destY = (canvas.height - destHeight) / 2;
    
    // Draw image with crop
    ctx.drawImage(
      img,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      destX,
      destY,
      destWidth,
      destHeight
    );
    
    // Restore context state
    ctx.restore();
    
    // Draw crop overlay if in crop mode
    if (cropMode) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clear crop area
      ctx.clearRect(destX, destY, destWidth, destHeight);
      
      // Draw crop handles
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(destX, destY, destWidth, destHeight);
      
      // Draw corner handles
      const handleSize = 20;
      const handles = [
        { x: destX, y: destY },
        { x: destX + destWidth, y: destY },
        { x: destX, y: destY + destHeight },
        { x: destX + destWidth, y: destY + destHeight }
      ];
      
      ctx.fillStyle = '#fff';
      handles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      });
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1) {
      // Pan gesture
      setIsDragging(true);
      const touch = e.touches[0];
      lastTouchPosition.current = { x: touch.clientX, y: touch.clientY };
      dragStart.current = { x: transform.x, y: transform.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && lastTouchDistance.current) {
      // Pinch zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = distance / lastTouchDistance.current;
      setTransform(prev => ({
        ...prev,
        scale: Math.min(Math.max(prev.scale * delta, 0.5), 3)
      }));
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && isDragging && lastTouchPosition.current && dragStart.current) {
      // Pan
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchPosition.current.x;
      const deltaY = touch.clientY - lastTouchPosition.current.y;
      
      setTransform(prev => ({
        ...prev,
        x: dragStart.current!.x + deltaX,
        y: dragStart.current!.y + deltaY
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistance.current = null;
    lastTouchPosition.current = null;
    dragStart.current = null;
  };

  const handleRotate = (degrees: number) => {
    setTransform(prev => ({ ...prev, rotation: (prev.rotation + degrees) % 360 }));
  };

  const handleZoom = (delta: number) => {
    setTransform(prev => ({ ...prev, scale: Math.min(Math.max(prev.scale + delta, 0.5), 3) }));
  };

  const handleReset = () => {
    setTransform({
      scale: 0.75,
      rotation: 0,
      x: 0,
      y: 0,
      brightness: 100,
      contrast: 100
    });
    setCropMode(false);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      
      if (canvas && img) {
        // Create a new canvas for the cropped image
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        
        if (cropCtx) {
          // Add padding around the card
          const padding = 30; // 30px padding on all sides
          
          // Set canvas size to card overlay dimensions plus padding
          cropCanvas.width = cardOverlay.width + (padding * 2);
          cropCanvas.height = cardOverlay.height + (padding * 2);
          
          // Calculate the source area from the original image that corresponds to the overlay
          const scale = Math.min(canvas.width / cropArea.width, canvas.height / cropArea.height) * 0.9;
          const displayWidth = cropArea.width * scale * transform.scale;
          const displayHeight = cropArea.height * scale * transform.scale;
          const displayX = (canvas.width - displayWidth) / 2 + transform.x;
          const displayY = (canvas.height - displayHeight) / 2 + transform.y;
          
          // Calculate what portion of the image is in the overlay (with padding)
          const scaleX = cropArea.width / displayWidth;
          const scaleY = cropArea.height / displayHeight;
          
          // Adjust source coordinates to include padding
          const sourceX = Math.max(0, cropArea.x + ((cardOverlay.x - padding) - displayX) * scaleX);
          const sourceY = Math.max(0, cropArea.y + ((cardOverlay.y - padding) - displayY) * scaleY);
          const sourceWidth = Math.min((cardOverlay.width + (padding * 2)) * scaleX, img.width - sourceX);
          const sourceHeight = Math.min((cardOverlay.height + (padding * 2)) * scaleY, img.height - sourceY);
          
          // Apply rotation to crop canvas
          cropCtx.save();
          cropCtx.translate(cropCanvas.width / 2, cropCanvas.height / 2);
          cropCtx.rotate((transform.rotation * Math.PI) / 180);
          cropCtx.translate(-cropCanvas.width / 2, -cropCanvas.height / 2);
          
          // Apply filters
          cropCtx.filter = `brightness(${transform.brightness}%) contrast(${transform.contrast}%)`;
          
          // Draw the cropped portion
          cropCtx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            cropCanvas.width,
            cropCanvas.height
          );
          
          cropCtx.restore();
          
          // Export the cropped image
          const croppedImageUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
          onConfirm(croppedImageUrl);
        }
      }
    } catch (error) {
      console.error('Failed to process image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent safe-area-top">
        <div className="flex items-center justify-between p-4 pt-12">
          <button onClick={onCancel} className="p-2 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <button onClick={handleReset} className="p-2 text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full"
          style={{ touchAction: 'none' }}
        />
        
        {/* Vertical Sliders */}
        {/* Brightness Slider - Left Side */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-2">
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <div className="relative h-48 w-8">
            <input
              type="range"
              min="50"
              max="150"
              value={transform.brightness}
              onChange={(e) => setTransform(prev => ({ ...prev, brightness: Number(e.target.value) }))}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-8 -rotate-90 accent-white opacity-70"
              style={{ transformOrigin: 'center' }}
            />
          </div>
          <span className="text-white/60 text-xs">{transform.brightness}%</span>
        </div>
        
        {/* Contrast Slider - Right Side */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-2">
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <div className="relative h-48 w-8">
            <input
              type="range"
              min="50"
              max="150"
              value={transform.contrast}
              onChange={(e) => setTransform(prev => ({ ...prev, contrast: Number(e.target.value) }))}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-8 -rotate-90 accent-white opacity-70"
              style={{ transformOrigin: 'center' }}
            />
          </div>
          <span className="text-white/60 text-xs">{transform.contrast}%</span>
        </div>
        
        {/* Card Alignment Overlay */}
        <div 
          className="absolute pointer-events-none"
          style={{
            width: `${cardOverlay.width}px`,
            height: `${cardOverlay.height}px`,
            left: `${cardOverlay.x}px`,
            top: `${cardOverlay.y}px`,
          }}
        >
          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-lg"></div>
          
          {/* Center lines */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 -translate-x-1/2"></div>
          
          {/* Border */}
          <div className="absolute inset-0 border-2 border-white/50 rounded-lg"></div>
        </div>
        
        {/* Darkened areas outside overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top */}
          <div 
            className="absolute top-0 left-0 right-0 bg-black/50"
            style={{ height: `${cardOverlay.y}px` }}
          ></div>
          {/* Bottom */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-black/50"
            style={{ height: `${cardOverlay.y}px` }}
          ></div>
          {/* Left */}
          <div 
            className="absolute left-0 bg-black/50"
            style={{ 
              top: `${cardOverlay.y}px`,
              bottom: `${cardOverlay.y}px`,
              width: `${cardOverlay.x}px` 
            }}
          ></div>
          {/* Right */}
          <div 
            className="absolute right-0 bg-black/50"
            style={{ 
              top: `${cardOverlay.y}px`,
              bottom: `${cardOverlay.y}px`,
              width: `${cardOverlay.x}px` 
            }}
          ></div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent safe-area-bottom">
        <div className="p-4 pb-8 space-y-4">
          {/* Tool Buttons - Premium PSA/NBA Style */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button 
              onClick={() => handleRotate(-90)}
              className="relative p-3.5 bg-gradient-to-b from-white/20 to-white/10 backdrop-blur-md rounded-2xl text-white hover:from-white/30 hover:to-white/20 transition-all shadow-lg border border-white/20"
              title="Rotate Left"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-50"></div>
              <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" transform="scale(-1, 1) translate(-24, 0)" />
              </svg>
            </button>
            
            <button 
              onClick={() => handleZoom(0.05)}
              className="relative p-3.5 bg-gradient-to-b from-white/20 to-white/10 backdrop-blur-md rounded-2xl text-white hover:from-white/30 hover:to-white/20 transition-all shadow-lg border border-white/20"
              title="Zoom In"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-50"></div>
              <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            
            <button 
              onClick={() => handleZoom(-0.05)}
              className="relative p-3.5 bg-gradient-to-b from-white/20 to-white/10 backdrop-blur-md rounded-2xl text-white hover:from-white/30 hover:to-white/20 transition-all shadow-lg border border-white/20"
              title="Zoom Out"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-50"></div>
              <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            
            <button 
              onClick={() => handleRotate(90)}
              className="relative p-3.5 bg-gradient-to-b from-white/20 to-white/10 backdrop-blur-md rounded-2xl text-white hover:from-white/30 hover:to-white/20 transition-all shadow-lg border border-white/20"
              title="Rotate Right"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-50"></div>
              <svg className="w-6 h-6 transform scale-x-[-1] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>


          {/* Tips */}
          <div className="text-center text-white/60 text-xs">
            <p>Align your card within the guide frame</p>
            <p className="mt-1">Pinch to zoom • Drag to move • Rotate as needed</p>
          </div>

          {/* Action Buttons - Premium Style */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 relative py-4 px-6 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-2xl text-white font-medium hover:from-white/15 hover:to-white/10 transition-all shadow-lg border border-white/20"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-50"></div>
              <span className="relative z-10">Cancel</span>
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 relative py-4 px-6 bg-gradient-to-b from-white to-gray-100 rounded-2xl text-black font-bold hover:from-gray-100 hover:to-gray-200 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent opacity-30"></div>
              <div className="flex items-center justify-center space-x-2 relative z-10">
                {isProcessing ? (
                  <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirm Photo</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoEditor;