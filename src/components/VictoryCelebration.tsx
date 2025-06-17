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
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={200}
        gravity={0.3}
        colors={['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d']}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="victory-text-container">
          <h2 className="text-4xl sm:text-6xl font-bold text-green-400 tracking-wider mb-4 text-center animate-pulse-green">
            VICTORY!
          </h2>
          
          {showSummary && (
            <div className="pointer-events-auto card p-6 max-w-md sm:max-w-lg w-full mx-4 animate-scale-up">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-slate-400 text-sm">Time to Solve</p>
                  <p className="text-3xl font-bold text-slate-100">{formatTime(elapsedTime)}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="stat-card text-center">
                    <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="stat-label">Streak</p>
                    <p className="stat-value text-yellow-400">{streak}</p>
                  </div>

                  <div className="stat-card text-center">
                    <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="stat-label">Rating Change</p>
                    <p className={`stat-value ${ratingChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {ratingChange >= 0 ? '+' : ''}{ratingChange}
                    </p>
                  </div>

                  <div className="stat-card text-center">
                    <Star className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="stat-label">New Rating</p>
                    <p className="stat-value text-purple-400">{rating}</p>
                  </div>
                </div>

                {shareGridData && (
                  <div className="space-y-3">
                    <p className="text-slate-300 text-center font-medium">Share your victory!</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleShare}
                        className="btn-secondary flex items-center justify-center gap-2"
                        aria-label="Copy share text"
                      >
                        <Clipboard className="w-4 h-4" /> Copy
                      </button>
                      <button
                        onClick={() => {
                          const tweet = encodeURIComponent(shareGridData);
                          window.open(`https://twitter.com/intent/tweet?text=${tweet}`, '_blank');
                        }}
                        className="btn-secondary flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        aria-label="Share on Twitter"
                      >
                        <Twitter className="w-4 h-4" /> Share
                      </button>
                    </div>
                    {copied && (
                      <div className="text-green-400 text-sm text-center animate-fade-in">
                        Copied to clipboard!
                      </div>
                    )}
                  </div>
                )}

                {!user && (
                  <div className="border-t border-slate-700 pt-6">
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        handleClose();
                      }}
                      className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                    >
                      <LogIn className="w-5 h-5" />
                      Sign up to save your progress
                    </button>
                    <p className="text-sm text-slate-400 text-center mt-2">
                      Create an account to track your rating and streaks
                    </p>
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className={`w-full ${user ? 'btn-primary' : 'btn-secondary'} py-3 font-semibold`}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}