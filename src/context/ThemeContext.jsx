import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import textLogo from '../assets/text-logo.png';
import textLogoDark from '../assets/text-logo-dark.png';
import textLogoLight from '../assets/text-logo-light.png';

export const THEMES = {
  DEFAULT: 'default', // Royal Gold / Obsidian Black
  DARK: 'dark',       // Modern Slate / Charcoal Dark
  LIGHT: 'light',     // Ivory Luxury Light
};

const THEME_STORAGE_KEY = 'aparna_app_theme';

// Preload logos immediately in background so image changes are instant
if (typeof window !== 'undefined') {
  [textLogo, textLogoDark, textLogoLight].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

const getStoredTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && Object.values(THEMES).includes(saved)) {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return THEMES.DEFAULT;
};

const isLandingRoute = (pathname) => {
  if (!pathname) return false;
  const p = pathname.toLowerCase();
  return p === '/' || p === '/landing' || p === '/landing-new' || p === '/landingpage' || p === '/coming-soon';
};

// Apply initial data-theme synchronously before first paint (strictly 'default' for landing page)
if (typeof document !== 'undefined') {
  const isLanding = typeof window !== 'undefined' && isLandingRoute(window.location.pathname);
  const initial = isLanding ? THEMES.DEFAULT : getStoredTheme();
  document.documentElement.setAttribute('data-theme', initial);
}

const ThemeContext = createContext({
  theme: THEMES.DEFAULT,
  setTheme: () => {},
  cycleTheme: () => {},
  isDefault: true,
  isDark: false,
  isLight: false,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getStoredTheme);
  const transitionTimerRef = useRef(null);

  const setTheme = (newTheme) => {
    if (!Object.values(THEMES).includes(newTheme)) return;

    const isLanding = typeof window !== 'undefined' && isLandingRoute(window.location.pathname);
    const root = document.documentElement;

    if (!isLanding) {
      // 1. Synchronously update data-theme and add transition class BEFORE state change
      root.classList.add('theme-transition');
      root.setAttribute('data-theme', newTheme);

      // Clear any previous transition cleanup timer
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      // Remove transition class after 320ms so it doesn't affect regular component hovers
      transitionTimerRef.current = setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 320);
    }

    // 2. Persist to localStorage
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }

    // 3. Update React state
    setThemeState(newTheme);
  };

  const cycleTheme = () => {
    if (theme === THEMES.DEFAULT) {
      setTheme(THEMES.DARK);
    } else if (theme === THEMES.DARK) {
      setTheme(THEMES.LIGHT);
    } else {
      setTheme(THEMES.DEFAULT);
    }
  };

  // Sync data-theme attribute on document.documentElement
  useEffect(() => {
    const isLanding = typeof window !== 'undefined' && isLandingRoute(window.location.pathname);
    const root = document.documentElement;
    if (isLanding) {
      root.setAttribute('data-theme', THEMES.DEFAULT);
    } else {
      root.setAttribute('data-theme', theme);
    }
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [theme]);

  const value = {
    theme,
    setTheme,
    cycleTheme,
    isDefault: theme === THEMES.DEFAULT,
    isDark: theme === THEMES.DARK,
    isLight: theme === THEMES.LIGHT,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
