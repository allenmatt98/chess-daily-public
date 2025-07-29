import React from 'react';
import { Clock, Target } from 'lucide-react';

interface PuzzleHeaderProps {
  puzzleNumber: number;
  objective: string;
  elapsedTime: number;
  hintsUsed: number;
  progressPercentage: number;
  formatTime: (seconds: number) => string;
}

export function PuzzleHeader({ 
  puzzleNumber, 
  objective, 
  elapsedTime, 
  hintsUsed, 
  progressPercentage,
  formatTime 
}: PuzzleHeaderProps) {
  return (
    <div className="card p-4 sm:p-6">
      <div className="text-center mb-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Puzzle #{puzzleNumber}
        </h1>
        <p className="text-sm sm:text-base lg:text-lg" style={{ color: 'var(--color-text-muted)' }}>
          {objective}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border" style={{ 
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)'
        }}>
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          <span className="font-mono text-lg sm:text-xl" style={{ color: 'var(--color-text)' }}>
            {formatTime(elapsedTime)}
          </span>
        </div>
        
        {hintsUsed > 0 && (
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <span className="text-yellow-300 font-medium text-sm sm:text-base">
              {hintsUsed} hint{hintsUsed !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      <div className="w-full rounded-full h-2 sm:h-3" style={{ backgroundColor: 'var(--color-border)' }}>
        <div 
          className="bg-gradient-to-r from-green-500 to-green-400 h-2 sm:h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}