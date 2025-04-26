import { Chess } from 'chess.js';
import type { ChessMove } from '../types';

export function generateMoveSequence(fen: string, pgn: string): ChessMove[] {
  if (!fen || !pgn) {
    console.warn('Missing FEN or PGN:', { fen, pgn });
    return [];
  }

  try {
    const game = new Chess(fen);
    const moves: ChessMove[] = [];
    
    // Extract moves from PGN, excluding metadata
    const moveText = pgn.replace(/\[.*?\]\s*/g, '').trim();
    
    if (!moveText) {
      console.warn('No moves found in PGN');
      return [];
    }
    
    // Parse PGN moves, handling move numbers and result
    const cleanMoves = moveText
      .replace(/\d+\.\s+/g, '')
      .replace(/\s*(1-0|0-1|1\/2-1\/2)\s*$/, '')
      .trim();

    if (!cleanMoves) {
      console.warn('No valid moves found after cleaning PGN');
      return [];
    }

    const moveList = cleanMoves.split(/\s+/);
    
    for (const algebraicMove of moveList) {
      try {
        // Get all possible moves in verbose format
        const possibleMoves = game.moves({ verbose: true });
        
        // Find the move that matches the algebraic notation
        const move = possibleMoves.find(m => m.san === algebraicMove);
        
        if (move) {
          // Check if this is a promotion move
          let promotion: string | undefined;
          if (move.flags.includes('p')) {
            // Extract promotion piece from the algebraic notation
            const promotionMatch = algebraicMove.match(/=[NBRQ]/);
            if (promotionMatch) {
              promotion = promotionMatch[0].charAt(1).toLowerCase();
            }
          }

          moves.push({
            from: move.from,
            to: move.to,
            promotion
          });

          // Make the move to update game state
          game.move(algebraicMove);
        } else {
          console.warn('Invalid move found:', algebraicMove);
        }
      } catch (moveError) {
        console.error('Error processing move:', algebraicMove, moveError);
      }
    }
    
    return moves;
  } catch (error) {
    console.error('Error generating move sequence:', error);
    return [];
  }
}