import React from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';

interface UserStatsProps {
  rating: number;
  currentStreak: number;
  highestStreak: number;
}

export function UserStats({ rating, currentStreak, highestStreak }: UserStatsProps) {
  return (
    <div className="card p-4 sm:p-6 grid grid-cols-3 gap-4">
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
        <div className="text-sm text-gray-500">Rating</div>
        <div className="text-xl font-bold text-blue-600">{rating}</div>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="text-sm text-gray-500">Current Streak</div>
        <div className="text-xl font-bold text-yellow-600">{currentStreak}</div>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Star className="w-5 h-5 text-purple-500" />
        </div>
        <div className="text-sm text-gray-500">Best Streak</div>
        <div className="text-xl font-bold text-purple-600">{highestStreak}</div>
      </div>
    </div>
  );
}