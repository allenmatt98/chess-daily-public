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
  try {
    console.log('Updating puzzle progress:', { 
      userId, 
      puzzleId, 
      timeTaken, 
      hintsUsed,
      timestamp: new Date().toISOString()
    });
    
    const { data: rawData, error } = await supabase
      .rpc('update_puzzle_progress', {
        p_user_id: userId,
        p_puzzle_id: puzzleId,
        p_time_taken: timeTaken,
        p_hints_used: hintsUsed,
        p_completed: true, // Add completed parameter
        p_solution_viewed: false // Add solution_viewed parameter
      });

    if (error) {
      console.error('Error updating puzzle progress:', error);
      throw error;
    }

    console.log('Progress update response:', {
      rawData,
      timestamp: new Date().toISOString()
    });

    if (!rawData) {
      console.error('No data returned from progress update');
      throw new Error('No data returned from progress update');
    }

    // Parse the JSON response if it's a string
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;

    // Check for error message
    if (data.error) {
      return {
        rating: 0,
        currentStreak: 0,
        highestStreak: 0,
        error: data.error,
        canUpdateRating: false
      };
    }

    // Parse and validate the response using camelCase property names
    const parsedStats: UserStats = {
      rating: Number(data.rating),
      currentStreak: Number(data.currentStreak),
      highestStreak: Number(data.highestStreak),
      previousRating: Number(data.previousRating),
      canUpdateRating: data.canUpdateRating
    };

    console.log('Parsed stats:', parsedStats);

    return parsedStats;
  } catch (error) {
    console.error('Error in updatePuzzleProgress:', error);
    return null;
  }
}

export async function getDailyPuzzle(): Promise<PuzzleResponse> {
  try {
    const { data, error } = await supabase
      .rpc('get_daily_puzzle')
      .single();

    if (error) {
      console.error('Error fetching puzzle:', error);
      throw error;
    }

    if (!data || !data.puzzle) {
      throw new Error('No puzzle data returned');
    }

    return {
      puzzle: data.puzzle,
      next_rotation: data.next_rotation
    };
  } catch (error) {
    console.error('Failed to fetch daily puzzle:', error);
    throw error;
  }
}