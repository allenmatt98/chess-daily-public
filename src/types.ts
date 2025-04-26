export interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface ChessPuzzle {
  fen: string;
  pgn: string;
  metadata: {
    white: string;
    black: string;
    result: string;
    link?: string;
    difficulty?: number;
    theme?: string;
    puzzleNumber: number;
    timeLimit: number;
    absolute_number: number;
  };
  moves: ChessMove[];
}

export interface GuestPuzzleTime {
  puzzleId: string;
  timeTaken: number;
  solvedAt: string;
}