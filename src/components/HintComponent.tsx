import React from 'react';
import { Lightbulb } from 'lucide-react';

interface HintComponentProps {
  onShowHint: () => void;
  hintsUsed: number;
  isCompleted: boolean;
  className?: string;
}

export function HintComponent({ onShowHint, hintsUsed, isCompleted, className = '' }: HintComponentProps) {
  return (
    <div className={`card p-2 sm:p-3 mx-1 sm:mx-0 ${className}`} style={{
      marginTop: '0.5rem', // Ensure proper spacing from chess board
      marginBottom: '0.5rem'
    }}>
      <div className="text-center">
        <button
          onClick={onShowHint}
          className="btn-secondary w-auto mx-auto flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm min-h-[36px] sm:min-h-[40px]"
          disabled={isCompleted}
          style={{
            minWidth: '120px', // Ensure button is always visible and clickable
            maxWidth: '200px'
          }}
        >
          <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Get Hint {hintsUsed > 0 && `(${hintsUsed})`}</span>
        </button>
      </div>
    </div>
  );
}