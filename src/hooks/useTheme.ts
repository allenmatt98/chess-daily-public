import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

export function useTheme() {
  const { isDarkMode, toggleTheme, setTheme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.setProperty('--color-primary-rgb', '34, 197, 94');
      root.style.setProperty('--color-primary', 'rgb(var(--color-primary-rgb))');
      root.style.setProperty('--color-secondary', '#6b7280');
      root.style.setProperty('--color-background', '#0f172a');
      root.style.setProperty('--color-surface', '#1e293b');
      root.style.setProperty('--color-border', '#334155');
      root.style.setProperty('--color-text', '#f8fafc');
      root.style.setProperty('--color-text-muted', '#94a3b8');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--color-primary-rgb', '34, 197, 94');
      root.style.setProperty('--color-primary', 'rgb(var(--color-primary-rgb))');
      root.style.setProperty('--color-secondary', '#6b7280');
      root.style.setProperty('--color-background', '#ffffff');
      root.style.setProperty('--color-surface', '#f8fafc');
      root.style.setProperty('--color-border', '#e2e8f0');
      root.style.setProperty('--color-text', '#1e293b');
      root.style.setProperty('--color-text-muted', '#64748b');
    }
  }, [isDarkMode]);

  return {
    isDarkMode,
    toggleTheme,
    setTheme,
  };
}