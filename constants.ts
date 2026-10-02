import {
  DirectiveType,
  GameMode,
  MetaKey,
  PowerId,
  RelicId,
  RunUpgrades,
  UpgradeId,
  VariationType,
} from './types';

export const MAX_RINGS_CAP = 8;
export const RINGS_PER_TIER = 5; // Increase rings every 5 levels (also the length of a zone)
export const BOSS_EVERY = 5;
export const BASE_RINGS = 3;
export const MAX_CHARGES = 9;

export const INITIAL_RUN_UPGRADES: RunUpgrades = {
  flatRefillBonus: 0,
  percentRefillBonus: 0,
  baseBitMultiplier: 1.0,
  comboShield: false,
};

export const calculateMinMoves = (n: number): number => Math.pow(2, n) - 1;

export const calculateRingCount = (round: number): number => {
  const tier = Math.floor((round - 1) / RINGS_PER_TIER);
  return Math.min(BASE_RINGS + tier, MAX_RINGS_CAP);
};

export const COLORS = [
  '#ef4444', // Red (Smallest)
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink (Largest)
];

// ---------------------------------------------------------------------------
// Zones: every 5 rounds (ending in a boss) the world shifts to a new "era"
// ---------------------------------------------------------------------------
export interface Zone {
  name: string;
  tagline: string;
  accent: string;
  rgb: string; // "r,g,b" for translucent glows
}

export const ZONES: Zone[] = [
  { name: 'Cold Start', tagline: 'Everything is still in order.', accent: '#22d3ee', rgb: '34,211,238' },
  { name: 'Thermal Drift', tagline: 'Heat begins to spread.', accent: '#34d399', rgb: '52,211,153' },
  { name: 'Static Field', tagline: 'Signal fades into noise.', accent: '#fbbf24', rgb: '251,191,36' },
  { name: 'Event Horizon', tagline: 'Time folds around you.', accent: '#e879f9', rgb: '232,121,249' },
  { name: 'Dark Era', tagline: 'The last stars gutter out.', accent: '#fb7185', rgb: '251,113,133' },
  { name: 'Heat Death', tagline: 'Nothing left to sort. Sort it anyway.', accent: '#a78bfa', rgb: '167,139,250' },
];

export const getTier = (round: number): number => Math.floor((round - 1) / RINGS_PER_TIER);
export const getZone = (round: number): Zone => ZONES[Math.min(getTier(round), ZONES.length - 1)];

// ---------------------------------------------------------------------------
// Game modes
// ---------------------------------------------------------------------------
export interface ModeInfo {
  name: string;
  glyph: string;
  color: string;
  tagline: string;
  rules: string[];
}

export const MODE_INFO: Record<GameMode, ModeInfo> = {
  [GameMode.ASCENT]: {
    name: 'Ascent',
    glyph: '▲',
    color: '#22d3ee',
    tagline: 'The classic climb',
    rules: ['Endless rounds, a new tower each time', 'Boss every 5th round', 'Moves are your life'],
  },
  [GameMode.ENTROPY]: {
    name: 'Entropy',
    glyph: '❂',
    color: '#e879f9',
    tagline: 'Solve from chaos',
    rules: ['Every tower starts scrambled', 'Optimal path differs each time', 'Oracle Lens shines here'],
  },
  [GameMode.BLITZ]: {
    name: 'Blitz',
    glyph: '⧖',
    color: '#fbbf24',
    tagline: 'Beat the clock',
    rules: ['Each round has a par time', 'Overtime bleeds 1 energy / 4s', 'Chrono Charges buy time'],
  },
  [GameMode.DAILY]: {
    name: 'Daily Collapse',
    glyph: '◈',
    color: '#34d399',
    tagline: 'One seed per day',
    rules: ['Same towers & shops all day', 'Some rounds start scrambled', 'Chase your best daily score'],
  },
};

export const MODE_ORDER = [GameMode.ASCENT, GameMode.ENTROPY, GameMode.BLITZ, GameMode.DAILY];

// ---------------------------------------------------------------------------
// Anomalies
// ---------------------------------------------------------------------------
export interface AnomalyInfo {
  name: string;
  glyph: string;
  color: string;
  desc: string;
  weight: number;
  boon?: boolean;
}

