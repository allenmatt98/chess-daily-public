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
    <div className="card p-3 sm:p-4 lg:p-5 mx-1 sm:mx-0">
      <div className="text-center mb-4 sm:mb-5">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3" style={{ color: 'var(--color-text)' }}>
          Puzzle #{puzzleNumber}
        </h1>
        <p className="text-sm sm:text-base lg:text-lg px-2 sm:px-0 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {objective}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border" style={{ 
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)'
        }}>
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          <span className="font-mono text-sm sm:text-base lg:text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            {formatTime(elapsedTime)}
          </span>
        </div>
        
        {hintsUsed > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            <span className="text-yellow-300 font-medium text-sm sm:text-base">
              {hintsUsed} hint{hintsUsed !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      <div className="w-full rounded-full h-2 sm:h-2.5 mx-1 sm:mx-0" style={{ backgroundColor: 'var(--color-border)' }}>
        <div 
          className="bg-gradient-to-r from-green-500 to-green-400 h-2 sm:h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}