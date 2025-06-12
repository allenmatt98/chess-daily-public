import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { VictoryCelebration } from './VictoryCelebration';
import { useAuthStore } from '../store/authStore';
import { updateGuestStats } from '../lib/guestStats';
import { savePuzzleCompletion, getPuzzleCompletion } from '../lib/completionStorage';
import type { ChessPuzzleProps } from '../types';
import type { UserStats } from '../lib/puzzleService';

export const ATTEMPT_CLASS = {
  WRONG: 'wrong', // 🔲
  RIGHT_PIECE: 'right_piece', // 🟨
  CORRECT: 'correct', // 🟩
} as const;

export type AttemptClassification = typeof ATTEMPT_CLASS[keyof typeof ATTEMPT_CLASS];

interface AttemptRecord {
  moveIndex: number; // which move in the solution
  timestamp: number;
  classification: AttemptClassification;
  hintUsed?: boolean;
}

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
  const [wrongMove, setWrongMove] = useState(false);
  const [puzzleObjective, setPuzzleObjective] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [processingVictory, setProcessingVictory] = useState(false);
  const [victoryShownThisSession, setVictoryShownThisSession] = useState(false);
  
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

  const [attemptHistory, setAttemptHistory] = useState<AttemptRecord[][]>(() => {
    // Try to load from localStorage for this puzzle
    const key = `attemptHistory_${puzzle.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    // Initialize as empty arrays for each move
    return Array.from({ length: Math.ceil((puzzle.moves || []).length) }, () => []);
  });

  // Persist attemptHistory to localStorage
  useEffect(() => {
    const key = `attemptHistory_${puzzle.id}`;
    localStorage.setItem(key, JSON.stringify(attemptHistory));
  }, [attemptHistory, puzzle.id]);

  // Clear attemptHistory when starting a new puzzle
  useEffect(() => {
    setAttemptHistory(Array.from({ length: Math.ceil((puzzle.moves || []).length) }, () => []));
  }, [puzzle.id]);

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
      
      // Only show victory if not already shown in this session
      if (!victoryShownThisSession && !sessionStorage.getItem(`victory_shown_${puzzle.id}`)) {
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
          setVictoryShownThisSession(true);
          sessionStorage.setItem(`victory_shown_${puzzle.id}`, '1');
      }, 500);
      }
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

    // Record a hintUsed attempt for the current user move
    setAttemptHistory(prev => {
      return prev.map((arr, idx) => idx === currentMoveIndex ? [...arr, {
        moveIndex: currentMoveIndex,
        timestamp: Date.now(),
        classification: ATTEMPT_CLASS.RIGHT_PIECE, // or another classification if needed
        hintUsed: true
      }] : arr);
    });

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

  // Helper to classify an attempt
  const classifyAttempt = (from: Square, to: Square, promotion?: string): AttemptClassification => {
    const expectedMove = moveSequence[currentMoveIndex];
    if (!expectedMove) return ATTEMPT_CLASS.WRONG;
    if (expectedMove.from === from && expectedMove.to === to) {
      // If promotion is required, check it
      if (expectedMove.promotion) {
        if (promotion && expectedMove.promotion === promotion) {
          return ATTEMPT_CLASS.CORRECT;
        } else {
          return ATTEMPT_CLASS.RIGHT_PIECE; // Right squares, wrong promotion
        }
      }
      return ATTEMPT_CLASS.CORRECT;
    }
    // Check if the piece type matches but wrong destination
    const expectedPiece = game.get(expectedMove.from)?.type;
    const actualPiece = game.get(from)?.type;
    if (expectedPiece && actualPiece && expectedPiece === actualPiece) {
      return ATTEMPT_CLASS.RIGHT_PIECE;
    }
    return ATTEMPT_CLASS.WRONG;
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

    // --- Attempt tracking ---
    const classification = classifyAttempt(fromSquare, toSquare);
    setAttemptHistory(prev => {
      const updated = prev.map((arr, idx) => idx === currentMoveIndex ? [...arr, {
        moveIndex: currentMoveIndex,
        timestamp: Date.now(),
        classification
      }] : arr);
      return updated;
    });
    // --- End attempt tracking ---
    
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
      setWrongMove(true);
      // --- Attempt tracking ---
      setAttemptHistory(prev => {
        const updated = prev.map((arr, idx) => idx === currentMoveIndex ? [...arr, {
          moveIndex: currentMoveIndex,
          timestamp: Date.now(),
          classification: ATTEMPT_CLASS.WRONG
        }] : arr);
        return updated;
      });
      // --- End attempt tracking ---
      return false;
    }

    // Map the promotion piece to the correct format (q, r, b, n)
    const promotionMap: { [key: string]: string } = {
      'wQ': 'q', 'wR': 'r', 'wB': 'b', 'wN': 'n',
      'bQ': 'q', 'bR': 'r', 'bB': 'b', 'bN': 'n'
    };

    const promotionType = promotionMap[piece];
    if (!promotionType) {
      setWrongMove(true);
      setAttemptHistory(prev => {
        const updated = prev.map((arr, idx) => idx === currentMoveIndex ? [...arr, {
          moveIndex: currentMoveIndex,
          timestamp: Date.now(),
          classification: ATTEMPT_CLASS.WRONG
        }] : arr);
        return updated;
      });
      return false;
    }

    // --- Attempt tracking ---
    const classification = classifyAttempt(fromSquare, toSquare, promotionType);
    setAttemptHistory(prev => {
      const updated = prev.map((arr, idx) => idx === currentMoveIndex ? [...arr, {
        moveIndex: currentMoveIndex,
        timestamp: Date.now(),
        classification
      }] : arr);
      return updated;
    });
    // --- End attempt tracking ---

    // Verify the promotion type matches the expected move
    if (expectedMove.promotion && expectedMove.promotion !== promotionType) {
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

      if (!move) {
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

  // Share grid generation
  const generateShareGrid = useCallback(() => {
    const emojiMap = {
      [ATTEMPT_CLASS.WRONG]: '🟥',
      [ATTEMPT_CLASS.RIGHT_PIECE]: '🟨',
      [ATTEMPT_CLASS.CORRECT]: '🟩',
      hint: '🏳️',
    };
    // Only show columns for user's moves (every other move in moveSequence)
    const userMoveIndexes = Array.from({ length: Math.ceil((puzzle.moves || []).length / 2) }, (_, i) => i * 2);
    const cappedHistory = userMoveIndexes.map(idx => attemptHistory[idx]?.slice(-5) || []);
    // Build grid rows (top to bottom, no extra spaces, always rectangular)
    const numCols = cappedHistory.length;
    const maxRows = Math.max(...cappedHistory.map(col => col.length), 1);
    const gridRows: string[] = [];
    for (let row = 0; row < maxRows; row++) {
      let rowStr = '';
      for (let col = 0; col < numCols; col++) {
        const attempt = cappedHistory[col][row];
        if (attempt) {
          if (attempt.hintUsed) {
            rowStr += emojiMap.hint;
          } else {
            rowStr += emojiMap[attempt.classification];
          }
        } else {
          rowStr += '⬜'; // Use block for alignment in share text
        }
      }
      gridRows.push(rowStr);
    }
    // Metadata
    const puzzleNum = puzzle.metadata?.absolute_number || puzzle.puzzle_number || puzzle.id;
    const mateType = `Mate in ${Math.ceil((puzzle.moves || []).length / 2)}`;
    const streak = victoryStats?.streak || 0;
    const timeStr = `⏱️ ${formatTime(elapsedTime)}`;
    const streakStr = `🔥 Streak: ${streak}`;
    const url = 'www.chess-daily.com';
    return [
      `Chess-Daily #${puzzleNum}`,
      '',
      ...gridRows,
      '',
      `${timeStr} | ${mateType} | ${streakStr}`,
      url
    ].join('\n');
  }, [attemptHistory, puzzle, elapsedTime, victoryStats]);

  // Progress grid for UI (same as share grid, but live)
  const renderProgressGrid = () => {
    const emojiMap = {
      [ATTEMPT_CLASS.WRONG]: '🟥',
      [ATTEMPT_CLASS.RIGHT_PIECE]: '🟨',
      [ATTEMPT_CLASS.CORRECT]: '🟩',
      hint: '🏳️',
    };
    const bgMap = {
      [ATTEMPT_CLASS.WRONG]: 'bg-red-200',
      [ATTEMPT_CLASS.RIGHT_PIECE]: 'bg-yellow-100',
      [ATTEMPT_CLASS.CORRECT]: 'bg-green-100',
      hint: 'bg-gray-300',
    };
    // Only show columns for user's moves (every other move in moveSequence)
    const userMoveIndexes = Array.from({ length: Math.ceil((puzzle.moves || []).length / 2) }, (_, i) => i * 2);
    const cappedHistory = userMoveIndexes.map(idx => attemptHistory[idx]?.slice(-5) || []);
    const numUserMoves = userMoveIndexes.length;
    const maxRows = Math.max(...cappedHistory.map(col => col.length), 1);
    return (
      <div className="flex flex-col items-center w-full">
        <div className="flex flex-row gap-2">
          {Array.from({ length: numUserMoves }).map((_, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              {Array.from({ length: maxRows }).map((_, rowIdx) => {
                const attempt = cappedHistory[colIdx]?.[rowIdx];
                let emoji = '';
                let bg = 'bg-gray-200';
                if (attempt) {
                  if (attempt.hintUsed) {
                    emoji = emojiMap.hint;
                    bg = bgMap.hint;
                  } else {
                    emoji = emojiMap[attempt.classification];
                    bg = bgMap[attempt.classification];
                  }
                }
  return (
                  <span
                    key={rowIdx}
                    className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg border ${bg} ${attempt ? '' : 'border-gray-300'} transition-all duration-150`}
                    aria-label={attempt ? attempt.classification : 'empty'}
                  >
                    {emoji}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main grid layout: board + sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 max-w-7xl mx-auto w-full items-start">
        {/* Board area (centered, 8/12 cols on desktop) */}
        <div className="col-span-1 lg:col-span-8 flex flex-col items-center justify-start pt-0 pb-2 px-2 sm:px-4">
          <div className="w-full flex flex-col items-center mb-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Puzzle #{puzzle.metadata?.absolute_number || 1}</h1>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 bg-white/90 px-4 py-2 rounded-lg shadow-sm inline-block mb-1">
          {puzzleObjective}
              <span className="ml-3 inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-medium align-middle">
                <span role="img" aria-label="timer">⏱️</span>
                {formatTime(elapsedTime)}
              </span>
        </h2>
          </div>
          <div className="flex flex-col items-center justify-center w-full">
            {/* Chessboard container fix: larger max width, min width, and always centered */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-2 sm:p-4 transition-shadow duration-300 w-full max-w-3xl min-w-[320px] min-h-[320px] flex items-center justify-center mx-auto">
              <Chessboard
                position={game.fen()}
                onPieceDrop={handleMove}
                onPromotionPieceSelect={handlePromotion}
                boardOrientation={playerColor}
                customBoardStyle={{
                  borderRadius: '12px',
                }}
                customSquareStyles={getSquareStyles()}
              />
            </div>
            <div className="mt-3 flex flex-col items-center w-full">
              <button
                onClick={showHint}
                className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all duration-150"
                disabled={isCompleted}
              >
                Hint {hintsUsed > 0 && `(${hintsUsed})`}
              </button>
        </div>
        {wrongMove && (
              <div className="mt-3 text-center">
            <div className="inline-block bg-red-50 border border-red-100 rounded-lg px-4 py-2 animate-[fade-in_0.2s_ease-out]">
              <p className="text-red-600 font-bold text-[1.2em]">
                Oops! Wrong move. Try again!
              </p>
            </div>
          </div>
        )}
          </div>
        </div>
        {/* Sidebar: progress + extras (4/12 cols on desktop) */}
        <aside className="col-span-1 lg:col-span-4 flex flex-col items-start justify-start py-8 px-2 sm:px-6 bg-white/95 rounded-l-3xl shadow-xl border-l border-gray-200 transition-all duration-300 min-h-full">
          <div className="w-full max-w-xs">
            <div className="mb-6">
              <div className="font-bold text-lg text-gray-800 mb-2">Your Progress</div>
              {/* Balanced padding and reduced height for progress grid */}
              <div className="bg-gray-100 rounded-xl shadow-inner px-4 py-4 h-[220px] flex items-start justify-center">
                {renderProgressGrid()}
              </div>
            </div>
            {/* Placeholder for achievements or other sidebar content */}
            {/* <div className="mt-8"> ... </div> */}
          </div>
        </aside>
      </div>

      {showVictory && victoryStats && (
        <VictoryCelebration
          elapsedTime={finalTimeRef.current}
          onComplete={() => setShowVictory(false)}
          rating={victoryStats.rating}
          ratingChange={victoryStats.ratingChange}
          streak={victoryStats.streak}
          shareGridData={generateShareGrid()}
        />
      )}
    </div>
  );
}