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
    <div className="card p-3 sm:p-4">
      <div className="text-center mb-3">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Puzzle #{puzzleNumber}
        </h1>
        <p className="text-xs sm:text-sm lg:text-base" style={{ color: 'var(--color-text-muted)' }}>
          {objective}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border" style={{ 
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)'
        }}>
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
          <span className="font-mono text-sm sm:text-base lg:text-lg" style={{ color: 'var(--color-text)' }}>
            {formatTime(elapsedTime)}
          </span>
        </div>
        
        {hintsUsed > 0 && (
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
            <span className="text-yellow-300 font-medium text-xs sm:text-sm">
              {hintsUsed} hint{hintsUsed !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      <div className="w-full rounded-full h-1.5 sm:h-2" style={{ backgroundColor: 'var(--color-border)' }}>
        <div 
          className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}