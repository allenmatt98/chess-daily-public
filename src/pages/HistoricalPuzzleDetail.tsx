import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateMoveSequence } from '../utils/moveGenerator';
import { ChessPuzzle } from '../components/ChessPuzzle';
import { updateHistoricalPuzzleProgress } from '../lib/puzzleService';
import { useAuthStore } from '../store/authStore';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { useTheme } from '../hooks/useTheme';
import { ArrowLeft } from 'lucide-react';
import type { ChessPuzzle as ChessPuzzleType } from '../types';

export default function HistoricalPuzzleDetail() {
  const { id } = useParams<{ id: string }>();
  const [puzzle, setPuzzle] = useState<ChessPuzzleType | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) {
        setPuzzle(null);
      } else {
        setPuzzle({
          ...data,
          moves: generateMoveSequence(data.fen, data.pgn),
        });
      }
      setLoading(false);
    })();
  }, [id]);

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
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button 
            className="inline-flex items-center mb-6 transition-colors duration-200 hover:text-green-400"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => navigate('/historical-puzzles')}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to all puzzles
          </button>

          {!puzzle ? (
            <div className="card p-8 text-center">
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Puzzle not found</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>
                The puzzle you're looking for doesn't exist or has been removed.
              </p>
            </div>
          ) : (
            <ChessPuzzle
              puzzle={puzzle}
              onComplete={async (timeTaken, hintsUsed) => {
                if (!user) return null;
                return updateHistoricalPuzzleProgress(user.id, puzzle.id, timeTaken, hintsUsed);
              }}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}