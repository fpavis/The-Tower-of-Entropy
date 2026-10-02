import { GameMode, Profile, RunState } from '../types';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  glyph: string;
  reward: number; // shards
  check: (p: Profile, r: RunState) => boolean;
}

const cleared = (r: RunState) => r.stats.roundsCleared;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'FIRST_LIGHT', name: 'First Light', desc: 'Clear a round.', glyph: '☼', reward: 1, check: (_p, r) => cleared(r) >= 1 },
  { id: 'FLAWLESS', name: 'Flawless', desc: 'Clear a round using the minimum energy.', glyph: '✦', reward: 1, check: (p, r) => p.stats.perfects + r.stats.perfects >= 1 },
  { id: 'DIRECTOR', name: 'Following Orders', desc: 'Complete 5 directives in a single run.', glyph: '◆', reward: 2, check: (_p, r) => r.stats.directivesDone >= 5 },
  { id: 'HOT_STREAK', name: 'Hot Streak', desc: 'Chain 5 perfect rounds in a row.', glyph: '♨', reward: 2, check: (_p, r) => r.stats.bestStreak >= 5 },
  { id: 'BOSS_HUNTER', name: 'Boss Hunter', desc: 'Defeat your first boss.', glyph: '♛', reward: 2, check: (p, r) => p.stats.bosses + r.stats.bosses >= 1 },
  { id: 'SLAYER', name: 'Entropy Slayer', desc: 'Defeat 5 bosses across all runs.', glyph: '☠', reward: 3, check: (p, r) => p.stats.bosses + r.stats.bosses >= 5 },
  { id: 'DOUBLE_DIGITS', name: 'Double Digits', desc: 'Clear round 10.', glyph: '⑩', reward: 2, check: (_p, r) => cleared(r) >= 10 },
  { id: 'HEAT_DEATH', name: 'Beyond Heat Death', desc: 'Clear round 25.', glyph: '∞', reward: 5, check: (_p, r) => cleared(r) >= 25 },
  { id: 'ARCHITECT', name: 'Architect', desc: 'Clear a tower of 8 rings.', glyph: '▥', reward: 3, check: (_p, r) => r.stats.maxRingsCleared >= 8 },
  { id: 'HIGH_ROLLER', name: 'High Roller', desc: 'Score 5,000 in a single run.', glyph: '₿', reward: 2, check: (_p, r) => r.score >= 5000 },
  { id: 'COMBO_KING', name: 'Combo King', desc: 'Reach a x3.0 combo.', glyph: '✺', reward: 3, check: (_p, r) => r.stats.bestCombo >= 3 },
  { id: 'COLLECTOR', name: 'Relic Collector', desc: 'Hold 5 relics at once.', glyph: '❖', reward: 2, check: (_p, r) => r.relics.length >= 5 },
  { id: 'LAST_GASP', name: 'Last Gasp', desc: 'Clear a round with exactly 0 energy left.', glyph: '☄', reward: 2, check: (_p, r) => r.stats.lastGasp },
  { id: 'CHAOS', name: 'Chaos Theory', desc: 'Clear 5 rounds in Entropy mode.', glyph: '❂', reward: 2, check: (_p, r) => r.mode === GameMode.ENTROPY && cleared(r) >= 5 },
  { id: 'CLOCKWORK', name: 'Clockwork', desc: 'Clear 5 rounds in Blitz mode.', glyph: '⧖', reward: 2, check: (_p, r) => r.mode === GameMode.BLITZ && cleared(r) >= 5 },
  { id: 'DAILY_DRIVER', name: 'Daily Driver', desc: 'Clear 5 rounds of a Daily Collapse.', glyph: '◈', reward: 2, check: (_p, r) => r.mode === GameMode.DAILY && cleared(r) >= 5 },
  { id: 'POLYMATH', name: 'Polymath', desc: 'Play every game mode.', glyph: '✵', reward: 3, check: (p) => p.stats.modesPlayed.length >= 4 },
];

export const evaluateAchievements = (profile: Profile, run: RunState): AchievementDef[] =>
  ACHIEVEMENTS.filter((a) => !profile.achievements[a.id] && a.check(profile, run));
