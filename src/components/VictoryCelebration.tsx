import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import useSound from 'use-sound';
import { Trophy, Star, TrendingUp, LogIn } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface VictoryCelebrationProps {
  onComplete?: () => void;
  elapsedTime: number;
  streak?: number;
  rating: number;
  ratingChange: number;
}

export function VictoryCelebration({ 
  onComplete, 
  elapsedTime, 
  streak = 0,
  rating,
  ratingChange
}: VictoryCelebrationProps) {
  const [isActive, setIsActive] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [play] = useSound('/victory.mp3', { 
    volume: 0.5,
    interrupt: true 
  });
  const { user, setShowAuthModal } = useAuthStore();

  // Play sound and show confetti immediately
  useEffect(() => {
    // Attempt to play sound multiple times in case of loading delay
    const playAttempts = [0, 100, 200].map(delay => 
      setTimeout(() => play(), delay)
    );
    
    // Show summary after initial celebration
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

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        recycle={false}
        numberOfPieces={200}
        gravity={0.3}
        colors={['#FFD700', '#FFA500', '#FF6347', '#4169E1', '#32CD32']}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="victory-text-container">
          <h2 className="victory-text text-4xl sm:text-6xl font-bold text-yellow-500 tracking-wider mb-4 text-center">
            VICTORY!
          </h2>
          
          {showSummary && (
            <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-2 border-yellow-500/30 max-w-sm w-full mx-4 transform scale-up">
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-gray-600 text-sm">Time to Solve</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(elapsedTime)}</p>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-gray-600 text-sm">Daily Streak</p>
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <p className="text-2xl font-bold text-gray-900">{streak} {streak === 1 ? 'day' : 'days'}</p>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-gray-600 text-sm">Rating Change</p>
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <p className="text-2xl font-bold text-gray-900">
                      <span className={ratingChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {ratingChange >= 0 ? '+' : ''}{ratingChange}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-gray-600 text-sm">Current Rating</p>
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-5 h-5 text-purple-500" />
                    <p className="text-2xl font-bold text-gray-900">{rating}</p>
                  </div>
                </div>

                {!user && (
                  <div className="mt-6 -mb-2">
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        handleClose();
                      }}
                      className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      Sign up to save your progress
                    </button>
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Create an account to track your rating and streaks
                    </p>
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className={`w-full ${user ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' : 'bg-gray-200'} text-${user ? 'white' : 'gray-700'} font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-${user ? '0' : '4'}`}
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