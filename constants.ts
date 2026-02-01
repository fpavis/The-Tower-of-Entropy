import { VariationType } from "./types";

export const MAX_RINGS_CAP = 8;
export const RINGS_PER_TIER = 5; // Increase rings every 5 levels
export const BASE_RINGS = 3;

export const INITIAL_META_UPGRADES = {
  startBufferMultiplier: 1.5,
  comboRetention: 1.0,
  interestRate: 0,
  minMoveBonus: 0,
};

export const INITIAL_RUN_UPGRADES = {
  flatRefillBonus: 0,
  percentRefillBonus: 0,
  baseBitMultiplier: 1.0,
  comboShield: false,
};

export const VARIATIONS_POOL = [
  VariationType.STANDARD,
  VariationType.STANDARD, // Weight standard higher
  VariationType.TARGET_SWAP,
  VariationType.FOG_OF_WAR,
  VariationType.HEAVY_RINGS,
]; // Locked peg is harder to implement in logic, keeping simple for v1

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
