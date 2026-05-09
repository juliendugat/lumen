import { useFonts as useFraunces, Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

/**
 * Load all the fonts the theme references. We split the calls because each
 * `useFonts` is its own hook from its own package; combine the booleans so
 * the app shows a single splash until everything's ready.
 */
export function useAppFonts(): { ready: boolean; error: Error | null } {
  const [fA, errA] = useFraunces({ Fraunces_500Medium, Fraunces_600SemiBold });
  const [fB, errB] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  return { ready: fA && fB, error: (errA as Error | null) ?? (errB as Error | null) };
}
