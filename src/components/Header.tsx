import React from 'react';
import { LogIn, Crown, Zap, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';

export function Header({
  onHowToPlay,
  onSignIn,
  onSignOut,
  showAuthModal,
  onLogoClick,
  leftActions
}: {
  onHowToPlay?: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  showAuthModal?: () => void;
  onLogoClick?: () => void;
  leftActions?: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const { isDarkMode, toggleTheme } = useTheme();
  
  return (
    <header className="border-b backdrop-blur-sm sticky top-0 z-50 transition-all duration-300" style={{ 
      borderColor: 'var(--color-border)',
      backgroundColor: `${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'}`
    }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo section */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={onLogoClick}>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-md flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
                <Crown className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                <div className="absolute inset-0 bg-white/10 rounded-md"></div>
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm sm:text-lg font-bold brand-text truncate leading-tight" style={{ color: 'var(--color-text)' }}>
                  Chess Daily
                </h1>
                <span className="text-xs font-medium -mt-0.5 hidden sm:block leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                  Daily Puzzles
                </span>
              </div>
            </div>
          </div>

          {/* Center section - Puzzle Archives button for desktop/laptop */}
          <div className="hidden lg:flex items-center">
            {leftActions}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-6 w-10 sm:h-7 sm:w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-green-500 flex-shrink-0"
              style={{ 
                backgroundColor: isDarkMode ? '#22c55e' : 'var(--color-border)',
              }}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              <span className="sr-only">Toggle theme</span>
              <div className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white transition-transform duration-200 flex items-center justify-center ${
                isDarkMode ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5 sm:translate-x-1'
              }`}>
                {isDarkMode ? (
                  <Moon className="w-2 h-2 sm:w-3 sm:h-3 text-green-600" />
                ) : (
                  <Sun className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-500" />
                )}
              </div>
            </button>

            {/* How to Play button */}
            <button
              className="text-xs sm:text-sm font-medium transition-colors duration-200 focus:outline-none px-2 py-1 rounded whitespace-nowrap min-w-0 flex-shrink-0"
              style={{ 
                color: 'var(--color-text-muted)',
              }}
              onMouseEnter={(e) => e.target.style.color = '#22c55e'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
              onClick={onHowToPlay}
              aria-label="How to Play"
            >
              <span className="hidden sm:inline">How to Play</span>
              <span className="sm:hidden">Help</span>
            </button>
            
            {user ? (
              <>
                {/* User info - only show on larger screens */}
                <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg border transition-all duration-300 max-w-24" style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)'
                }}>
                  <Zap className="w-3 h-3 text-green-400 flex-shrink-0" />
                  <span className="text-xs truncate" style={{ color: 'var(--color-text)' }}>
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="btn-secondary text-xs px-2 py-1 whitespace-nowrap min-w-0 flex-shrink-0"
                >
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={onSignIn}
                className="btn-primary text-xs px-2 py-1 flex items-center gap-1 min-w-0 flex-shrink-0"
              >
                <LogIn className="w-3 h-3 flex-shrink-0" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile left actions - shown below header on small screens */}
        {leftActions && (
          <div className="lg:hidden pb-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-center pt-3">
              {leftActions}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}