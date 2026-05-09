import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { getPalette, motion, radii, spacing, typography, type Palette, type ThemeMode } from './theme';

type Theme = {
  mode: ThemeMode;
  palette: Palette;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  motion: typeof motion;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children, override }: PropsWithChildren<{ override?: ThemeMode }>) {
  const system = useColorScheme();
  const mode: ThemeMode = override ?? (system === 'dark' ? 'dark' : 'light');
  const value = useMemo<Theme>(
    () => ({
      mode,
      palette: getPalette(mode),
      spacing,
      radii,
      typography,
      motion,
    }),
    [mode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme must be used inside ThemeProvider');
  return t;
}
