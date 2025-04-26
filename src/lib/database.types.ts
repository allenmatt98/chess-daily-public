export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      puzzles: {
        Row: {
          id: string
          fen: string
          pgn: string
          white: string
          black: string
          result: string
          link: string | null
          created_at: string
          difficulty: number
          date_assigned: string | null
          theme: string | null
          times_solved: number
          avg_time: number
          puzzle_number: number
          time_limit: number
          absolute_number: number
        }
        Insert: {
          id?: string
          fen: string
          pgn: string
          white: string
          black: string
          result: string
          link?: string | null
          created_at?: string
          difficulty?: number
          date_assigned?: string | null
          theme?: string | null
          times_solved?: number
          avg_time?: number
          puzzle_number?: number
          time_limit?: number
          absolute_number?: number
        }
        Update: {
          id?: string
          fen?: string
          pgn?: string
          white?: string
          black?: string
          result?: string
          link?: string | null
          created_at?: string
          difficulty?: number
          date_assigned?: string | null
          theme?: string | null
          times_solved?: number
          avg_time?: number
          puzzle_number?: number
          time_limit?: number
          absolute_number?: number
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          puzzle_id: string
          completed: boolean
          time_taken: number | null
          attempts: number
          completed_at: string | null
          created_at: string
          rating: number
          current_streak: number
          highest_streak: number
          hints_used: number
          solution_viewed: boolean
        }
        Insert: {
          id?: string
          user_id: string
          puzzle_id: string
          completed?: boolean
          time_taken?: number | null
          attempts?: number
          completed_at?: string | null
          created_at?: string
          rating?: number
          current_streak?: number
          highest_streak?: number
          hints_used?: number
          solution_viewed?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          puzzle_id?: string
          completed?: boolean
          time_taken?: number | null
          attempts?: number
          completed_at?: string | null
          created_at?: string
          rating?: number
          current_streak?: number
          highest_streak?: number
          hints_used?: number
          solution_viewed?: boolean
        }
      }
    }
    Functions: {
      get_daily_puzzle: {
        Args: Record<string, never>
        Returns: Database['public']['Tables']['puzzles']['Row'][]
      }
      calculate_puzzle_score: {
        Args: { completion_time: number }
        Returns: number
      }
      calculate_streak_multiplier: {
        Args: { streak: number }
        Returns: number
      }
      update_user_rating: {
        Args: {
          user_id_param: string
          puzzle_id_param: string
          completion_time_param: number
        }
        Returns: number
      }
    }
  }
}