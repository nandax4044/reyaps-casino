import React, { useState, useEffect } from 'react';

interface FishingCharacterAnimationProps {
  isActive: boolean;
  className?: string;
}

export function FishingCharacterAnimation({ isActive, className = '' }: FishingCharacterAnimationProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // Animation frames
  const frames = [
    '/f1f.png', // Idle
    '/f2f.png', // Casting
    '/f3f.png'  // Waiting
  ];

  // Cycle through frames when active
  useEffect(() => {
    if (!isActive) {
      setCurrentFrame(0); // Reset to idle when not active
      return;
    }

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, 500); // Change frame every 500ms

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className={`relative ${className}`}>
      {/* Character animation */}
      <img
        src={frames[currentFrame]}
        alt="Fishing Character"
        className="w-64 h-64 object-contain transition-opacity duration-300"
        onError={(e) => {
          // Fallback to placeholder if image not found
          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect fill="%2394a3b8" width="256" height="256"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="48"%3E🎣%3C/text%3E%3C/svg%3E';
        }}
      />
      
      {/* Status indicator */}
      {isActive && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/50 rounded-full px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-400 text-sm font-bold">Fishing...</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Water ripple effect */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-400/50 animate-pulse"></div>
        </div>
      )}
    </div>
  );
}

// Fallback component if images not available
export function FishingCharacterPlaceholder({ isActive, className = '' }: FishingCharacterAnimationProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-64 h-64 bg-gradient-to-b from-sky-400 to-blue-600 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className={`text-8xl ${isActive ? 'animate-bounce' : ''}`}>
            🎣
          </div>
          {isActive && (
            <p className="text-white font-bold mt-4 animate-pulse">
              Fishing...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
