import React, { useEffect, useState } from 'react';
import { getAllPuzzlesWithProgress, PuzzleWithProgress } from '../lib/puzzleService';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useTheme } from '../hooks/useTheme';
import { CheckCircle, Clock, Trophy } from 'lucide-react';

const miniBoard = (fen: string, isDarkMode: boolean) => {
  return (
    <div className="flex justify-center mb-3">
      <Chessboard
        position={fen}
        boardWidth={120}
        arePiecesDraggable={false}
        areArrowsAllowed={false}
        boardOrientation="white"
        customBoardStyle={{ 
          boxShadow: 'none', 
          borderRadius: '8px',
          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`
        }}
        customDarkSquareStyle={{ 
          backgroundColor: isDarkMode ? '#475569' : '#64748b'
        }}
        customLightSquareStyle={{ 
          backgroundColor: isDarkMode ? '#cbd5e1' : '#f1f5f9'
        }}
      />
    </div>
  );
};

export default function HistoricalPuzzles() {
  const [puzzles, setPuzzles] = useState<PuzzleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    setLoading(true);
    if (user) {
      getAllPuzzlesWithProgress(user.id)
        .then(setPuzzles)
        .finally(() => setLoading(false));
    } else {
      import('../lib/supabase').then(({ supabase }) => {
        supabase
          .from('puzzles')
          .select('*')
          .order('absolute_number', { ascending: true })
          .then(({ data, error }) => {
            if (error || !data) {
              setPuzzles([]);
            } else {
              setPuzzles(data.map((p: any) => ({ ...p, solved: false })));
            }
            setLoading(false);
          });
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--color-background)' }}>
        <Header
          onHowToPlay={() => navigate('/how-to-play')}
          onSignIn={() => navigate('/auth/callback')}
          onSignOut={() => { useAuthStore.getState().signOut(); navigate('/'); }}
          onLogoClick={() => navigate('/')}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--color-background)' }}>
      <Header
        onHowToPlay={() => navigate('/how-to-play')}
        onSignIn={() => navigate('/auth/callback')}
        onSignOut={() => { useAuthStore.getState().signOut(); navigate('/'); }}
        onLogoClick={() => navigate('/')}
        leftActions={
          <button
            className="btn-primary text-sm"
            onClick={() => navigate('/')}
          >
            Current Puzzle
          </button>
        }
      />
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Puzzle Archives</h1>
          <p className="text-base sm:text-lg" style={{ color: 'var(--color-text-muted)' }}>
            Practice with previous daily puzzles and track your progress
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {puzzles.map((puzzle) => (
            <div
              key={puzzle.id}
              className={`card p-3 sm:p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                puzzle.solved ? 'ring-2 ring-green-500/30' : ''
              }`}
              onClick={() => navigate(`/historical-puzzle/${puzzle.id}`)}
            >
              {miniBoard(puzzle.fen, isDarkMode)}
              
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm sm:text-base" style={{ color: 'var(--color-text)' }}>
                    Puzzle #{puzzle.absolute_number}
                  </h3>
                  {puzzle.solved && (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Difficulty: {puzzle.difficulty}/5</span>
                </div>
                
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    puzzle.solved 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {puzzle.solved ? 'Solved' : 'Unsolved'}
                  </span>
                  
                  {puzzle.solved && puzzle.bestTime && (
                    <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm">{Math.floor(puzzle.bestTime / 60)}:{(puzzle.bestTime % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {puzzles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
              No puzzles available yet. Check back later!
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}