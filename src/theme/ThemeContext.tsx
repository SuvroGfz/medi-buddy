import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = '@medibuddy_theme_mode';

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  statusBarStyle: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  mode: 'system',
  setMode: () => {},
  statusBarStyle: 'light',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const resolvedScheme = mode === 'system' ? (systemScheme ?? 'light') : mode;

  const value = useMemo<ThemeContextValue>(() => ({
    colors: resolvedScheme === 'dark' ? darkColors : lightColors,
    mode,
    setMode,
    statusBarStyle: resolvedScheme === 'dark' ? 'light' : 'light',
  }), [resolvedScheme, mode, setMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
