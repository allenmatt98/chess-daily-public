import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { VictoryCelebration } from './VictoryCelebration';
import { PuzzleHeader } from './PuzzleHeader';
import { HintComponent } from './HintComponent';
import { UserStats } from './UserStats';
import { AuthPrompt } from './AuthPrompt';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { updateGuestStats } from '../lib/guestStats';
import { savePuzzleCompletion, getPuzzleCompletion } from '../lib/completionStorage';
import { Target } from 'lucide-react';
import type { ChessPuzzleProps } from '../types';
import type { UserStats as UserStatsType } from '../lib/puzzleService';
import { getGuestStats } from '../lib/guestStats';

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
  const { user, setShowAuthModal } = useAuthStore();
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
    const aspectRatio = screenWidth / screenHeight;
    const padding = 16; // Reduced padding for better space utilization
    
    // Desktop/Laptop sizes
    if (screenWidth >= 1920) {
      return Math.min(600, screenWidth * 0.35);
    } else if (screenWidth >= 1440) {
      return Math.min(550, screenWidth * 0.38);
    } else if (screenWidth >= 1024) {
      return Math.min(500, screenWidth * 0.45);
    }
    // Tablet sizes
    else if (screenWidth >= 768) {
      return Math.min(screenWidth - padding * 2, 480);
    }
    // Large mobile phones (1080x2400, 1440x3200, etc.)
    else if (screenWidth >= 400 && aspectRatio < 0.5) {
      // Very tall screens - use more width
      return Math.min(screenWidth - padding * 2, screenWidth - 16);
    }
    // Standard mobile sizes - iPhone 15, Galaxy 24 and similar
    else if (screenWidth >= 400) {
      return Math.min(screenWidth - padding * 2, screenWidth - 24);
    }
    // Small mobile
    else if (screenWidth >= 360) {
      return Math.min(screenWidth - padding * 2, screenWidth - 20);
    }
    // Very small mobile
    else {
      return Math.min(screenWidth - padding * 2, screenWidth - 12);
    }
  };

  // Get current user stats for display
  const getCurrentStats = () => {
    if (user) {
      // This would come from props or context in a real app
      return { rating: 1200, currentStreak: 5, highestStreak: 12 };
    } else {
      return getGuestStats();
    }
  };

  const currentStats = getCurrentStats();

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
        <div className="progress-grid overflow-x-auto max-w-full w-full" style={{ 
          gridTemplateColumns: `repeat(${numUserMoves}, 1fr)`,
          gap: '0.125rem'
        }}>
          {Array.from({ length: numUserMoves }).map((_, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-0.5 min-w-0">
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
    <div className="w-full">
      {/* Mobile Layout - Stack vertically */}
      <div className="lg:hidden space-y-2 sm:space-y-3 px-1 sm:px-2">
        {/* Puzzle Header */}
        <PuzzleHeader
          puzzleNumber={puzzle.metadata?.absolute_number || 1}
          objective={puzzleObjective}
          elapsedTime={elapsedTime}
          hintsUsed={hintsUsed}
          progressPercentage={progressPercentage}
          formatTime={formatTime}
        />

        {/* Chess board container with proper spacing */}
        <div className="flex justify-center px-0 sm:px-1">
          <div className="chess-board-wrapper p-1 sm:p-2 rounded-xl w-full" style={{ 
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            maxWidth: 'min(calc(100vw - 16px), 100%)' // Use more of the available width
          }}>
            <div className={`chess-board-container ${isDarkMode ? 'dark' : ''}`}>
              <Chessboard
                position={game.fen()}
                onPieceDrop={handleMove}
                onPromotionPieceSelect={handlePromotion}
                boardOrientation={playerColor}
                customBoardStyle={{ borderRadius: '8px' }}
                customDarkSquareStyle={{ backgroundColor: isDarkMode ? '#475569' : '#64748b' }}
                customLightSquareStyle={{ backgroundColor: isDarkMode ? '#cbd5e1' : '#f1f5f9' }}
                customSquareStyles={getSquareStyles()}
                showBoardNotation={boardWidth > 280}
                boardWidth={boardWidth}
              />
            </div>
          </div>
        </div>

        {/* Hint Component */}
        <HintComponent
          onShowHint={showHint}
          hintsUsed={hintsUsed}
          isCompleted={isCompleted}
        />

        {/* Progress Grid */}
        <div className="card p-2 sm:p-3 mx-0 sm:mx-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            <h3 className="text-sm sm:text-base font-semibold" style={{ color: 'var(--color-text)' }}>Your Progress</h3>
          </div>
          {renderProgressGrid()}
        </div>

        {/* Stats/Auth section for mobile */}
        <div className="mt-2 sm:mt-3 mx-0 sm:mx-0">
          {user ? (
            <UserStats {...currentStats} />
          ) : (
            <AuthPrompt onSignIn={() => setShowAuthModal(true)} />
          )}
        </div>
      </div>

      {/* Desktop Layout - Side by side */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-3 xl:gap-4 lg:px-2 xl:px-4">
        {/* Left Column - Chess board */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="space-y-2 lg:space-y-3">
            {/* Puzzle Header for Desktop */}
            <PuzzleHeader
              puzzleNumber={puzzle.metadata?.absolute_number || 1}
              objective={puzzleObjective}
              elapsedTime={elapsedTime}
              hintsUsed={hintsUsed}
              progressPercentage={progressPercentage}
              formatTime={formatTime}
            />
            
            {/* Chess Board */}
            <div className="flex justify-center">
              <div className="chess-board-wrapper p-2 lg:p-3 rounded-xl" style={{ 
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)'
              }}>
                <div className={`chess-board-container ${isDarkMode ? 'dark' : ''}`}>
                  <Chessboard
                    position={game.fen()}
                    onPieceDrop={handleMove}
                    onPromotionPieceSelect={handlePromotion}
                    boardOrientation={playerColor}
                    customBoardStyle={{ borderRadius: '8px' }}
                    customDarkSquareStyle={{ backgroundColor: isDarkMode ? '#475569' : '#64748b' }}
                    customLightSquareStyle={{ backgroundColor: isDarkMode ? '#cbd5e1' : '#f1f5f9' }}
                    customSquareStyles={getSquareStyles()}
                    showBoardNotation={true}
                    boardWidth={boardWidth}
                  />
                </div>
              </div>
            </div>
            
            {/* Hint Component below board */}
            <HintComponent
              onShowHint={showHint}
              hintsUsed={hintsUsed}
              isCompleted={isCompleted}
            />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-2 lg:space-y-3">
          {/* User Stats */}
          {user ? (
            <UserStats {...currentStats} />
          ) : (
            <AuthPrompt onSignIn={() => setShowAuthModal(true)} />
          )}

          {/* Progress Section */}
          <div className="card p-3 lg:p-4">
            <div className="flex items-center gap-2 mb-3 lg:mb-4">
              <Target className="w-5 h-5 text-green-400" />
              <h3 className="text-sm lg:text-base font-semibold" style={{ color: 'var(--color-text)' }}>Your Progress</h3>
            </div>
            {renderProgressGrid()}
          </div>
        </div>
      </div>

      {/* Victory celebration - rendered at top level */}
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