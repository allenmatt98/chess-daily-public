import React from 'react';
import { Trophy, Star, TrendingUp, LogIn } from 'lucide-react';
import { getGuestStats } from '../lib/guestStats';

interface AuthPromptProps {
  onSignIn: () => void;
}

export function AuthPrompt({ onSignIn }: AuthPromptProps) {
  const guestStats = getGuestStats();

  return (
    <div className="card p-4 sm:p-5 lg:p-6">
      <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-green-400" />
          </div>
          <div className="stat-label">Current Rating</div>
          <div className="stat-value">{guestStats.rating}</div>
        </div>
        
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-yellow-400" />
          </div>
          <div className="stat-label">Current Streak</div>
          <div className="stat-value text-yellow-400">{guestStats.currentStreak}</div>
        </div>
        
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-purple-400" />
          </div>
          <div className="stat-label">Best Streak</div>
          <div className="stat-value text-purple-400">{guestStats.highestStreak}</div>
        </div>
      </div>

      <div className="text-center">
        <p className="mb-4 sm:mb-5 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Sign in to save your progress and compete with others!
        </p>
        <button
          onClick={onSignIn}
          className="btn-primary flex items-center gap-2 mx-auto px-5 py-3 sm:px-6 sm:py-3.5 text-sm sm:text-base"
        >
          <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Sign In to Save Progress</span>
        </button>
      </div>
    </div>
  );
}