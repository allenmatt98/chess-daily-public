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
    <div className={`card p-3 sm:p-4 ${className}`}>
      <button
        onClick={onShowHint}
        className="btn-secondary w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        disabled={isCompleted}
        aria-label={`Get hint${hintsUsed > 0 ? ` (${hintsUsed} used)` : ''}`}
      >
        <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-sm sm:text-base font-medium">
          Hint{hintsUsed > 0 && ` (${hintsUsed})`}
        </span>
      </button>
    </div>
  );
}