export const ANOMALY_INFO: Record<VariationType, AnomalyInfo> = {
  [VariationType.STANDARD]: {
    name: 'Standard',
    glyph: '○',
    color: '#94a3b8',
    desc: 'No distortions. Move the tower from A to C.',
    weight: 2,
  },
  [VariationType.TARGET_SWAP]: {
    name: 'Target Swap',
    glyph: '⇄',
    color: '#a855f7',
    desc: 'The destination is the middle peg (B).',
    weight: 1,
  },
  [VariationType.FOG_OF_WAR]: {
    name: 'Fog of War',
    glyph: '☁',
    color: '#64748b',
    desc: 'Buried rings are hidden and mimic the top ring. Remember your tower.',
    weight: 1,
  },
  [VariationType.HEAVY_RINGS]: {
    name: 'Heavy Rings',
    glyph: '⛓',
    color: '#f97316',
    desc: 'Every 3rd move costs 2 energy.',
    weight: 1,
  },
  [VariationType.WORMHOLE]: {
    name: 'Wormhole',
    glyph: '◌',
    color: '#22c55e',
    desc: 'A fourth peg tears open. Far fewer moves are needed.',
    weight: 0.6,
    boon: true,
  },
  [VariationType.DENSE_CORE]: {
    name: 'Dense Core',
    glyph: '◉',
    color: '#ef4444',
    desc: 'The largest ring is dense: moving it costs 3 energy.',
    weight: 1,
  },
  [VariationType.MIRROR]: {
    name: 'Mirror',
    glyph: '⟷',
    color: '#06b6d4',
    desc: 'The tower starts on peg C. Deliver it to peg A.',
    weight: 1,
  },
};

export const ANOMALY_ORDER = Object.values(VariationType);

// Anomalies that both rewrite start/goal cannot be combined.
export const ANOMALY_CONFLICTS: [VariationType, VariationType][] = [
  [VariationType.TARGET_SWAP, VariationType.MIRROR],
];

export interface BossInfo {
  name: string;
  anomalies: VariationType[];
  quote: string;
}

export const BOSSES: BossInfo[] = [
  {
    name: 'The Event Horizon',
    anomalies: [VariationType.FOG_OF_WAR, VariationType.HEAVY_RINGS],
    quote: 'What crosses me is never seen again.',
  },
  {
    name: "Maxwell's Daemon",
    anomalies: [VariationType.HEAVY_RINGS, VariationType.DENSE_CORE],
    quote: 'I sort the fast from the slow. Do you?',
  },
  {
    name: 'The Great Filter',
    anomalies: [VariationType.TARGET_SWAP, VariationType.FOG_OF_WAR],
    quote: 'Every civilisation stops here.',
  },
  {
    name: "Schrödinger's Tower",
    anomalies: [VariationType.WORMHOLE, VariationType.HEAVY_RINGS, VariationType.FOG_OF_WAR],
    quote: 'Solved and unsolved, until you look.',
  },
  {
    name: 'Heat Death',
    anomalies: [VariationType.FOG_OF_WAR, VariationType.HEAVY_RINGS, VariationType.DENSE_CORE],
    quote: 'All order ends. Yours too.',
  },
];

export const bossFor = (round: number): { name: string; info: BossInfo } => {
  const index = Math.floor(round / BOSS_EVERY) - 1;
  const info = BOSSES[index % BOSSES.length];
  const cycle = Math.floor(index / BOSSES.length);
  return { info, name: cycle === 0 ? info.name : `${info.name} MK${cycle + 1}` };
};

// ---------------------------------------------------------------------------
// Directives (optional per-round goals)
// ---------------------------------------------------------------------------
export const DIRECTIVE_INFO: Record<DirectiveType, { name: string; glyph: string; color: string }> = {
  FLAWLESS: { name: 'Flawless', glyph: '✦', color: '#e879f9' },
  THRIFTY: { name: 'Thrifty', glyph: '◆', color: '#22d3ee' },
  SPEED: { name: 'Race', glyph: '⧖', color: '#fbbf24' },
  PURE: { name: 'Pure Mind', glyph: '◇', color: '#34d399' },
};

