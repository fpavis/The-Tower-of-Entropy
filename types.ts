export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  META_SHOP = 'META_SHOP',
  GAME_OVER = 'GAME_OVER',
}

export enum VariationType {
  STANDARD = 'Standard',
  TARGET_SWAP = 'Target Swap (Move to Peg B)',
  FOG_OF_WAR = 'Fog of War',
  HEAVY_RINGS = 'Heavy Rings (Every 3rd move costs 2)',
  LOCKED_PEG = 'Locked Peg (Peg B max 2 rings)',
}

export interface MetaUpgrades {
  startBufferMultiplier: number; // Default 1.5
  comboRetention: number; // Default 1.0
  interestRate: number; // Default 0
  minMoveBonus: number; // Flat bonus to refill
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

export interface GameStats {
  round: number;
  ringCount: number;
  movesLeft: number;
  maxMoves: number; // For health bar visualization
  currentMinMoves: number; // The minimum moves required for the current round
  roundStartTotal: number; // To calculate buffer available at start
  moveBreakdown: MoveBreakdown;
  bits: number;
  combo: number;
  metaPoints: number;
  variation: VariationType;
}

export type Peg = number[]; // Array of ring sizes (1 is smallest)