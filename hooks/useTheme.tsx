import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import { Colors } from '../constants/theme';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  const colors = Colors[context.mode];

  return {
    ...context,
    colors,
  };
}
