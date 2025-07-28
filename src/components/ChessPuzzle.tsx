import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { VictoryCelebration } from './VictoryCelebration';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { updateGuestStats } from '../lib/guestStats';
import { savePuzzleCompletion, getPuzzleCompletion } from '../lib/completionStorage';
import { Lightbulb, Clock, Target, Zap } from 'lucide-react';
import type { ChessPuzzleProps } from '../types';
import type { UserStats } from '../lib/puzzleService';

export const ATTEMPT_CLASS = {
  WRONG: 'wrong',
  RIGHT_PIECE: 'right_piece',
  CORRECT: 'correct',
} as const;

export type AttemptClassification = typeof ATTEMPT_CLASS[keyof typeof ATTEMPT_CLASS];

interface AttemptRecord {
  moveIndex: number;
  timestamp: number;
  classification: AttemptClassification;
  hintUsed?: boolean;
}

export function ChessPuzzle({ puzzle, onComplete }: ChessPuzzleProps) {
  const { isDarkMode } = useTheme();

  if (!puzzle?.fen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

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
    const key = `attemptHistory_${puzzle.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return Array.from({ length: Math.ceil((puzzle.moves || []).length) }, () => []);
  });

  // Calculate responsive board width with better mobile handling
  const getBoardWidth = () => {
    if (typeof window === 'undefined') return 300;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const padding = 32; // Account for container padding
    
    // For very high-resolution screens (like 2400x1800), use viewport units
    if (screenWidth >= 2560) {
      return Math.min(900, Math.max(700, screenWidth * 0.30));
    } else if (screenWidth >= 1920) {
      return Math.min(800, Math.max(600, screenWidth * 0.35));
    } else if (screenWidth >= 1440) {
      return Math.min(700, Math.max(500, screenWidth * 0.40));
    } else if (screenWidth >= 1024) {
      return Math.min(600, Math.max(450, screenWidth * 0.45));
    } else if (screenWidth >= 768) {
      return Math.min(550, Math.max(400, screenWidth * 0.50));
    } else if (screenWidth >= 640) {
      return Math.min(500, Math.max(350, screenWidth * 0.55));
    } else if (screenWidth >= 480) {
      return Math.min(450, Math.max(300, screenWidth * 0.60));
    } else {
      return Math.min(400, Math.max(280, screenWidth * 0.70));
    }
  };

  const [boardWidth, setBoardWidth] = useState(getBoardWidth());

  // Enhanced resize handler with debouncing
  useEffect(() => {
    const handleResize = () => {
      const newWidth = getBoardWidth();
      setBoardWidth(newWidth);
    };

    // Debounce resize events
    let timeoutId: number;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const key = `attemptHistory_${puzzle.id}`;
    localStorage.setItem(key, JSON.stringify(attemptHistory));
  }, [attemptHistory, puzzle.id]);

  useEffect(() => {
    setAttemptHistory(Array.from({ length: Math.ceil((puzzle.moves || []).length) }, () => []));
  }, [puzzle.id]);

  useEffect(() => {
    const initialTurn = puzzle.fen.split(' ')[1] === 'w' ? 'White' : 'Black';
    setPuzzleObjective(`${initialTurn} to play and mate in ${movesToMate}`);

    const completion = getPuzzleCompletion(puzzle.id);
    if (completion) {
      setIsCompleted(true);
      finalTimeRef.current = completion.timeTaken;
      setElapsedTime(completion.timeTaken);
      setHintsUsed(completion.hintsUsed);
      
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

    startTimeRef.current = Date.now();
    finalTimeRef.current = 0;
    setElapsedTime(0);
    setIsCompleting(false);
    setIsCompleted(false);
    setHintsUsed(0);
    setCurrentMoveIndex(0);
    setGame(new Chess(puzzle.fen));
    setProcessingVictory(false);

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

    setAttemptHistory(prev => {
      return prev.map((arr, idx) => idx === currentMoveIndex ? [...arr, {
        moveIndex: currentMoveIndex,
        timestamp: Date.now(),
        classification: ATTEMPT_CLASS.RIGHT_PIECE,
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

  const classifyAttempt = (from: Square, to: Square, promotion?: string): AttemptClassification => {
    const expectedMove = moveSequence[currentMoveIndex];
    if (!expectedMove) return ATTEMPT_CLASS.WRONG;
    if (expectedMove.from === from && expectedMove.to === to) {
      if (expectedMove.promotion) {
        if (promotion && expectedMove.promotion === promotion) {
          return ATTEMPT_CLASS.CORRECT;
        } else {
          return ATTEMPT_CLASS.RIGHT_PIECE;
        }
      }
      return ATTEMPT_CLASS.CORRECT;
    }
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

    if (isPromotion(fromSquare, toSquare)) {
      return false;
    }

    setActiveHint(null);
    setHintPhase(null);

    const classification = classifyAttempt(fromSquare, toSquare);
    setAttemptHistory(prev => {
      const updated = prev.map((arr, idx) => idx === currentMoveIndex ? [...arr, {
        moveIndex: currentMoveIndex,
        timestamp: Date.now(),
        classification
      }] : arr);
      return updated;
    });
    
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

    if (expectedMove.from !== fromSquare || expectedMove.to !== toSquare) {
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

    const classification = classifyAttempt(fromSquare, toSquare, promotionType);
    setAttemptHistory(prev => {
      const updated = prev.map((arr, idx) => idx === currentMoveIndex ? [...arr, {
        moveIndex: currentMoveIndex,
        timestamp: Date.now(),
        classification
      }] : arr);
      return updated;
    });

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
      styles[activeHint.from] = { backgroundColor: 'rgba(34, 197, 94, 0.4)' };
    }
    
    if (activeHint.to) {
      styles[activeHint.to] = { backgroundColor: 'rgba(34, 197, 94, 0.6)' };
    }
    
    return styles;
  };

  const generateShareGrid = useCallback(() => {
    const emojiMap = {
      [ATTEMPT_CLASS.WRONG]: '🟥',
      [ATTEMPT_CLASS.RIGHT_PIECE]: '🟨',
      [ATTEMPT_CLASS.CORRECT]: '🟩',
      hint: '🏳️',
    };
    const userMoveIndexes = Array.from({ length: Math.ceil((puzzle.moves || []).length / 2) }, (_, i) => i * 2);
    const cappedHistory = userMoveIndexes.map(idx => attemptHistory[idx] || []);
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
          rowStr += '⬜';
        }
      }
      gridRows.push(rowStr);
    }
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

  const renderProgressGrid = () => {
    const emojiMap = {
      [ATTEMPT_CLASS.WRONG]: '🟥',
      [ATTEMPT_CLASS.RIGHT_PIECE]: '🟨',
      [ATTEMPT_CLASS.CORRECT]: '🟩',
      hint: '🏳️',
    };
    
    const userMoveIndexes = Array.from({ length: Math.ceil((puzzle.moves || []).length / 2) }, (_, i) => i * 2);
    const cappedHistory = userMoveIndexes.map(idx => attemptHistory[idx] || []);
    const numUserMoves = userMoveIndexes.length;
    const maxRows = Math.max(...cappedHistory.map(col => col.length), 1);
    
    return (
      <div className="flex flex-col items-center w-full">
        <div className="progress-grid overflow-x-auto max-w-full" style={{ gridTemplateColumns: `repeat(${numUserMoves}, 1fr)` }}>
          {Array.from({ length: numUserMoves }).map((_, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1 min-w-0">
              {Array.from({ length: maxRows }).map((_, rowIdx) => {
                const attempt = cappedHistory[colIdx]?.[rowIdx];
                let emoji = '';
                let className = 'progress-cell';
                if (attempt) {
                  if (attempt.hintUsed) {
                    emoji = emojiMap.hint;
                    className += ' hint';
                  } else {
                    emoji = emojiMap[attempt.classification];
                    className += ` ${attempt.classification}`;
                  }
                }
                return (
                  <div
                    key={rowIdx}
                    className={className}
                    aria-label={attempt ? attempt.classification : 'empty'}
                  >
                    {emoji}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-3 lg:p-4 xl:p-6">
        {/* Enhanced responsive layout */}
        <div className="flex flex-col xl:grid xl:grid-cols-12 gap-3 sm:gap-4 lg:gap-6">
          
          {/* Main puzzle area */}
          <div className="xl:col-span-8 order-1">
            {/* Compact puzzle header */}
            <div className="card p-3 sm:p-4 lg:p-5 xl:p-6 mb-3 sm:mb-4 lg:mb-6">
              <div className="flex flex-col space-y-2 sm:space-y-3 lg:space-y-4">
                {/* Title and objective */}
                <div className="text-center">
                  <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold mb-1 sm:mb-2" style={{ color: 'var(--color-text)' }}>
                    Puzzle #{puzzle.metadata?.absolute_number || 1}
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base" style={{ color: 'var(--color-text-muted)' }}>{puzzleObjective}</p>
                </div>
                
                {/* Stats row */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 lg:gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border text-xs sm:text-sm" style={{ 
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)'
                  }}>
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                    <span className="font-mono whitespace-nowrap" style={{ color: 'var(--color-text)' }}>{formatTime(elapsedTime)}</span>
                  </div>
                  
                  {hintsUsed > 0 && (
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-xs sm:text-sm">
                      <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-300 font-medium whitespace-nowrap">{hintsUsed} hints</span>
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                <div className="w-full rounded-full h-1.5 sm:h-2" style={{ backgroundColor: 'var(--color-border)' }}>
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Chess board container with improved responsive design */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="chess-board-wrapper p-1 sm:p-2 lg:p-3 rounded-xl w-full max-w-4xl" style={{ 
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}>
                <div className={`chess-board-container ${isDarkMode ? 'dark' : ''} flex justify-center`} style={{ 
                  width: '100%',
                  height: 'auto',
                  minWidth: '280px',
                  maxWidth: '100%'
                }}>
                  <Chessboard
                    position={game.fen()}
                    onPieceDrop={handleMove}
                    onPromotionPieceSelect={handlePromotion}
                    boardOrientation={playerColor}
                    customBoardStyle={{
                      borderRadius: '8px',
                    }}
                    customDarkSquareStyle={{
                      backgroundColor: isDarkMode ? '#475569' : '#64748b'
                    }}
                    customLightSquareStyle={{
                      backgroundColor: isDarkMode ? '#cbd5e1' : '#f1f5f9'
                    }}
                    customSquareStyles={getSquareStyles()}
                    showBoardNotation={boardWidth > 280}
                    boardWidth={boardWidth}
                  />
                </div>
              </div>
            </div>

            {/* Controls with improved spacing */}
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <button
                onClick={showHint}
                className="btn-secondary flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm min-w-[120px] sm:min-w-[140px] justify-center"
                disabled={isCompleted}
              >
                <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Hint {hintsUsed > 0 && `(${hintsUsed})`}</span>
              </button>

              {wrongMove && (
                <div className="animate-fade-in w-full max-w-sm sm:max-w-md">
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                    <p className="text-red-300 font-medium text-center text-xs sm:text-sm">
                      Wrong move! Try again.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress sidebar with improved responsive design */}
          <aside className="xl:col-span-4 order-2">
            <div className="card p-3 sm:p-4 lg:p-5 xl:p-6">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                <h3 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--color-text)' }}>Your Progress</h3>
              </div>
              
              <div className="rounded-lg p-2 sm:p-3 lg:p-4 min-h-[100px] sm:min-h-[120px] flex items-center justify-center border overflow-x-auto" style={{ 
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}>
                {renderProgressGrid()}
              </div>
              
              {isCompleted && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-green-300 font-medium text-xs sm:text-sm">Puzzle Complete!</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Solved in {formatTime(finalTimeRef.current)} with {hintsUsed} hints
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
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