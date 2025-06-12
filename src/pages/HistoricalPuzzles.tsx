import React, { useEffect, useState } from 'react';
import { getAllPuzzlesWithProgress, PuzzleWithProgress } from '../lib/puzzleService';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const miniBoard = (fen: string) => {
  return (
    <div className="flex justify-center">
      <Chessboard
        position={fen}
        boardWidth={120}
        arePiecesDraggable={false}
        areArrowsAllowed={false}
        boardOrientation="white"
        customBoardStyle={{ boxShadow: 'none', border: '1px solid #e5e7eb', borderRadius: 4 }}
        customDarkSquareStyle={{ backgroundColor: '#b58863' }}
        customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
      />
    </div>
  );
};

export default function HistoricalPuzzles() {
  const [puzzles, setPuzzles] = useState<PuzzleWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    if (user) {
      getAllPuzzlesWithProgress(user.id)
        .then(setPuzzles)
        .finally(() => setLoading(false));
    } else {
      // For guests, fetch all puzzles and mark as unsolved
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
    return <div className="p-4">Loading puzzles...</div>;
  }

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
      <main className="flex-1 p-4 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-4">Historical Puzzles</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {puzzles.map((puzzle) => (
            <div
              key={puzzle.id}
              className={`border rounded p-3 cursor-pointer hover:shadow transition ${puzzle.solved ? 'bg-green-50' : 'bg-white'}`}
              onClick={() => navigate(`/historical-puzzle/${puzzle.id}`)}
            >
              {miniBoard(puzzle.fen)}
              <div className="mt-2 text-sm">
                <div className="font-semibold">Puzzle #{puzzle.absolute_number}</div>
                <div>Difficulty: {puzzle.difficulty}</div>
                <div>Status: {puzzle.solved ? 'Solved' : 'Unsolved'}</div>
                {puzzle.solved && puzzle.bestTime && (
                  <div>Best time: {puzzle.bestTime}s</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
} 