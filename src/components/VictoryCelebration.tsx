import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import useSound from 'use-sound';
import { Trophy, Star, TrendingUp, LogIn, Twitter, Instagram, Download, Clipboard, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import html2canvas from 'html2canvas';

interface VictoryCelebrationProps {
  onComplete?: () => void;
  elapsedTime: number;
  streak?: number;
  rating: number;
  ratingChange: number;
  shareGridData?: string;
}

export function VictoryCelebration({ 
  onComplete, 
  elapsedTime, 
  streak = 0,
  rating,
  ratingChange,
  shareGridData
}: VictoryCelebrationProps) {
  const [isActive, setIsActive] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [play] = useSound('/victory.mp3', { 
    volume: 0.5,
    interrupt: true 
  });
  const { user, setShowAuthModal } = useAuthStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const playAttempts = [0, 100, 200].map(delay => 
      setTimeout(() => play(), delay)
    );
    
    const summaryTimer = setTimeout(() => {
      setShowSummary(true);
    }, 1000);

    return () => {
      playAttempts.forEach(clearTimeout);
      clearTimeout(summaryTimer);
    };
  }, [play]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    setIsActive(false);
    onComplete?.();
  };

  const handleShare = async () => {
    if (!shareGridData) return;
    try {
      await navigator.clipboard.writeText(shareGridData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 lg:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={200}
        gravity={0.3}
        colors={['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d']}
      />
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="victory-text-container mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-green-400 tracking-wider text-center animate-pulse-green">
            VICTORY!
          </h2>
        </div>
        
        {showSummary && (
          <div className="card p-4 sm:p-5 lg:p-6 w-full animate-scale-up relative max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-200 transition-colors z-10"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
              <div className="text-center space-y-2 sm:space-y-3">
                <p className="text-slate-400 text-sm sm:text-base">Time to Solve</p>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-100">{formatTime(elapsedTime)}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                <div className="stat-card text-center p-3 sm:p-4">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-yellow-400 mx-auto mb-2 sm:mb-3" />
                  <p className="stat-label text-sm">Streak</p>
                  <p className="stat-value text-yellow-400 text-sm sm:text-base lg:text-lg">{streak}</p>
                </div>

                <div className="stat-card text-center p-3 sm:p-4">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-green-400 mx-auto mb-2 sm:mb-3" />
                  <p className="stat-label text-sm">Rating Change</p>
                  <p className={`stat-value text-sm sm:text-base lg:text-lg ${ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {ratingChange >= 0 ? '+' : ''}{ratingChange}
                  </p>
                </div>

                <div className="stat-card text-center p-3 sm:p-4">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-purple-400 mx-auto mb-2 sm:mb-3" />
                  <p className="stat-label text-sm">New Rating</p>
                  <p className="stat-value text-purple-400 text-sm sm:text-base lg:text-lg">{rating}</p>
                </div>
              </div>

              {shareGridData && (
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-slate-300 text-center font-medium text-sm sm:text-base lg:text-lg">Share your victory!</p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <button
                      onClick={handleShare}
                      className="btn-secondary flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base py-2.5 sm:py-3"
                      aria-label="Copy share text"
                    >
                      <Clipboard className="w-4 h-4 sm:w-5 sm:h-5" /> Copy
                    </button>
                    <button
                      onClick={() => {
                        const tweet = encodeURIComponent(shareGridData);
                        window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank');
                      }}
                      className="btn-secondary flex items-center justify-center gap-2 sm:gap-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base py-2.5 sm:py-3"
                      aria-label="Share on Twitter"
                    >
                      <Twitter className="w-4 h-4 sm:w-5 sm:h-5" /> Share
                    </button>
                  </div>
                  {copied && (
                    <div className="text-green-400 text-sm sm:text-base text-center animate-fade-in">
                      Copied to clipboard!
                    </div>
                  )}
                </div>
              )}

              {!user && (
                <div className="border-t border-slate-700 pt-4 sm:pt-5 lg:pt-6">
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      handleClose();
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-3.5 text-sm sm:text-base lg:text-lg"
                  >
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    Sign up to save your progress
                  </button>
                  <p className="text-sm sm:text-base text-slate-400 text-center mt-3 sm:mt-4">
                    Create an account to track your rating and streaks
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className={`w-full ${user ? 'btn-primary' : 'btn-secondary'} py-3 sm:py-3.5 font-semibold text-sm sm:text-base lg:text-lg`}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}