import { GuestPuzzleTime } from './types';

const GUEST_STATS_KEY = 'guest_stats';
const GUEST_TIMES_KEY = 'guest_puzzle_times';

interface GuestStats {
  rating: number;
  currentStreak: number;
  highestStreak: number;
  lastPuzzleDate?: string;
}

const DEFAULT_STATS: GuestStats = {
  rating: 1000,
  currentStreak: 0,
  highestStreak: 0
};

export function getGuestStats(): GuestStats {
  try {
    const stored = localStorage.getItem(GUEST_STATS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
}

export function updateGuestStats(
  puzzleId: string,
  timeTaken: number,
  hintsUsed: number
): GuestStats {
  const currentStats = getGuestStats();
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate base points (similar to server-side logic)
  let basePoints = 0;
  if (timeTaken < 30) basePoints = 40;
  else if (timeTaken < 60) basePoints = 35;
  else if (timeTaken < 180) basePoints = 30;
  else if (timeTaken < 300) basePoints = 25;
  else basePoints = 20;

  // Apply hint penalty
  const hintPenalty = hintsUsed * 10;
  const pointsEarned = Math.max(1, basePoints - hintPenalty);

  // Update streak
  let newStreak = currentStats.currentStreak;
  if (currentStats.lastPuzzleDate) {
    const lastDate = new Date(currentStats.lastPuzzleDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
      newStreak++;
    } else if (lastDate.toISOString().split('T')[0] !== today) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const newStats: GuestStats = {
    rating: currentStats.rating + pointsEarned,
    currentStreak: newStreak,
    highestStreak: Math.max(newStreak, currentStats.highestStreak),
    lastPuzzleDate: today
  };

  // Save stats
  localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(newStats));
  
  // Save puzzle time for future sync
  const times: GuestPuzzleTime[] = JSON.parse(localStorage.getItem(GUEST_TIMES_KEY) || '[]');
  times.push({
    puzzleId,
    timeTaken,
    solvedAt: new Date().toISOString()
  });
  localStorage.setItem(GUEST_TIMES_KEY, JSON.stringify(times));

  return newStats;
}

export function clearGuestStats(): void {
  localStorage.removeItem(GUEST_STATS_KEY);
  localStorage.removeItem(GUEST_TIMES_KEY);
}