import { supabase } from './supabase';
import type { Database } from './database.types';

type Puzzle = Database['public']['Tables']['puzzles']['Row'];

interface PuzzleResponse {
  puzzle: Puzzle;
  next_rotation: string;
}

export interface UserStats {
  rating: number;
  currentStreak: number;
  highestStreak: number;
  previousRating?: number;
  error?: string;
  canUpdateRating?: boolean;
}

export interface PuzzleWithProgress extends Puzzle {
  solved: boolean;
  bestTime?: number;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('rating, current_streak, highest_streak')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching user stats:', error);
      return { rating: 1000, currentStreak: 0, highestStreak: 0 };
    }

    return {
      rating: data?.rating ?? 1000,
      currentStreak: data?.current_streak ?? 0,
      highestStreak: data?.highest_streak ?? 0
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return { rating: 1000, currentStreak: 0, highestStreak: 0 };
  }
}

export async function updatePuzzleProgress(
  userId: string,
  puzzleId: string,
  timeTaken: number,
  hintsUsed: number
): Promise<UserStats | null> {
  console.log('Updating puzzle progress:', {
    userId,
    puzzleId,
    timeTaken,
    hintsUsed,
    timestamp: new Date().toISOString()
  });

  try {
    const { data, error } = await supabase.rpc('update_puzzle_progress', {
      p_user_id: userId,
      p_puzzle_id: puzzleId,
      p_time_taken: timeTaken,
      p_hints_used: hintsUsed
    });

    if (error) {
      console.error('Error updating puzzle progress:', error);
      return null;
    }

    return data as UserStats;
  } catch (error) {
    console.error('Error in updatePuzzleProgress:', error);
    return null;
  }
}

export async function updateHistoricalPuzzleProgress(
  userId: string,
  puzzleId: string,
  timeTaken: number,
  hintsUsed: number
): Promise<UserStats | null> {
  console.log('Updating historical puzzle progress:', {
    userId,
    puzzleId,
    timeTaken,
    hintsUsed,
    timestamp: new Date().toISOString()
  });

  try {
    const { data, error } = await supabase.rpc('update_historical_puzzle_progress', {
      p_user_id: userId,
      p_puzzle_id: puzzleId,
      p_time_taken: timeTaken,
      p_hints_used: hintsUsed
    });

    if (error) {
      console.error('Error updating historical puzzle progress:', error);
      return null;
    }

    return data as UserStats;
  } catch (error) {
    console.error('Error in updateHistoricalPuzzleProgress:', error);
    return null;
  }
}

export async function getDailyPuzzle(): Promise<PuzzleResponse> {
  try {
    const { data, error } = await supabase
      .rpc('get_daily_puzzle');

    if (error) {
      console.error('Error getting daily puzzle:', error);
      throw error;
    }

    console.log('Daily puzzle data:', data); // Debug log

    // Get first puzzle from the array
    const puzzleData = Array.isArray(data) && data.length > 0 ? data[0] : null;
    
    if (!puzzleData) {
      throw new Error('No puzzle available');
    }

    // Extract the actual puzzle from the nested structure
    const puzzle = puzzleData.puzzle;

    // Validate required fields
    if (!puzzle?.fen || !puzzle?.pgn) {
      console.error('Invalid puzzle data - missing required fields:', puzzleData);
      throw new Error('Invalid puzzle data - missing required fields');
    }

    // Get next rotation time
    const { data: rotationData, error: rotationError } = await supabase
      .rpc('get_next_interval_change')
      .single();

    if (rotationError) {
      console.error('Error getting next rotation:', rotationError);
      throw rotationError;
    }

    return {
      puzzle: puzzle as Puzzle,
      next_rotation: rotationData as string
    };
  } catch (error) {
    console.error('Error in getDailyPuzzle:', error);
    throw error;
  }
}

export async function getAllPuzzlesWithProgress(userId: string): Promise<PuzzleWithProgress[]> {
  // Fetch all puzzles
  const { data: puzzles, error: puzzlesError } = await supabase
    .from('puzzles')
    .select('*')
    .order('absolute_number', { ascending: true });

  if (puzzlesError || !puzzles) {
    console.error('Error fetching puzzles:', puzzlesError);
    return [];
  }

  // Fetch user progress for all puzzles
  const { data: progress, error: progressError } = await supabase
    .from('user_progress')
    .select('puzzle_id, completed, time_taken')
    .eq('user_id', userId);

  if (progressError) {
    console.error('Error fetching user progress:', progressError);
    // Still return puzzles, but mark all as unsolved
    return puzzles.map(p => ({ ...p, solved: false }));
  }

  // Map progress by puzzle_id for quick lookup
  const progressMap = new Map(progress.map((p: any) => [p.puzzle_id, p]));

  // Merge puzzles with progress
  return puzzles.map(puzzle => {
    const prog = progressMap.get(puzzle.id);
    return {
      ...puzzle,
      solved: !!prog?.completed,
      bestTime: prog?.time_taken ?? undefined
    };
  });
}