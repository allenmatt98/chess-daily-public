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
    <div className={`card p-2 sm:p-3 mx-0 sm:mx-0 ${className}`} style={{
      marginTop: '0.75rem', // Increased spacing from chess board
      marginBottom: '0.5rem'
    }}>
      <div className="text-center">
        <button
          onClick={onShowHint}
          className="btn-secondary w-auto mx-auto flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base min-h-[40px] sm:min-h-[44px]"
          disabled={isCompleted}
          style={{
            minWidth: '140px', // Ensure button is always visible and clickable
            maxWidth: '220px'
          }}
        >
          <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Get Hint {hintsUsed > 0 && `(${hintsUsed})`}</span>
        </button>
      </div>
    </div>
  );
}