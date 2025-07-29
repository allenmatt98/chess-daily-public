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
    <div className="card p-3 sm:p-4 lg:p-4">
      <div className="text-center mb-4">
        <h1 className="text-lg sm:text-xl lg:text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          Puzzle #{puzzleNumber}
        </h1>
        <p className="text-sm sm:text-sm lg:text-base" style={{ color: 'var(--color-text-muted)' }}>
          {objective}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ 
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)'
        }}>
          <Clock className="w-4 h-4 text-green-400" />
          <span className="font-mono text-base sm:text-lg" style={{ color: 'var(--color-text)' }}>
            {formatTime(elapsedTime)}
          </span>
        </div>
        
        {hintsUsed > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <Target className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 font-medium text-sm">
              {hintsUsed} hint{hintsUsed !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--color-border)' }}>
        <div 
          className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}