import React from 'react';
import { Trophy, Star, TrendingUp, LogIn } from 'lucide-react';
import { getGuestStats } from '../lib/guestStats';

interface AuthPromptProps {
  onSignIn: () => void;
}

export function AuthPrompt({ onSignIn }: AuthPromptProps) {
  const guestStats = getGuestStats();

  return (
    <div className="card p-6">
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div className="stat-label">Current Rating</div>
          <div className="stat-value">{guestStats.rating}</div>
        </div>
        
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="stat-label">Current Streak</div>
          <div className="stat-value text-yellow-400">{guestStats.currentStreak}</div>
        </div>
        
        <div className="stat-card text-center">
          <div className="flex items-center justify-center mb-3">
            <Star className="w-6 h-6 text-purple-400" />
          </div>
          <div className="stat-label">Best Streak</div>
          <div className="stat-value text-purple-400">{guestStats.highestStreak}</div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-slate-300 mb-4">Sign in to save your progress and compete with others!</p>
        <button
          onClick={onSignIn}
          className="btn-primary flex items-center gap-2 mx-auto"
        >
          <LogIn className="w-5 h-5" />
          Sign In to Save Progress
        </button>
      </div>
    </div>
  );
}