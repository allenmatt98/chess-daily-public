import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChessPuzzle } from './components/ChessPuzzle';
import { LogIn } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { AuthPrompt } from './components/AuthPrompt';
import { UserStats } from './components/UserStats';
import { Footer } from './components/Footer';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import { getDailyPuzzle, updatePuzzleProgress, getUserStats } from './lib/puzzleService';
import { generateMoveSequence } from './utils/moveGenerator';
import type { Database } from './lib/database.types';
import type { UserStats as UserStatsType } from './lib/puzzleService';

type Puzzle = Database['public']['Tables']['puzzles']['Row'];

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({ rating: 1000, currentStreak: 0, highestStreak: 0 });
  const [nextRotation, setNextRotation] = useState<string | null>(null);
  const { user, setUser } = useAuthStore();
  const lastPollTimeRef = useRef(Date.now());
  const currentPuzzleIdRef = useRef<string | null>(null);

  const fetchPuzzle = useCallback(async (force = false) => {
    try {
      setError(null);
      
      const now = Date.now();
      if (force || now - lastPollTimeRef.current >= POLL_INTERVAL) {
        const { puzzle, next_rotation } = await getDailyPuzzle();
        
        if (puzzle) {
          if (force || !currentPuzzleIdRef.current || puzzle.id !== currentPuzzleIdRef.current) {
            setCurrentPuzzle(puzzle);
            setNextRotation(next_rotation);
            currentPuzzleIdRef.current = puzzle.id;
          }
        } else {
          setError('Failed to load puzzle. Please try again later.');
        }
        lastPollTimeRef.current = now;
      }
    } catch (error) {
      console.error('Error in fetchPuzzle:', error);
      setError('Failed to load puzzle. Please try again later.');
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    let pollInterval: number;

    async function initialFetch() {
      try {
        await fetchPuzzle(true);
      } catch (error) {
        console.error('Error in initial fetch:', error);
      } finally {
        setLoading(false);
      }
    }

    initialFetch();

    pollInterval = window.setInterval(() => {
      fetchPuzzle();
    }, POLL_INTERVAL);

    return () => {
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
    };
  }, [fetchPuzzle]);

  useEffect(() => {
    async function fetchUserStats() {
      if (user) {
        const stats = await getUserStats(user.id);
        if (stats) {
          setUserStats(stats);
        }
      }
    }

    fetchUserStats();
  }, [user]);

  const handlePuzzleComplete = async (timeTaken: number, hintsUsed: number): Promise<UserStatsType | null> => {
    if (!user || !currentPuzzle) return null;
    
    try {
      const stats = await updatePuzzleProgress(
        user.id,
        currentPuzzle.id,
        timeTaken,
        hintsUsed
      );
      
      if (stats) {
        setUserStats({
          rating: stats.rating,
          currentStreak: stats.currentStreak,
          highestStreak: stats.highestStreak
        });
      }
      
      return stats;
    } catch (error) {
      console.error('Error updating progress:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => fetchPuzzle(true)}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentPuzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">No puzzle available</p>
      </div>
    );
  }

  const puzzleData = {
    fen: currentPuzzle.fen,
    pgn: currentPuzzle.pgn,
    metadata: {
      white: currentPuzzle.white,
      black: currentPuzzle.black,
      result: currentPuzzle.result,
      link: currentPuzzle.link,
      difficulty: currentPuzzle.difficulty,
      theme: currentPuzzle.theme,
      puzzleNumber: currentPuzzle.puzzle_number,
      timeLimit: currentPuzzle.time_limit,
      absolute_number: currentPuzzle.absolute_number
    },
    moves: generateMoveSequence(currentPuzzle.fen, currentPuzzle.pgn),
    nextRotation: nextRotation
  };

  return (
    <div className="min-h-screen flex flex-col bg-[--color-background]">
      <header className="border-b border-[--color-border] bg-white/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1A2B4B] rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0.5 border-2 border-white/20 rounded-md"></div>
                <div className="w-8 h-8 text-white transform translate-y-0.5">
                  <svg viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M379 836.4c-20.2 0-39.8 0-59.5 0-29.7-.1-57-22.6-62.8-51.8-1.2-6-1.7-12.2-1.7-18.3 0-148.8 0-297.6 0-446.4 0-15.7 3.8-30 15.9-41.1 9-8.2 19.7-12.1 31.7-13.1 14.6-1.2 29.3.3 43.9-.4 4.8-.2 6.5-1.8 6.4-6.6-.1-7.8 0-15.6.8-23.4 1.3-12.8 10.2-21.7 23.2-22.5 18.2-1.1 30.7 9.7 29.7 27.8-.4 6.5.1 13-.1 19.5-.2 4.1 1.5 5.8 5.5 5.6 38.3-1.3 76.6.4 114.9 0 28.6-.3 57.3-.2 85.9-.2 3.9 0 5.3-1.6 5.2-5.4-.2-6.8-.1-13.7-.1-20.5.1-14.1 10.5-24.7 24.6-24.9 3.3 0 6.7-.3 10 .3 13.5 2.4 21.1 11.7 21.1 25.6 0 6.3.3 12.7-.1 19-.3 4.5 1.7 5.9 5.8 5.8 9-.1 18 0 27-.2 10-.2 19.9-.1 29.7 2.6 19.4 5.3 33.4 22 34.6 41.8 2 33.4.8 67 .8 100.4.2 119.3.1 238.6-.1 358 0 34.3-21 59.5-49.8 66.6-4.4 1.1-8.8 1.8-13.3 1.8-109.5 0-219 0-329 0zm187.3-387.9c-.7 8.6-1.2 17.2-2.2 25.8-.4 2.9.6 4.2 2.8 5.6 7.9 4.9 14.5 11.2 20.1 18.6 25.5 33.5 49 68.5 75.4 101.5 6 7.5 8.1 16.8 6.4 26.4-3 16.5-18.8 31.6-36.4 35-13.4 2.6-25.3 1.2-36-9-11.9-11.4-26.5-17.9-43.4-19.2-6.6-.5-13.3 0-19.9-1.3-8.9-1.7-16.9-5.5-25.1-10.7.3 1.6.3 2.2.5 2.8.5 1.2 1.2 2.4 1.9 3.5 5.5 8.7 12.6 16 21.1 21.8 29.2 20 52.6 45.3 70.8 75.6 12.7 21.2 18.4 43.7 14.7 68.2-.7 4.8.4 5.8 4.8 5.8 27.8-.1 55.7 0 83.5-.1 1.8 0 3.7-.2 5.4-.6 13.7-3.5 22.6-15.2 23-29.6.4-12.3-.9-24.6-.9-36.9-.1-109-.1-218-.1-327 0-7-.1-7-6.8-7-54.1-.2-108.3-.3-162.4-.5-43-.1-85.9-.4-128.9-.5-43.7-.1-87.3 0-131 0-2 0-4 .2-6 .3-3 .2-4.4 1.6-4.3 4.8.1 6.7-.1 13.3-.1 20 0 95.7 0 191.3 0 287 0 11.8.3 23.7-.2 35.5-.4 10.3-1 20.6.4 30.9 1.7 11.8 12.9 23.2 24.4 23.7 12.3.5 24.7.1 37 .2 2.8 0 3.9-1.2 3.9-3.9 0-4.3.5-8.7-.1-13-1.1-8.7 2.2-14.3 9.9-18.6 11.2-6.1 18.8-15.6 20-28.7 1.1-12 -.2-23.8-4.2-35.4-11.4-33-16.9-66.8-13.8-102 1.9-21.3 6.6-41.7 15.2-61.1 22.2-49.9 64-82.3 122.4-82.3 4.3 0 7.1-1.2 9.4-4.9 8.2-13.4 21.1-19 36.1-19.9 7.4-.4 10.7 1.8 11.9 9.1.5 3.1.9 6.2.8 10.4zm55.3-127.9c-.3-1.1-.7-2.2-.9-3.4-.3-1.6.2-3.7-2-4.1-1.9-.3-2.9 1.4-3.8 2.8-3.3 4.9-4.5 10.4-3.2 16.2 3.9 16.7 20.2 28.4 38 27.6 15.7-.7 30.6-14.2 32.5-30.3.8-6.2-1.4-12-6.2-16.4-2.1 1.2-2.4 3-2.6 4.5-1.5 12.4-12.8 20.6-23.5 21.7-13.9 1.4-23-4.5-28.3-18.6zm-269.1-6.8c-1.8-3.7-3.4-.7-4.4.4-5.2 5.5-5.8 12.3-4.1 19.1 4.9 19.2 25.8 30.7 44.6 24.7 13-4.2 21.4-13.2 24.6-26.6 1.9-7.9-1.7-16.3-7.7-18.6-1.8 2.9-1.4 6.4-2.2 9.5-4 15.8-19.4 23.8-33.7 17.3-10.8-4.9-15.8-13.8-17.1-25.8zm206.8 239c5.8-2.3 10.5-8.2 10.1-12.8-.5-6.9-7.8-13.3-14.3-12.6-6.4.7-12.5 7.9-11.7 14 .9 6.6 8.3 13.7 15.9 11.4z"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl brand-text text-[#1A2B4B]">Chess Daily</h1>
                <span className="text-xs text-gray-500 font-medium -mt-0.5">Daily Puzzles</span>
              </div>
            </div>
            
            <div>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>
                  <button
                    onClick={() => useAuthStore.getState().signOut()}
                    className="btn-secondary text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 main-content">
        <div className="mt-4 sm:mt-6">
          <ChessPuzzle 
            puzzle={puzzleData}
            onComplete={handlePuzzleComplete}
          />
        </div>

        {user ? (
          <UserStats {...userStats} />
        ) : (
          <AuthPrompt onSignIn={() => setShowAuthModal(true)} />
        )}
      </main>

      <div className="footer-container">
        <Footer />
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default App;