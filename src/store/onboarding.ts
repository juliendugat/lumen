import { create } from 'zustand';

type OnboardingState = {
  lastPeriodStart: string | null; // ISO
  cycleLength: number; // days
  periodLength: number;
  notificationsOptIn: boolean;
  set: (patch: Partial<Omit<OnboardingState, 'set' | 'reset'>>) => void;
  reset: () => void;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  lastPeriodStart: null,
  cycleLength: 28,
  periodLength: 5,
  notificationsOptIn: true,
  set: (patch) => set(patch),
  reset: () =>
    set({
      lastPeriodStart: null,
      cycleLength: 28,
      periodLength: 5,
      notificationsOptIn: true,
    }),
}));
