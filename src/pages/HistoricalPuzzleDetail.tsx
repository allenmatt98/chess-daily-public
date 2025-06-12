import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateMoveSequence } from '../utils/moveGenerator';
import { ChessPuzzle } from '../components/ChessPuzzle';
import { updateHistoricalPuzzleProgress } from '../lib/puzzleService';
import { useAuthStore } from '../store/authStore';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import type { ChessPuzzle as ChessPuzzleType } from '../types';

export default function HistoricalPuzzleDetail() {
  const { id } = useParams<{ id: string }>();
  const [puzzle, setPuzzle] = useState<ChessPuzzleType | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex flex-col bg-[--color-background]">
      <Header
        onHowToPlay={() => navigate('/how-to-play')}
        onSignIn={() => navigate('/auth/callback')}
        onSignOut={() => { useAuthStore.getState().signOut(); navigate('/'); }}
        onLogoClick={() => navigate('/')}
        leftActions={
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
            onClick={() => navigate('/')}
          >
            Go to Current Puzzle
          </button>
        }
      />
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-3xl">
          {loading ? (
            <div className="p-4">Loading puzzle...</div>
          ) : !puzzle ? (
            <div className="p-4">Puzzle not found.</div>
          ) : (
            <>
              <button className="mb-4 text-blue-600 underline" onClick={() => navigate('/historical-puzzles')}>
                ← Back to all puzzles
              </button>
              <h2 className="text-xl font-bold mb-2">Puzzle #{puzzle.absolute_number}</h2>
              <ChessPuzzle
                puzzle={puzzle}
                onComplete={async (timeTaken, hintsUsed) => {
                  if (!user) return null; // For guests, do not save progress
                  return updateHistoricalPuzzleProgress(user.id, puzzle.id, timeTaken, hintsUsed);
                }}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 