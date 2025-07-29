import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ChessPuzzle } from './components/ChessPuzzle';
import { LogIn } from 'lucide-react';
import { AuthModal } from './components/AuthModal';
import { AuthPrompt } from './components/AuthPrompt';
import { UserStats } from './components/UserStats';
import { Footer } from './components/Footer';
import { useAuthStore } from './store/authStore';
import { useTheme } from './hooks/useTheme';
import { supabase } from './lib/supabase';
import { getDailyPuzzle, updatePuzzleProgress, getUserStats } from './lib/puzzleService';
import { generateMoveSequence } from './utils/moveGenerator';
import type { Database } from './lib/database.types';
import type { UserStats as UserStatsType } from './lib/puzzleService';
import type { ChessPuzzle as ChessPuzzleType } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { useNavigate } from 'react-router-dom';
import { HiddenGemsSection } from './components/HiddenGemsSection';

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
  const { isDarkMode } = useTheme(); // Initialize theme
  const lastPollTimeRef = useRef(Date.now());
  const currentPuzzleIdRef = useRef<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const navigate = useNavigate();

  // Auto-show How to Play for first-time guest users
  useEffect(() => {
    if (!user && !localStorage.getItem('hasSeenHowToPlay')) {
      setShowHowToPlay(true);
    }
  }, [user]);

  const fetchPuzzle = useCallback(async (force = false) => {
    try {
      setError(null);
      setLoading(true);
      
      const now = Date.now();
      if (force || now - lastPollTimeRef.current >= POLL_INTERVAL) {
        const response = await getDailyPuzzle();
        console.log('Fetched puzzle data:', response); // Debug log
        
        if (response.puzzle && response.puzzle.fen && response.puzzle.pgn) {
          if (force || !currentPuzzleIdRef.current || response.puzzle.id !== currentPuzzleIdRef.current) {
            console.log('Setting new puzzle:', response.puzzle); // Debug log
            setCurrentPuzzle(response.puzzle);
            setNextRotation(response.next_rotation);
            currentPuzzleIdRef.current = response.puzzle.id;
          }
        } else {
          console.error('Invalid puzzle data:', response);
          setError('Invalid puzzle data received. Please try again later.');
        }
        lastPollTimeRef.current = now;
      }
    } catch (error) {
      console.error('Error in fetchPuzzle:', error);
      setError('Failed to load puzzle. Please try again later.');
    } finally {
      setLoading(false);
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
      await fetchPuzzle(true);
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
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
    console.log('No current puzzle available'); // Debug log
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>No puzzle available</p>
      </div>
    );
  }

  console.log('Creating puzzleData from:', currentPuzzle); // Debug log
  const puzzleData: ChessPuzzleType = {
    id: currentPuzzle.id,
    fen: currentPuzzle.fen,
    pgn: currentPuzzle.pgn,
    white: currentPuzzle.white,
    black: currentPuzzle.black,
    result: currentPuzzle.result,
    link: currentPuzzle.link,
    created_at: currentPuzzle.created_at,
    difficulty: currentPuzzle.difficulty,
    date_assigned: currentPuzzle.date_assigned,
    theme: currentPuzzle.theme,
    times_solved: currentPuzzle.times_solved,
    avg_time: currentPuzzle.avg_time,
    puzzle_number: currentPuzzle.puzzle_number,
    time_limit: currentPuzzle.time_limit,
    absolute_number: currentPuzzle.absolute_number,
    moves: generateMoveSequence(currentPuzzle.fen, currentPuzzle.pgn),
    nextRotation: nextRotation || undefined,
    metadata: {
      white: currentPuzzle.white,
      black: currentPuzzle.black,
      result: currentPuzzle.result,
      link: currentPuzzle.link || undefined,
      difficulty: currentPuzzle.difficulty || undefined,
      theme: currentPuzzle.theme || undefined,
      puzzleNumber: currentPuzzle.puzzle_number,
      timeLimit: currentPuzzle.time_limit,
      absolute_number: currentPuzzle.absolute_number
    }
  };
  console.log('Generated puzzleData:', puzzleData); // Debug log

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--color-background)' }}>
        <Header
          onHowToPlay={() => setShowHowToPlay(true)}
          onSignIn={() => setShowAuthModal(true)}
          onSignOut={() => { useAuthStore.getState().signOut(); }}
          onLogoClick={() => navigate('/')}
          leftActions={
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-border)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => navigate('/historical-puzzles')}
              >
                Puzzle Archives
              </button>
              <button
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-border)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => navigate('/articles')}
              >
                Chess Stories
              </button>
            </div>
          }
        />
        <main className="flex-1 main-content">
          <div className="mt-2 sm:mt-4 lg:mt-4">
            <ChessPuzzle 
              puzzle={puzzleData}
              onComplete={handlePuzzleComplete}
            />
          </div>

          {/* Hidden Gems Section */}
          <div className="mt-6 sm:mt-8 lg:mt-8">
            <HiddenGemsSection />
          </div>
        </main>

        <div className="footer-container">
          <Footer />
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />

        {showHowToPlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="card max-w-md w-full p-6 relative animate-fade-in mx-4">
              <button
                className="absolute top-3 right-3 text-2xl font-bold focus:outline-none transition-colors duration-200"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                  e.currentTarget.style.color = 'var(--color-text)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
                onClick={() => {
                  setShowHowToPlay(false);
                  localStorage.setItem('hasSeenHowToPlay', '1');
                }}
                aria-label="Close How to Play"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>How to Play</h2>
              <ol className="list-decimal list-inside space-y-2 mb-4" style={{ color: 'var(--color-text)' }}>
                <li>Play the right moves to checkmate the opponent's king.</li>
                <li>
                  <span className="font-semibold">Emoji meanings:</span>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li><span className="text-2xl align-middle">🟩</span> Correct move</li>
                    <li><span className="text-2xl align-middle">🟨</span> Right piece, wrong square</li>
                    <li><span className="text-2xl align-middle">🟥</span> Wrong move or piece</li>
                    <li><span className="text-2xl align-middle">🏳️</span> Used a hint</li>
                  </ul>
                </li>
                <li>
                  <span className="font-semibold">Rating:</span> Your rating increases more if you solve quickly and use fewer hints. Faster solves and fewer hints = higher rating!
                </li>
                <li>New puzzles every day. Come back daily to keep your streak going!</li>
              </ol>
              <div className="flex justify-end">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-600 transition-all text-sm"
                  onClick={() => {
                    setShowHowToPlay(false);
                    localStorage.setItem('hasSeenHowToPlay', '1');
                  }}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;