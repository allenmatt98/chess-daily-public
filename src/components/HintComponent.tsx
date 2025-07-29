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
    <div className={`card p-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-3 flex items-center justify-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          Need Help?
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Get a hint to see the next move or piece to move
        </p>
        <button
          onClick={onShowHint}
          className="btn-secondary w-full flex items-center justify-center gap-2 px-6 py-3"
          disabled={isCompleted}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Get Hint {hintsUsed > 0 && `(${hintsUsed} used)`}</span>
        </button>
      </div>
    </div>
  );
}