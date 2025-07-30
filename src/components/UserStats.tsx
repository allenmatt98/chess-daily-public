import React from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';

interface UserStatsProps {
  rating: number;
  currentStreak: number;
  highestStreak: number;
}

export function UserStats({ rating, currentStreak, highestStreak }: UserStatsProps) {
  return (
    <div className="card p-3 sm:p-4 lg:p-6 grid grid-cols-3 gap-2 sm:gap-3 lg:gap-6">
      <div className="stat-card text-center">
        <div className="flex items-center justify-center mb-2 sm:mb-3">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-green-400" />
        </div>
        <div className="stat-label">Rating</div>
        <div className="stat-value">{rating}</div>
      </div>
      
      <div className="stat-card text-center">
        <div className="flex items-center justify-center mb-2 sm:mb-3">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-yellow-400" />
        </div>
        <div className="stat-label">Current Streak</div>
        <div className="stat-value text-yellow-400">{currentStreak}</div>
      </div>
      
      <div className="stat-card text-center">
        <div className="flex items-center justify-center mb-2 sm:mb-3">
          <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-purple-400" />
        </div>
        <div className="stat-label">Best Streak</div>
        <div className="stat-value text-purple-400">{highestStreak}</div>
      </div>
    </div>
  );
}