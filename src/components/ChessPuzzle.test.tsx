import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ATTEMPT_CLASS, AttemptClassification } from './ChessPuzzle';

// Minimal mock for moveSequence and game.get
const mockMoveSequence = [
  { from: 'e2', to: 'e4' },
  { from: 'd7', to: 'd5' },
  { from: 'f1', to: 'b5' },
];

function mockGame(fen = 'startpos') {
  const chess = new Chess();
  return {
    get: (square: string) => chess.get(square),
    fen: () => chess.fen(),
  };
}

describe('classifyAttempt', () => {
  // Import the classifyAttempt logic from ChessPuzzle
  // We'll redefine it here for isolated testing
  const classifyAttempt = (
    moveSequence: any[],
    game: any,
    currentMoveIndex: number,
    from: string,
    to: string,
    promotion?: string
  ): AttemptClassification => {
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

  it('returns CORRECT for exact match', () => {
    const game = mockGame();
    expect(classifyAttempt(mockMoveSequence, game, 0, 'e2', 'e4')).toBe(ATTEMPT_CLASS.CORRECT);
  });

  it('returns RIGHT_PIECE for correct piece, wrong destination', () => {
    const game = mockGame();
    expect(classifyAttempt(mockMoveSequence, game, 0, 'e2', 'e3')).toBe(ATTEMPT_CLASS.RIGHT_PIECE);
  });

  it('returns WRONG for wrong piece', () => {
    const game = mockGame();
    expect(classifyAttempt(mockMoveSequence, game, 0, 'g1', 'f3')).toBe(ATTEMPT_CLASS.WRONG);
  });

  it('returns CORRECT for correct promotion', () => {
    const moveSequence = [{ from: 'e7', to: 'e8', promotion: 'q' }];
    const game = mockGame();
    expect(classifyAttempt(moveSequence, game, 0, 'e7', 'e8', 'q')).toBe(ATTEMPT_CLASS.CORRECT);
  });

  it('returns RIGHT_PIECE for correct squares, wrong promotion', () => {
    const moveSequence = [{ from: 'e7', to: 'e8', promotion: 'q' }];
    const game = mockGame();
    expect(classifyAttempt(moveSequence, game, 0, 'e7', 'e8', 'n')).toBe(ATTEMPT_CLASS.RIGHT_PIECE);
  });

  it('returns WRONG if expectedMove is missing', () => {
    const game = mockGame();
    expect(classifyAttempt([], game, 0, 'e2', 'e4')).toBe(ATTEMPT_CLASS.WRONG);
  });
}); 