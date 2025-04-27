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
      p_hints_used: hintsUsed,
      p_completed: true,
      p_solution_viewed: false
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