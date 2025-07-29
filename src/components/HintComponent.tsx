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
      <div className="text-center">
        <h3 className="text-base font-semibold mb-2 flex items-center justify-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          Need Help?
        </h3>
        <p className="text-xs sm:text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Get a hint to see the next move or piece to move
        </p>
        <button
          onClick={onShowHint}
          className="btn-secondary w-full flex items-center justify-center gap-2 px-4 py-2"
          disabled={isCompleted}
        >
          <Lightbulb className="w-4 h-4" />
          <span className="text-sm">Get Hint {hintsUsed > 0 && `(${hintsUsed} used)`}</span>
        </button>
      </div>
    </div>
  );
}