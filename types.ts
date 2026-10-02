export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  DRAFT = 'DRAFT',
  META_SHOP = 'META_SHOP',
  CODEX = 'CODEX',
  GAME_OVER = 'GAME_OVER',
}

export enum GameMode {
  ASCENT = 'ASCENT',
  ENTROPY = 'ENTROPY',
  BLITZ = 'BLITZ',
  DAILY = 'DAILY',
}

export enum VariationType {
  STANDARD = 'STANDARD',
  TARGET_SWAP = 'TARGET_SWAP',
  FOG_OF_WAR = 'FOG_OF_WAR',
  HEAVY_RINGS = 'HEAVY_RINGS',
  WORMHOLE = 'WORMHOLE',
  DENSE_CORE = 'DENSE_CORE',
  MIRROR = 'MIRROR',
}

export type Peg = number[]; // Array of ring sizes (1 is smallest), bottom -> top

export type RelicId =
  | 'HEAT_SINK'
  | 'CLEAR_LENS'
  | 'DAEMON'
  | 'SALVAGER'
  | 'OVERCLOCKER'
  | 'FAILSAFE'
  | 'CATALYST'
  | 'CHRONO_COIL'
  | 'LUCKY_DICE'
  | 'VAULT'
  | 'ECHO';

export type PowerId = 'REWIND' | 'LENS' | 'PARADOX' | 'CHRONO';
export type UpgradeId = 'LOGIC' | 'CACHE' | 'MINER' | 'SHIELD';
export type DirectiveType = 'FLAWLESS' | 'THRIFTY' | 'SPEED' | 'PURE';
export type MetaKey =
  | 'overclock'
  | 'comboRetention'
  | 'interest'
  | 'coreEfficiency'
  | 'rewindModule'
  | 'lensModule'
  | 'seedCapital'
  | 'bazaar';

export type PowerCharges = Record<PowerId, number>;

export interface MetaUpgrades {
  startBufferMultiplier: number; // Default 1.5
  comboRetention: number; // Default 1.0
  interestRate: number; // Default 0
  minMoveBonus: number; // Flat bonus to refill
  startRewind: number;
  startLens: number;
  startBits: number;
  shopSlots: number; // extra shop offers
}

export interface RunUpgrades {
  flatRefillBonus: number;
  percentRefillBonus: number;
  baseBitMultiplier: number;
  comboShield: boolean;
}

export interface MoveBreakdown {
  required: number;
  carryover: number;
  bonus: number;
}

export interface Directive {
  type: DirectiveType;
  target: number; // meaning depends on type (extra energy allowed / seconds)
  rewardPct: number; // fraction of the round's base bits awarded on success
}

export interface RoundSetup {
  round: number;
  tier: number;
  ringCount: number;
  anomalies: VariationType[];
  pegCount: number;
  startPeg: number;
  goalPeg: number;
  pegs: Peg[]; // starting layout
  scrambled: boolean;
  isBoss: boolean;
  bossName?: string;
  required: number; // minimum energy needed to solve optimally
  par: number; // par time in seconds
  directive: Directive;
}

export interface MoveRecord {
  from: number;
  to: number;
  cost: number;
  paradox: boolean;
}

export interface RoundReport {
  round: number;
  isBoss: boolean;
  over: number; // energy spent beyond the optimum
  perfect: boolean;
  comboBefore: number;
  comboAfter: number;
  shielded: boolean;
  buffered: boolean;
  baseBits: number;
  penalty: number;
  roundBits: number; // base bits after penalty and combo
  directive: Directive;
  directiveMet: boolean;
  directiveBonus: number;
  salvage: number;
  interest: number;
  refund: number; // energy refunded by relics
  timeSec: number;
  shards: number;
  totalBits: number; // total bits gained this round
}

export interface RunStats {
  perfects: number;
  perfectStreak: number;
  bestStreak: number;
  directivesDone: number;
  bosses: number;
  bestCombo: number;
  roundsCleared: number;
  lastGasp: boolean;
  maxRingsCleared: number;
  powersUsed: number;
}

export interface ShopOffer {
  uid: string;
  kind: 'upgrade' | 'power' | 'relic';
  ref: string; // UpgradeId | PowerId | RelicId
  cost: number;
  sold: boolean;
}

export interface RunState {
  mode: GameMode;
  seed: number;
  phase: GameState; // PLAYING | SHOP | DRAFT | META_SHOP | GAME_OVER
  round: number;
  setup: RoundSetup;
  pegs: Peg[];
  history: MoveRecord[];
  energy: number;
  maxEnergy: number;
  roundStartEnergy: number;
  breakdown: MoveBreakdown;
  energyUsed: number;
  elapsed: number;
  parBonus: number;
  leakAcc: number;
  bits: number;
  score: number;
  combo: number;
  upgrades: RunUpgrades;
  relics: RelicId[];
  powers: PowerCharges;
  paradoxArmed: boolean;
  hint: [number, number] | null;
  powerUsedThisRound: boolean;
  failsafeUsed: boolean;
  report: RoundReport | null;
  offers: ShopOffer[];
  rerolls: number;
  draft: RelicId[];
  stats: RunStats;
  shardsEarned: number;
}

export interface Profile {
  version: number;
  shards: number;
  meta: Record<MetaKey, number>;
  achievements: Record<string, number>;
  stats: {
    runs: number;
    totalScore: number;
    perfects: number;
    bosses: number;
    directives: number;
    bestRound: Record<GameMode, number>;
    bestScore: Record<GameMode, number>;
    modesPlayed: GameMode[];
  };
  daily: Record<string, { round: number; score: number }>;
  settings: { muted: boolean; seenHelp: boolean };
}