export const directiveText = (type: DirectiveType, target: number): string => {
  switch (type) {
    case 'FLAWLESS':
      return 'Solve using exactly the minimum energy.';
    case 'THRIFTY':
      return `Waste at most ${target} energy.`;
    case 'SPEED':
      return `Solve within ${target} seconds.`;
    case 'PURE':
      return 'Solve without using any powers.';
  }
};

// ---------------------------------------------------------------------------
// Powers (active abilities, bought as charges)
// ---------------------------------------------------------------------------
export interface PowerInfo {
  name: string;
  glyph: string;
  key: string;
  color: string;
  desc: string;
  price: number;
  blitzOnly?: boolean;
}

export const POWER_INFO: Record<PowerId, PowerInfo> = {
  REWIND: {
    name: 'Rewind',
    glyph: '↺',
    key: 'Z',
    color: '#22d3ee',
    desc: 'Undo your last move and get its energy back.',
    price: 120,
  },
  LENS: {
    name: 'Oracle Lens',
    glyph: '◎',
    key: 'H',
    color: '#fbbf24',
    desc: 'Reveals the best next move from the current position.',
    price: 100,
  },
  PARADOX: {
    name: 'Paradox',
    glyph: '✧',
    key: 'P',
    color: '#e879f9',
    desc: 'Your next move may place a ring on a smaller one.',
    price: 200,
  },
  CHRONO: {
    name: 'Chrono Charge',
    glyph: '⧖',
    key: 'C',
    color: '#34d399',
    desc: 'Adds 20 seconds to this round’s par time.',
    price: 120,
    blitzOnly: true,
  },
};

export const POWER_ORDER: PowerId[] = ['REWIND', 'LENS', 'PARADOX', 'CHRONO'];

// ---------------------------------------------------------------------------
// Relics (passive, once per run)
// ---------------------------------------------------------------------------
export type Rarity = 'common' | 'rare' | 'legendary';

export interface RelicInfo {
  name: string;
  glyph: string;
  rarity: Rarity;
  desc: string;
  cost: number;
  blitzOnly?: boolean;
}

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#94a3b8',
  rare: '#38bdf8',
  legendary: '#f0abfc',
};

export const RELIC_INFO: Record<RelicId, RelicInfo> = {
  HEAT_SINK: {
    name: 'Heat Sink',
    glyph: '❄',
    rarity: 'common',
    desc: 'Heavy Rings no longer cost extra energy.',
    cost: 250,
  },
  CLEAR_LENS: {
    name: 'Clear Lens',
    glyph: '◍',
    rarity: 'common',
    desc: 'See through the Fog of War (buried rings shown faintly).',
    cost: 250,
  },
  SALVAGER: {
    name: 'Salvager',
    glyph: '♻',
    rarity: 'common',
    desc: 'Each unspent energy left after a round becomes +2 Bits.',
    cost: 350,
  },
  VAULT: {
    name: 'Bit Vault',
    glyph: '◈',
    rarity: 'common',
    desc: 'Earn 5% interest on held Bits after every round (max +120).',
    cost: 350,
  },
  LUCKY_DICE: {
    name: 'Quantum Dice',
    glyph: '⚄',
    rarity: 'common',
    desc: '+1 shop offer and rerolls cost half as much.',
    cost: 300,
  },
  CHRONO_COIL: {
    name: 'Chrono Coil',
    glyph: '⧖',
    rarity: 'common',
    desc: 'Par time is 50% longer.',
    cost: 300,
    blitzOnly: true,
  },
  DAEMON: {
    name: "Maxwell's Demon",
    glyph: '☿',
    rarity: 'rare',
    desc: 'Perfect rounds refund 3 energy.',
    cost: 450,
  },
  CATALYST: {
    name: 'Catalyst',
    glyph: '✺',
    rarity: 'rare',
    desc: 'Perfect rounds raise your combo by +0.2 instead of +0.1.',
    cost: 400,
  },
  ECHO: {
    name: 'Echo Chamber',
    glyph: '↺',
    rarity: 'rare',
    desc: 'Perfect rounds recharge 1 Rewind.',
    cost: 400,
  },
  OVERCLOCKER: {
    name: 'Overclocker',
    glyph: '⚡',
    rarity: 'legendary',
    desc: '+50% Bits from every round, but 10% less energy refill.',
    cost: 450,
  },
  FAILSAFE: {
    name: 'Reboot Core',
    glyph: '⟳',
    rarity: 'legendary',
    desc: 'Once per run, running dry reboots the round instead of ending the run.',
    cost: 650,
  },
};

