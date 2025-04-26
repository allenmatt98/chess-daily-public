import React from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { getGuestStats } from '../lib/guestStats';

interface AuthPromptProps {
  onSignIn: () => void;
}

export function AuthPrompt({ onSignIn }: AuthPromptProps) {
  const guestStats = getGuestStats();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-6 my-4">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-sm text-gray-500">Current Rating</div>
          <div className="text-xl font-bold text-blue-600">{guestStats.rating}</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-sm text-gray-500">Current Streak</div>
          <div className="text-xl font-bold text-yellow-600">{guestStats.currentStreak}</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Star className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-sm text-gray-500">Best Streak</div>
          <div className="text-xl font-bold text-purple-600">{guestStats.highestStreak}</div>
        </div>
      </div>

      <button
        onClick={onSignIn}
        className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-90 transition-colors"
      >
        Sign In
      </button>
    </div>
  );
}