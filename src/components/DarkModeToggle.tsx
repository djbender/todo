import { useEffect, useState } from 'react';

export const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    // Read from attribute set by inline script to avoid flash
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }
    return false;
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUserPreference, setHasUserPreference] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    setHasUserPreference(saved !== null);
    setIsInitialized(true);
  }, []);

  // Update theme when changed
  useEffect(() => {
    if (!isInitialized) return;

    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    setHasUserPreference(true);
  }, [isDark, isInitialized]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!hasUserPreference) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [hasUserPreference]);

  const handleToggle = () => {
    setIsDark(!isDark);
  };

  return (
    <label className="theme-toggle">
      <input
        type="checkbox"
        role="switch"
        checked={isDark}
        onChange={handleToggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      />
      <span className="theme-toggle-slider" data-checked={isDark}>
        <span className="theme-toggle-option" data-active={!isDark}>☀️ Light</span>
        <span className="theme-toggle-option" data-active={isDark}>🌙 Dark</span>
      </span>
    </label>
  );
};