export const RELIC_ORDER = Object.keys(RELIC_INFO) as RelicId[];

// ---------------------------------------------------------------------------
// Stackable shop upgrades
// ---------------------------------------------------------------------------
export const UPGRADE_INFO: Record<UpgradeId, { name: string; glyph: string; desc: string; cost: number }> = {
  LOGIC: { name: 'Logic Optimization', glyph: '+', desc: '+2 Moves per round refill', cost: 150 },
  CACHE: { name: 'Cache Expansion', glyph: '%', desc: '+10% Move refill', cost: 250 },
  MINER: { name: 'Bit Miner', glyph: '₿', desc: '+20% Base Bits earned', cost: 300 },
  SHIELD: { name: 'Combo Shield', glyph: '⛨', desc: 'Absorb the next combo loss', cost: 500 },
};

// ---------------------------------------------------------------------------
// Archive (permanent meta upgrades, paid in Shards)
// ---------------------------------------------------------------------------
export interface MetaDef {
  key: MetaKey;
  name: string;
  glyph: string;
  desc: string;
  max: number;
  baseCost: number;
  step: number;
  format: (level: number) => string;
}

export const META_DEFS: MetaDef[] = [
  {
    key: 'overclock',
    name: 'Overclock Start',
    glyph: '⚡',
    desc: 'Higher starting move multiplier (+0.1x per level)',
    max: 10,
    baseCost: 1,
    step: 1,
    format: (l) => `${(1.5 + 0.1 * l).toFixed(1)}x`,
  },
  {
    key: 'comboRetention',
    name: 'Combo Retention',
    glyph: '✦',
    desc: 'Begin every run with a higher combo (+0.2 per level)',
    max: 5,
    baseCost: 1,
    step: 1,
    format: (l) => `${(1 + 0.2 * l).toFixed(1)}x`,
  },
  {
    key: 'interest',
    name: 'Compound Interest',
    glyph: '%',
    desc: 'Unused moves generate interest (+1% per level)',
    max: 10,
    baseCost: 1,
    step: 1,
    format: (l) => `${l}%`,
  },
  {
    key: 'coreEfficiency',
    name: 'Core Efficiency',
    glyph: '⚙',
    desc: 'Flat bonus to moves per round (+1 per level)',
    max: 5,
    baseCost: 2,
    step: 1,
    format: (l) => `+${l}`,
  },
  {
    key: 'rewindModule',
    name: 'Rewind Module',
    glyph: '↺',
    desc: 'Begin each run with +1 Rewind charge',
    max: 3,
    baseCost: 2,
    step: 2,
    format: (l) => `${l} charge${l === 1 ? '' : 's'}`,
  },
  {
    key: 'lensModule',
    name: 'Lens Module',
    glyph: '◎',
    desc: 'Begin each run with +1 Oracle Lens charge',
    max: 3,
    baseCost: 2,
    step: 2,
    format: (l) => `${l} charge${l === 1 ? '' : 's'}`,
  },
  {
    key: 'seedCapital',
    name: 'Seed Capital',
    glyph: '₿',
    desc: 'Begin each run with +75 Bits',
    max: 5,
    baseCost: 1,
    step: 1,
    format: (l) => `+${l * 75} Bits`,
  },
  {
    key: 'bazaar',
    name: 'Bazaar License',
    glyph: '◫',
    desc: 'Shops stock +1 extra offer',
    max: 2,
    baseCost: 3,
    step: 3,
    format: (l) => `+${l} offer${l === 1 ? '' : 's'}`,
  },
];

export const metaCost = (def: MetaDef, level: number): number => def.baseCost + def.step * level;

export const INITIAL_META_LEVELS: Record<MetaKey, number> = {
  overclock: 0,
  comboRetention: 0,
  interest: 0,
  coreEfficiency: 0,
  rewindModule: 0,
  lensModule: 0,
  seedCapital: 0,
  bazaar: 0,
};
