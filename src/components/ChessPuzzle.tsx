import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Clock, Target, Lightbulb, Trophy, Zap } from 'lucide-react';
import { VictoryCelebration } from './VictoryCelebration';
import { PuzzleHeader } from './PuzzleHeader';
import { HintComponent } from './HintComponent';
import { UserStats } from './UserStats';
import { AuthPrompt } from './AuthPrompt';
import { useAuthStore } from '../store/authStore';
import type { ChessPuzzleProps } from '../types';
import type { UserStatsType } from '../lib/puzzleService';
import { getGuestStats } from '../lib/guestStats';

export const ATTEMPT_CLASS = {
  correct: '🟩',
  partial: '🟨',
  incorrect: '🟥',
  hint: '🏳️'
};

export function ChessPuzzle({ puzzle, onComplete }: ChessPuzzleProps) {
  const [game, setGame] = useState(new Chess(puzzle.fen));
  const [position, setPosition] = useState(puzzle.fen);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [attempts, setAttempts] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const [completionStats, setCompletionStats] = useState<UserStatsType | null>(null);
  const [userStats, setUserStats] = useState({ rating: 1000, currentStreak: 0, highestStreak: 0 });
  const timerRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());
  const { user } = useAuthStore();

  // Load guest stats if not authenticated
  useEffect(() => {
    if (!user) {
      const guestStats = getGuestStats();
      setUserStats(guestStats);
    }
  }, [user]);

  useEffect(() => {
    const newGame = new Chess(puzzle.fen);
    setGame(newGame);
    setPosition(puzzle.fen);
    setCurrentMoveIndex(0);
    setAttempts([]);
    setIsComplete(false);
    setElapsedTime(0);
    setHintsUsed(0);
    setShowVictory(false);
    setCompletionStats(null);
    startTimeRef.current = Date.now();

    timerRef.current = window.setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [puzzle]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const makeMove = useCallback((sourceSquare: string, targetSquare: string) => {
    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    });

    if (move) {
      const expectedMove = puzzle.moves[currentMoveIndex];
      const moveNotation = `${sourceSquare}${targetSquare}`;
      
      if (moveNotation === expectedMove) {
        setAttempts(prev => [...prev, ATTEMPT_CLASS.correct]);
        setGame(gameCopy);
        setPosition(gameCopy.fen());
        setCurrentMoveIndex(prev => prev + 1);

        if (currentMoveIndex + 1 >= puzzle.moves.length) {
          setIsComplete(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
          
          onComplete(finalTime, hintsUsed).then((stats) => {
            if (stats) {
              setCompletionStats(stats);
            }
            setShowVictory(true);
          });
        }
      } else {
        const correctPiece = expectedMove.substring(0, 2);
        const attemptPiece = moveNotation.substring(0, 2);
        
        if (correctPiece === attemptPiece) {
          setAttempts(prev => [...prev, ATTEMPT_CLASS.partial]);
        } else {
          setAttempts(prev => [...prev, ATTEMPT_CLASS.incorrect]);
        }
      }
      return true;
    }
    return false;
  }, [game, puzzle.moves, currentMoveIndex, hintsUsed, onComplete]);

  const handleHint = () => {
    if (currentMoveIndex < puzzle.moves.length) {
      const expectedMove = puzzle.moves[currentMoveIndex];
      const gameCopy = new Chess(game.fen());
      
      const move = gameCopy.move({
        from: expectedMove.substring(0, 2),
        to: expectedMove.substring(2, 4),
        promotion: 'q'
      });

      if (move) {
        setAttempts(prev => [...prev, ATTEMPT_CLASS.hint]);
        setGame(gameCopy);
        setPosition(gameCopy.fen());
        setCurrentMoveIndex(prev => prev + 1);
        setHintsUsed(prev => prev + 1);

        if (currentMoveIndex + 1 >= puzzle.moves.length) {
          setIsComplete(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          
          const finalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
          
          onComplete(finalTime, hintsUsed + 1).then((stats) => {
            if (stats) {
              setCompletionStats(stats);
            }
            setShowVictory(true);
          });
        }
      }
    }
  };

  const progressPercentage = (currentMoveIndex / puzzle.moves.length) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Mobile Layout */}
      <div className="lg:hidden space-y-3 sm:space-y-4">
        <PuzzleHeader
          puzzleNumber={puzzle.metadata.puzzleNumber}
          objective="White to play and mate in 4"
          elapsedTime={elapsedTime}
          hintsUsed={hintsUsed}
          progressPercentage={progressPercentage}
          formatTime={formatTime}
        />

        <div className="flex justify-center">
          <div className="w-full max-w-[min(100vw-1rem,400px)] aspect-square">
            <Chessboard
              position={position}
              onPieceDrop={makeMove}
              boardOrientation="white"
              customBoardStyle={{
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
              customDarkSquareStyle={{ backgroundColor: '#4a5568' }}
              customLightSquareStyle={{ backgroundColor: '#e2e8f0' }}
            />
          </div>
        </div>

        <HintComponent
          onHint={handleHint}
          hintsUsed={hintsUsed}
          isComplete={isComplete}
        />

        <div className="space-y-3">
          <div className="text-center">
            <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
              Your Progress
            </h3>
            <div className="flex flex-wrap justify-center gap-1.5 max-w-xs mx-auto">
              {Array.from({ length: puzzle.moves.length }, (_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded border flex items-center justify-center text-xs font-medium"
                  style={{
                    backgroundColor: i < attempts.length 
                      ? 'var(--color-surface)' 
                      : 'var(--color-background)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)'
                  }}
                >
                  {i < attempts.length ? attempts[i] : i + 1}
                </div>
              ))}
            </div>
          </div>

          {user ? (
            <UserStats
              rating={completionStats?.rating || userStats.rating}
              currentStreak={completionStats?.currentStreak || userStats.currentStreak}
              highestStreak={completionStats?.highestStreak || userStats.highestStreak}
            />
          ) : (
            <AuthPrompt />
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Chess Board - 7 columns */}
          <div className="col-span-7 flex flex-col justify-center">
            <div className="flex justify-center mb-4">
              <div className="w-full max-w-[min(70vh,600px)] aspect-square">
                <Chessboard
                  position={position}
                  onPieceDrop={makeMove}
                  boardOrientation="white"
                  customBoardStyle={{
                    borderRadius: '12px',
                    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.3)'
                  }}
                  customDarkSquareStyle={{ backgroundColor: '#4a5568' }}
                  customLightSquareStyle={{ backgroundColor: '#e2e8f0' }}
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <HintComponent
                onHint={handleHint}
                hintsUsed={hintsUsed}
                isComplete={isComplete}
              />
            </div>
          </div>

          {/* Right Sidebar - 5 columns */}
          <div className="col-span-5 flex flex-col justify-center space-y-6">
            <PuzzleHeader
              puzzleNumber={puzzle.metadata.puzzleNumber}
              objective="White to play and mate in 4"
              elapsedTime={elapsedTime}
              hintsUsed={hintsUsed}
              progressPercentage={progressPercentage}
              formatTime={formatTime}
            />

            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                Your Progress
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: puzzle.moves.length }, (_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded border flex items-center justify-center text-sm font-medium"
                    style={{
                      backgroundColor: i < attempts.length 
                        ? 'var(--color-surface)' 
                        : 'var(--color-background)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)'
                    }}
                  >
                    {i < attempts.length ? attempts[i] : i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rating/Stats below chess area */}
        <div className="mt-6 flex justify-center">
          {user ? (
            <UserStats
              rating={completionStats?.rating || userStats.rating}
              currentStreak={completionStats?.currentStreak || userStats.currentStreak}
              highestStreak={completionStats?.highestStreak || userStats.highestStreak}
            />
          ) : (
            <AuthPrompt />
          )}
        </div>
      </div>

      <VictoryCelebration
        isVisible={showVictory}
        onClose={() => setShowVictory(false)}
        stats={completionStats}
        timeTaken={elapsedTime}
        hintsUsed={hintsUsed}
        attempts={attempts}
      />
    </div>
  );
}