import type { Square } from 'chess.js';
import type { UserStats } from './lib/puzzleService';
import type { Database } from './lib/database.types';

export type ChessPuzzle = Database['public']['Tables']['puzzles']['Row'] & {
  id: string;
  moves: ChessMove[];
  nextRotation?: string;
  metadata?: {
    white: string;
    black: string;
    result: string;
    link?: string;
    difficulty?: number;
    theme?: string;
    puzzleNumber: number;
    timeLimit: number;
    absolute_number: number;
  };
};

export interface ChessMove {
  from: Square;
  to: Square;
  promotion?: string;
}

export interface ChessPuzzleProps {
  puzzle: ChessPuzzle;
  onComplete?: (timeTaken: number, hintsUsed: number) => Promise<UserStats | null>;
}

export interface GuestPuzzleTime {
  puzzleId: string;
  timeTaken: number;
  solvedAt: string;
}