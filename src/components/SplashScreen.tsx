"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after a brief delay
    const showTimer = setTimeout(() => setShowContent(true), 300);
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Complete after progress reaches 100%
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + Math.random() * 15 + 5; // Random progress increments
      });
    }, 200);

    return () => {
      clearTimeout(showTimer);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center z-50">
      <div className="text-center text-white">
        {/* App Icon/Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <div className="text-4xl">🎯</div>
          </div>
        </div>

        {/* App Name */}
        {showContent && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Fun Tes</h1>
            <p className="text-lg opacity-90 mb-8">Token Price Prediction Game</p>
          </div>
        )}

        {/* Loading Progress */}
        {showContent && (
          <div className="animate-fade-in-up">
            <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm opacity-80">
              {progress < 30 && "Loading trending tokens..."}
              {progress >= 30 && progress < 60 && "Analyzing market data..."}
              {progress >= 60 && progress < 90 && "Preparing game interface..."}
              {progress >= 90 && "Ready to play! 🚀"}
            </p>
          </div>
        )}

        {/* Loading Animation */}
        {!showContent && (
          <div className="animate-pulse">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </div>

      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-500"></div>
      </div>
    </div>
  );
} 