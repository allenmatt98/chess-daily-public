import { ChessMove } from '../types';

interface PuzzleCompletion {
  puzzleId: string;
  completedAt: string;
  timeTaken: number;
  hintsUsed: number;
  moves: ChessMove[];
}

const STORAGE_KEY = 'puzzle_completions';

export function savePuzzleCompletion(
  puzzleId: string,
  timeTaken: number,
  hintsUsed: number,
  moves: ChessMove[]
): void {
  try {
    const completion: PuzzleCompletion = {
      puzzleId,
      completedAt: new Date().toISOString(),
      timeTaken,
      hintsUsed,
      moves
    };

    localStorage.setItem(
      `${STORAGE_KEY}_${puzzleId}`,
      JSON.stringify(completion)
    );
  } catch (error) {
    console.error('Error saving puzzle completion:', error);
  }
}

export function getPuzzleCompletion(puzzleId: string): PuzzleCompletion | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${puzzleId}`);
    if (!stored) return null;

    const completion = JSON.parse(stored) as PuzzleCompletion;

    // Validate the completion data
    if (
      !completion.puzzleId ||
      !completion.completedAt ||
      typeof completion.timeTaken !== 'number' ||
      typeof completion.hintsUsed !== 'number' ||
      !Array.isArray(completion.moves)
    ) {
      console.warn('Invalid completion data found:', completion);
      return null;
    }

    // Check if completion is from today
    const completedDate = new Date(completion.completedAt);
    const today = new Date();
    if (completedDate.toDateString() !== today.toDateString()) {
      localStorage.removeItem(`${STORAGE_KEY}_${puzzleId}`);
      return null;
    }

    return completion;
  } catch (error) {
    console.error('Error getting puzzle completion:', error);
    return null;
  }
}

export function clearOldCompletions(): void {
  try {
    const now = new Date();
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (!key.startsWith(STORAGE_KEY)) continue;

      const stored = localStorage.getItem(key);
      if (!stored) continue;

      try {
        const completion = JSON.parse(stored) as PuzzleCompletion;
        const completedDate = new Date(completion.completedAt);
        
        // Remove completions older than today
        if (completedDate.toDateString() !== now.toDateString()) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // If the data is invalid, remove it
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error clearing old completions:', error);
  }
}