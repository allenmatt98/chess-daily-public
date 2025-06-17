import React from 'react';
import { Trophy, Star, TrendingUp, LogIn } from 'lucide-react';
import { getGuestStats } from '../lib/guestStats';

interface AuthPromptProps {
  onSignIn: () => void;
}

export function AuthPrompt({ onSignIn }: AuthPromptProps) {
  const guestStats = getGuestStats();

  return (
    <div className="card p-3 sm:p-4 lg:p-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-400" />
          </div>
          <div className="stat-label">Current Rating</div>
          <div className="stat-value">{guestStats.rating}</div>
        </div>
        
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-yellow-400" />
          </div>
          <div className="stat-label">Current Streak</div>
          <div className="stat-value text-yellow-400">{guestStats.currentStreak}</div>
        </div>
        
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-400" />
          </div>
          <div className="stat-label">Best Streak</div>
          <div className="stat-value text-purple-400">{guestStats.highestStreak}</div>
        </div>
      </div>

      <div className="text-center">
        <p className="mb-3 sm:mb-4 text-sm sm:text-base" style={{ color: 'var(--color-text-muted)' }}>
          Sign in to save your progress and compete with others!
        </p>
        <button
          onClick={onSignIn}
          className="btn-primary flex items-center gap-2 mx-auto px-4 py-2 sm:px-6 sm:py-3"
        >
          <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Sign In to Save Progress</span>
        </button>
      </div>
    </div>
  );
}