import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface GradingImageViewerProps {
  imageUrl: string;
  altText?: string;
  onClose: () => void;
}

const GradingImageViewer: React.FC<GradingImageViewerProps> = ({
  imageUrl,
  altText = 'Card Image',
  onClose
}) => {
  // States for image manipulation
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<string>('none');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  // Container refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Available filters for card grading
  const filters = [
    { name: 'Original', value: 'none', description: 'Natural view' },
    { name: 'Edge Detect', value: 'contrast(200%) brightness(150%)', description: 'Highlight edges and corners' },
    { name: 'Surface', value: 'contrast(150%) saturate(0%)', description: 'Reveal surface defects' },
    { name: 'Holo Check', value: 'saturate(200%) contrast(120%)', description: 'Enhance holographic features' },
    { name: 'Print Lines', value: 'contrast(300%) brightness(80%)', description: 'Detect print lines' },
    { name: 'Whitening', value: 'brightness(120%) contrast(80%)', description: 'Check for whitening' },
    { name: 'Scratches', value: 'contrast(200%) brightness(90%) grayscale(1)', description: 'Find surface scratches' },
    { name: 'UV Light', value: 'hue-rotate(180deg) saturate(150%) brightness(110%)', description: 'Simulate UV inspection' },
  ];

  // Handle image load
  const handleImageLoad = () => {
    // Auto-show help on first load
    if (localStorage.getItem('gradingViewerHelpShown') !== 'true') {
      setShowHelp(true);
      localStorage.setItem('gradingViewerHelpShown', 'true');
      setTimeout(() => setShowHelp(false), 5000);
    }
  };

  // Reset image position and scale
  const resetImage = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
    setFilter('none');
    setBrightness(100);
    setContrast(100);
  };

  // Zoom functions
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  // Rotation function
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  // Apply custom filter
  const applyCustomFilter = () => {
    const customFilter = `brightness(${brightness}%) contrast(${contrast}%)`;
    setFilter(customFilter);
  };

  // Mouse handlers for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - startPos.x,
        y: e.touches[0].clientY - startPos.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case 'r':
          rotate();
          break;
        case '0':
          resetImage();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setPosition(prev => ({ ...prev, y: prev.y + 20 }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setPosition(prev => ({ ...prev, y: prev.y - 20 }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setPosition(prev => ({ ...prev, x: prev.x + 20 }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPosition(prev => ({ ...prev, x: prev.x - 20 }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ensure we have a DOM element to portal to
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in">
      {/* Help overlay */}
      {showHelp && (
        <div 
          className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center animate-fade-in"
          onClick={() => setShowHelp(false)}
        >
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 m-4 max-w-sm border border-gray-700/50">
            <h3 className="text-white text-lg font-semibold flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Card Grading Viewer
            </h3>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li className="flex items-start gap-2">
                <div className="bg-primary-900/70 p-1 rounded mt-0.5">
                  <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>Zoom in to examine corners, edges, and surface details</div>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary-900/70 p-1 rounded mt-0.5">
                  <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>Apply specialized filters to detect defects</div>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary-900/70 p-1 rounded mt-0.5">
                  <svg className="w-4 h-4 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div>Click and drag to move the image when zoomed</div>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary-900/70 p-1 rounded mt-0.5">
                  <kbd className="text-xs bg-gray-900 px-1.5 py-0.5 rounded text-primary-300">ESC</kbd>
                </div>
                <div>Press Escape to close the viewer</div>
              </li>
            </ul>
            <button
              className="mt-5 w-full py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowHelp(false);
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Image container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={altText}
          className={`max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-200 ${
            isDragging ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'
          }`}
          style={{
            filter,
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            userSelect: 'none'
          }}
          onLoad={handleImageLoad}
          draggable="false"
        />

        {/* Close button */}
        <button
          className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Help button */}
        <button
          className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
          onClick={() => setShowHelp(true)}
          aria-label="Help"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Controls Toolbar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 z-10">
          {/* Primary toolbar */}
          <div className="bg-black/70 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-lg overflow-hidden">
            {/* Zoom and basic controls */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700/30">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">Zoom: {(scale * 100).toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-white bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
                  onClick={zoomOut}
                  aria-label="Zoom out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <button
                  className="p-2 text-white bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
                  onClick={zoomIn}
                  aria-label="Zoom in"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </button>
                <button
                  className="p-2 text-white bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
                  onClick={rotate}
                  aria-label="Rotate"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  className="p-2 text-white bg-gray-800/80 hover:bg-gray-700/80 rounded-lg transition-colors"
                  onClick={resetImage}
                  aria-label="Reset"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button
                  className={`p-2 text-white ${showFilterPanel ? 'bg-primary-700/80' : 'bg-gray-800/80 hover:bg-gray-700/80'} rounded-lg transition-colors`}
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  aria-label="Filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter panel */}
            {showFilterPanel && (
              <div className="p-4 space-y-4 animate-fade-in">
                <div className="grid grid-cols-4 gap-2">
                  {filters.map((f) => (
                    <button
                      key={f.name}
                      className={`p-2 rounded-lg text-center transition-all ${
                        filter === f.value 
                          ? 'bg-primary-700 text-white' 
                          : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
                      }`}
                      onClick={() => setFilter(f.value)}
                      title={f.description}
                    >
                      <div className="text-xs font-medium">{f.name}</div>
                    </button>
                  ))}
                </div>

                {/* Custom adjustments */}
                <div className="space-y-3 pt-3 border-t border-gray-700/30">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-300">Brightness</label>
                      <span className="text-xs text-gray-400">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => {
                        setBrightness(Number(e.target.value));
                        applyCustomFilter();
                      }}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-gray-300">Contrast</label>
                      <span className="text-xs text-gray-400">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={contrast}
                      onChange={(e) => {
                        setContrast(Number(e.target.value));
                        applyCustomFilter();
                      }}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GradingImageViewer;