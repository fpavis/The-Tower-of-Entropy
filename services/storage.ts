import { INITIAL_META_LEVELS } from '../constants';
import { GameMode, Profile } from '../types';

const KEY = 'tower-of-entropy:profile:v1';

export const defaultProfile = (): Profile => ({
  version: 1,
  shards: 0,
  meta: { ...INITIAL_META_LEVELS },
  achievements: {},
  stats: {
    runs: 0,
    totalScore: 0,
    perfects: 0,
    bosses: 0,
    directives: 0,
    bestRound: { [GameMode.ASCENT]: 0, [GameMode.ENTROPY]: 0, [GameMode.BLITZ]: 0, [GameMode.DAILY]: 0 },
    bestScore: { [GameMode.ASCENT]: 0, [GameMode.ENTROPY]: 0, [GameMode.BLITZ]: 0, [GameMode.DAILY]: 0 },
    modesPlayed: [],
  },
  daily: {},
  settings: { muted: false, seenHelp: false },
});

export const loadProfile = (): Profile => {
  const base = defaultProfile();
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<Profile>;
    return {
      ...base,
      ...saved,
      meta: { ...base.meta, ...(saved.meta || {}) },
      stats: {
        ...base.stats,
        ...(saved.stats || {}),
        bestRound: { ...base.stats.bestRound, ...(saved.stats?.bestRound || {}) },
        bestScore: { ...base.stats.bestScore, ...(saved.stats?.bestScore || {}) },
      },
      settings: { ...base.settings, ...(saved.settings || {}) },
    };
  } catch {
    return base;
  }
};

export const saveProfile = (profile: Profile) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable (private mode etc.) – progress simply won't persist */
  }
};
