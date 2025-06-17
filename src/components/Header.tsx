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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={onLogoClick}>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                <Crown className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-white/10 rounded-lg"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold brand-text" style={{ color: 'var(--color-text)' }}>Chess Daily</h1>
                <span className="text-xs font-medium -mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Daily Puzzles</span>
              </div>
            </div>
            {leftActions && (
              <div className="ml-4 flex items-center gap-2">{leftActions}</div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle focus:ring-offset-2"
              style={{ 
                backgroundColor: isDarkMode ? '#22c55e' : 'var(--color-border)',
                focusRingOffsetColor: 'var(--color-background)'
              }}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              <span className="sr-only">Toggle theme</span>
              <div className="theme-toggle-thumb flex items-center justify-center">
                {isDarkMode ? (
                  <Moon className="w-3 h-3 text-green-600" />
                ) : (
                  <Sun className="w-3 h-3 text-yellow-500" />
                )}
              </div>
            </button>

            <button
              className="text-sm font-medium transition-colors duration-200 focus:outline-none"
              style={{ 
                color: 'var(--color-text-muted)',
              }}
              onMouseEnter={(e) => e.target.style.color = '#22c55e'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
              onClick={onHowToPlay}
              aria-label="How to Play"
            >
              How to Play
            </button>
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300" style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)'
                }}>
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-sm" style={{ color: 'var(--color-text)' }}>{user.email}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="btn-secondary text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={onSignIn}
                className="btn-primary text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}