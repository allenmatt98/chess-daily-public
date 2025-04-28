import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { VictoryCelebration } from './VictoryCelebration';
import { useAuthStore } from '../store/authStore';
import { updateGuestStats } from '../lib/guestStats';
import { savePuzzleCompletion, getPuzzleCompletion } from '../lib/completionStorage';
import type { ChessPuzzleProps } from '../types';
import type { UserStats } from '../lib/puzzleService';

export function ChessPuzzle({ puzzle, onComplete }: ChessPuzzleProps) {
  console.log('ChessPuzzle received props:', { puzzle }); // Debug log

  // Early return if puzzle or required fields are missing
  if (!puzzle?.fen) {
    console.log('Missing puzzle or FEN, showing loading state'); // Debug log
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading puzzle...</p>
      </div>
    );
  }

  console.log('Initializing ChessPuzzle with FEN:', puzzle.fen); // Debug log

  const [game, setGame] = useState(new Chess(puzzle.fen));
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const [victoryStats, setVictoryStats] = useState<{
    rating: number;
    ratingChange: number;
    streak: number;
  } | null>(null);
  const [activeHint, setActiveHint] = useState<{ from: string; to: string } | null>(null);
  const [hintPhase, setHintPhase] = useState<'from' | 'to' | null>(null);
  const [timeUntilRotation, setTimeUntilRotation] = useState<string>('');
  const [wrongMove, setWrongMove] = useState(false);
  const [puzzleObjective, setPuzzleObjective] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [processingVictory, setProcessingVictory] = useState(false);
  
  const startTimeRef = useRef(Date.now());
  const timerIntervalRef = useRef<number>();
  const finalTimeRef = useRef<number>(0);
  const moveSequence = puzzle.moves || [];
  const { user } = useAuthStore();
  const playerColor = puzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black';
  const movesToMate = Math.ceil(moveSequence.length / 2);
  const progressPercentage = isCompleting ? 100 : 
    currentMoveIndex >= moveSequence.length ? 100 : 
    Math.floor((currentMoveIndex / 2) / movesToMate * 100);

  useEffect(() => {
    const initialTurn = puzzle.fen.split(' ')[1] === 'w' ? 'White' : 'Black';
    setPuzzleObjective(`${initialTurn} to play and mate in ${movesToMate}`);

    // Check if puzzle was already completed
    const completion = getPuzzleCompletion(puzzle.id);
    if (completion) {
      setIsCompleted(true);
      finalTimeRef.current = completion.timeTaken;
      setElapsedTime(completion.timeTaken);
      setHintsUsed(completion.hintsUsed);
      
      // Replay the completed moves
      const gameCopy = new Chess(puzzle.fen);
      completion.moves.forEach(move => {
        try {
          gameCopy.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion
          });
        } catch (error) {
          console.error('Error replaying move:', error);
        }
      });
      setGame(gameCopy);
      setCurrentMoveIndex(completion.moves.length);
      
      // Show victory screen
      setTimeout(() => {
        if (!user) {
          const guestStats = updateGuestStats(puzzle.id, completion.timeTaken, completion.hintsUsed);
          setVictoryStats({
            rating: guestStats.rating,
            ratingChange: guestStats.rating - 1000,
            streak: guestStats.currentStreak
          });
        }
        setShowVictory(true);
      }, 500);
      return;
    }

    // Reset state for new puzzle
    startTimeRef.current = Date.now();
    finalTimeRef.current = 0;
    setElapsedTime(0);
    setIsCompleting(false);
    setIsCompleted(false);
    setHintsUsed(0);
    setCurrentMoveIndex(0);
    setGame(new Chess(puzzle.fen));
    setProcessingVictory(false);

    // Start timer for new puzzle
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = window.setInterval(() => {
      if (!isCompleting && !isCompleted) {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [puzzle.id, puzzle.fen, user]);

  useEffect(() => {
    if (puzzle.nextRotation) {
      const updateTimeUntilRotation = () => {
        const now = new Date();
        const rotationTime = puzzle.nextRotation ? new Date(puzzle.nextRotation) : now;
        const diffMs = rotationTime.getTime() - now.getTime();
        const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        const diffMinutes = Math.max(0, Math.floor((diffMs / (1000 * 60)) % 60));
        setTimeUntilRotation(`${diffHours}h ${diffMinutes}m`);
      };

      updateTimeUntilRotation();
      const interval = setInterval(updateTimeUntilRotation, 60000);

      return () => clearInterval(interval);
    }
  }, [puzzle.nextRotation]);

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const showHint = () => {
    if (isCompleted || currentMoveIndex >= moveSequence.length) return;
    
    const nextMove = moveSequence[currentMoveIndex];
    if (!nextMove) return;

    setHintsUsed(prev => prev + 1);
    setWrongMove(false);

    if (!hintPhase) {
      setHintPhase('from');
      setActiveHint({ from: nextMove.from, to: '' });
      return;
    }

    if (hintPhase === 'from') {
      setHintPhase('to');
      setActiveHint({ from: nextMove.from, to: nextMove.to });
      return;
    }

    if (hintPhase === 'to') {
      const gameCopy = new Chess(game.fen());
      try {
        gameCopy.move({
          from: nextMove.from,
          to: nextMove.to,
          promotion: nextMove.promotion
        });
        setGame(gameCopy);

        if (currentMoveIndex + 1 < moveSequence.length) {
          const opponentMove = moveSequence[currentMoveIndex + 1];
          setTimeout(() => {
            const finalGameCopy = new Chess(gameCopy.fen());
            try {
              finalGameCopy.move({
                from: opponentMove.from,
                to: opponentMove.to,
                promotion: opponentMove.promotion
              });
              setGame(finalGameCopy);
              setCurrentMoveIndex(currentMoveIndex + 2);
              setHintPhase(null);
              setActiveHint(null);
            } catch (error) {
              console.error('Error making opponent move:', error);
              setHintPhase(null);
              setActiveHint(null);
            }
          }, 800);
        } else {
          setCurrentMoveIndex(currentMoveIndex + 1);
          setHintPhase(null);
          setActiveHint(null);
        }
      } catch (error) {
        console.error('Error making hint move:', error);
        setHintPhase(null);
        setActiveHint(null);
      }
    }
  };

  const isPromotion = (fromSquare: Square, toSquare: Square): boolean => {
    const piece = game.get(fromSquare);
    if (!piece || piece.type !== 'p') return false;
    
    const targetRank = toSquare.charAt(1);
    return (piece.color === 'w' && targetRank === '8') || 
           (piece.color === 'b' && targetRank === '1');
  };

  const handleMove = (fromSquare: Square, toSquare: Square): boolean => {
    if (isCompleted) return false;
    
    const expectedMove = moveSequence[currentMoveIndex];
    if (!expectedMove) return false;

    // If it's a promotion move, let the promotion handler handle it
    if (isPromotion(fromSquare, toSquare)) {
      return false; // Let the promotion handler handle this move
    }

    setActiveHint(null);
    setHintPhase(null);
    
    if (expectedMove.from === fromSquare && expectedMove.to === toSquare) {
      setWrongMove(false);
      const gameCopy = new Chess(game.fen());
      
      try {
        const moveOptions = {
          from: fromSquare,
          to: toSquare,
          promotion: expectedMove.promotion
        };

        gameCopy.move(moveOptions);
        setGame(gameCopy);
        
        if (currentMoveIndex + 1 < moveSequence.length) {
          setTimeout(() => {
            const nextMove = moveSequence[currentMoveIndex + 1];
            if (!nextMove) return;

            const finalGameCopy = new Chess(gameCopy.fen());
            try {
              finalGameCopy.move({
                from: nextMove.from,
                to: nextMove.to,
                promotion: nextMove.promotion
              });
              setGame(finalGameCopy);
              setCurrentMoveIndex(currentMoveIndex + 2);
            } catch (error) {
              console.error('Error making opponent move:', error);
            }
          }, 300);
        } else {
          handlePuzzleComplete();
        }
        return true;
      } catch (error) {
        console.error('Error making move:', error);
        setWrongMove(true);
        return false;
      }
    }
    setWrongMove(true);
    return false;
  };

  const handlePromotion = (piece: string | undefined, fromSquare: Square | undefined, toSquare: Square | undefined): boolean => {
    if (!piece || !fromSquare || !toSquare || isCompleted) return false;
    
    const expectedMove = moveSequence[currentMoveIndex];
    if (!expectedMove) return false;

    // Verify the source and target squares match the expected move
    if (expectedMove.from !== fromSquare || expectedMove.to !== toSquare) {
      console.log('Square mismatch:', {
        expected: { from: expectedMove.from, to: expectedMove.to },
        received: { from: fromSquare, to: toSquare }
      });
      setWrongMove(true);
      return false;
    }

    // Map the promotion piece to the correct format (q, r, b, n)
    const promotionMap: { [key: string]: string } = {
      'wQ': 'q', 'wR': 'r', 'wB': 'b', 'wN': 'n',
      'bQ': 'q', 'bR': 'r', 'bB': 'b', 'bN': 'n'
    };

    const promotionType = promotionMap[piece];
    console.log('Promotion type:', { piece, promotionType, expected: expectedMove.promotion });

    if (!promotionType) {
      console.error('Invalid promotion piece:', piece);
      setWrongMove(true);
      return false;
    }

    // Verify the promotion type matches the expected move
    if (expectedMove.promotion && expectedMove.promotion !== promotionType) {
      console.log('Wrong promotion piece:', {
        expected: expectedMove.promotion,
        received: promotionType
      });
      setWrongMove(true);
      return false;
    }

    const gameCopy = new Chess(game.fen());
    
    try {
      const move = gameCopy.move({
        from: fromSquare,
        to: toSquare,
        promotion: promotionType
      });

      console.log('Move result:', move);

      if (!move) {
        console.error('Invalid promotion move');
        setWrongMove(true);
        return false;
      }

      setGame(gameCopy);
      setWrongMove(false);
      
      if (currentMoveIndex + 1 < moveSequence.length) {
        setTimeout(() => {
          const nextMove = moveSequence[currentMoveIndex + 1];
          if (!nextMove) return;

          const finalGameCopy = new Chess(gameCopy.fen());
          try {
            finalGameCopy.move({
              from: nextMove.from,
              to: nextMove.to,
              promotion: nextMove.promotion
            });
            setGame(finalGameCopy);
            setCurrentMoveIndex(currentMoveIndex + 2);
          } catch (error) {
            console.error('Error making opponent move:', error);
          }
        }, 300);
      } else {
        handlePuzzleComplete();
      }
      return true;
    } catch (error) {
      console.error('Error making promotion move:', error);
      setWrongMove(true);
      return false;
    }
  };

  const handlePuzzleComplete = async () => {
    if (processingVictory) return;
    setProcessingVictory(true);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    finalTimeRef.current = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setElapsedTime(finalTimeRef.current);
    setIsCompleting(true);
    setIsCompleted(true);

    // Save completion state
    savePuzzleCompletion(puzzle.id, finalTimeRef.current, hintsUsed, moveSequence);
    
    try {
      if (!user) {
        const guestStats = updateGuestStats(puzzle.id, finalTimeRef.current, hintsUsed);
        setVictoryStats({
          rating: guestStats.rating,
          ratingChange: guestStats.rating - 1000,
          streak: guestStats.currentStreak
        });
      } else if (onComplete) {
        // For logged-in users, always show victory screen with current stats as fallback
        let currentStats = {
          rating: 1000,
          previousRating: 1000,
          currentStreak: 0
        };

        try {
          const stats = await onComplete(finalTimeRef.current, hintsUsed);
          if (stats) {
            currentStats = {
              rating: stats.rating,
              previousRating: stats.previousRating || stats.rating,
              currentStreak: stats.currentStreak
            };
          }
        } catch (error) {
          console.error('Error updating stats:', error);
        }

        setVictoryStats({
          rating: currentStats.rating,
          ratingChange: currentStats.rating - currentStats.previousRating,
          streak: currentStats.currentStreak
        });
      }
      
      // Delay showing victory screen slightly to ensure state updates are complete
      setTimeout(() => {
        setShowVictory(true);
        setProcessingVictory(false);
      }, 500);
    } catch (error) {
      console.error('Error handling puzzle completion:', error);
      setProcessingVictory(false);
    }
  };

  const getSquareStyles = () => {
    if (!activeHint) return {};
    
    const styles: Record<string, { backgroundColor: string }> = {};
    
    if (activeHint.from) {
      styles[activeHint.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }
    
    if (activeHint.to) {
      styles[activeHint.to] = { backgroundColor: 'rgba(0, 255, 0, 0.4)' };
    }
    
    return styles;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Puzzle #{puzzle.metadata?.absolute_number || 1}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-3 sm:p-4 bg-amber-50 border-amber-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-700">Next puzzle in</span>
            </div>
            <span className="font-medium text-amber-800">{timeUntilRotation}</span>
          </div>
        </div>

        <div className="card p-3 sm:p-4 bg-blue-50 border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-700">Time elapsed</span>
            </div>
            <span className="font-medium text-blue-800">{formatTime(elapsedTime)}</span>
          </div>
        </div>
      </div>

      <div className="card p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-center mb-4">
          {puzzleObjective}
        </h2>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-full sm:w-auto mx-auto flex justify-center">
            <div className="chess-board-container">
              <Chessboard
                position={game.fen()}
                onPieceDrop={handleMove}
                onPromotionPieceSelect={handlePromotion}
                boardOrientation={playerColor}
                customBoardStyle={{
                  borderRadius: '8px',
                }}
                customSquareStyles={getSquareStyles()}
              />
            </div>
          </div>

          <div className="progress-bar-container hidden sm:flex h-[600px] w-6">
            <div 
              className="progress-bar-fill"
              style={{ 
                height: `${progressPercentage}%`,
              }}
            />
          </div>
        </div>

        {/* Mobile progress bar */}
        <div className="progress-bar-container mobile-progress-bar sm:hidden">
          <div 
            className="progress-bar-fill"
            style={{ 
              width: `${progressPercentage}%`,
              height: '100%'
            }}
          />
        </div>

        {wrongMove && (
          <div className="mt-4 text-center">
            <div className="inline-block bg-red-50 border border-red-100 rounded-lg px-4 py-2 animate-[fade-in_0.2s_ease-out]">
              <p className="text-red-600 font-bold text-[1.2em]">
                Oops! Wrong move. Try again!
              </p>
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <div className="flex items-center justify-center">
            <button
              onClick={showHint}
              className="btn-secondary flex items-center gap-2"
              disabled={isCompleted}
            >
              Hint {hintsUsed > 0 && `(${hintsUsed})`}
            </button>
          </div>
        </div>
      </div>

      {showVictory && victoryStats && (
        <VictoryCelebration
          elapsedTime={finalTimeRef.current}
          onComplete={() => setShowVictory(false)}
          rating={victoryStats.rating}
          ratingChange={victoryStats.ratingChange}
          streak={victoryStats.streak}
        />
      )}
    </div>
  );
}