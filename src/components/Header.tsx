import React from 'react';
import { LogIn, Crown, Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

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
  
  return (
    <header className="border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={onLogoClick}>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-200">
                <Crown className="w-6 h-6 text-white" />
                <div className="absolute inset-0 bg-white/10 rounded-lg"></div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold brand-text text-slate-100">Chess Daily</h1>
                <span className="text-xs text-slate-400 font-medium -mt-0.5">Daily Puzzles</span>
              </div>
            </div>
            {leftActions && (
              <div className="ml-4 flex items-center gap-2">{leftActions}</div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              className="text-sm font-medium text-slate-300 hover:text-green-400 focus:outline-none transition-colors duration-200"
              onClick={onHowToPlay}
              aria-label="How to Play"
            >
              How to Play
            </button>
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">{user.email}</span>
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