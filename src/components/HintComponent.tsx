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
    <div className={`card p-2 sm:p-3 mx-1 sm:mx-0 ${className}`}>
      <div className="text-center">
        <button
          onClick={onShowHint}
          className="btn-secondary w-auto mx-auto flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
          disabled={isCompleted}
        >
          <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Get Hint {hintsUsed > 0 && `(${hintsUsed})`}</span>
        </button>
      </div>
    </div>
  );
}