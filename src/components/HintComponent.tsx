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
    <div className={`card p-3 ${className}`}>
      <div className="text-center">
        <button
          onClick={onShowHint}
          className="btn-secondary w-auto mx-auto flex items-center justify-center gap-2 px-4 py-2"
          disabled={isCompleted}
        >
          <Lightbulb className="w-4 h-4" />
          <span className="text-sm">Get Hint {hintsUsed > 0 && `(${hintsUsed})`}</span>
        </button>
      </div>
    </div>
  );
}