import { Peg } from '../types';

export interface CostRules {
  rings: number;
  heavy: boolean; // every 3rd move costs +1
  dense: boolean; // the largest ring costs 3 to move
}

export interface SolveConfig extends CostRules {
  pegs: number;
  goalPeg: number;
}

/** Energy cost of moving `ring` as the `moveNumber`-th (1-based) move of the round. */
export const moveCost = (rules: CostRules, ring: number, moveNumber: number): number => {
  let cost = rules.dense && ring === rules.rings ? 3 : 1;
  if (rules.heavy && moveNumber % 3 === 0) cost += 1;
  return cost;
};

export const pegsToPositions = (pegs: Peg[], rings: number): number[] => {
  const pos = new Array<number>(rings).fill(0);
  pegs.forEach((peg, idx) => peg.forEach((r) => (pos[r - 1] = idx)));
  return pos;
};

export interface Solution {
  cost: number;
  path: [number, number][];
}

/**
 * Cheapest way to bring every ring to `goalPeg`, honouring per-move energy costs.
 * Dijkstra (bucket queue) over (ring positions, move-number mod 3) – at most 4^8 * 3 states.
 */
export const solve = (cfg: SolveConfig, pegs: Peg[], movesMade = 0): Solution | null => {
  const n = cfg.rings;
  const P = cfg.pegs;
  const phases = cfg.heavy ? 3 : 1;
  const pow = new Array<number>(n + 1);
  pow[0] = 1;
  for (let i = 1; i <= n; i++) pow[i] = pow[i - 1] * P;
  const total = pow[n];

  const pos = pegsToPositions(pegs, n);
  let startCode = 0;
  for (let i = 0; i < n; i++) startCode += pos[i] * pow[i];
  let goalCode = 0;
  for (let i = 0; i < n; i++) goalCode += cfg.goalPeg * pow[i];

  const startPhase = cfg.heavy ? movesMade % 3 : 0;
  const startIdx = startCode * phases + startPhase;

  const INF = 0x3fffffff;
  const dist = new Int32Array(total * phases).fill(INF);
  const parent = new Int32Array(total * phases).fill(-1);
  const pmove = new Uint8Array(total * phases);
  const buckets: number[][] = [];
  const push = (d: number, s: number) => {
    (buckets[d] ||= []).push(s);
  };

  dist[startIdx] = 0;
  push(0, startIdx);
  let pending = 1;
  let foundIdx = -1;
  const tops = new Int8Array(P);
  const digits = new Int8Array(n);

  for (let d = 0; pending > 0 && foundIdx < 0; d++) {
    const bucket = buckets[d];
    if (!bucket) continue;
    for (let k = 0; k < bucket.length; k++) {
      pending--;
      const s = bucket[k];
      if (dist[s] !== d) continue;
      const code = Math.floor(s / phases);
      const phase = s % phases;
      if (code === goalCode) {
        foundIdx = s;
        break;
      }
      let c = code;
      for (let i = 0; i < n; i++) {
        digits[i] = c % P;
        c = Math.floor(c / P);
      }
      tops.fill(0);
      for (let i = 0; i < n; i++) if (tops[digits[i]] === 0) tops[digits[i]] = i + 1;

      const moveNumber = cfg.heavy ? phase + 1 : 1;
      const nextPhase = cfg.heavy ? (phase + 1) % 3 : 0;
      for (let a = 0; a < P; a++) {
        const r = tops[a];
        if (r === 0) continue;
        const cost = moveCost(cfg, r, moveNumber);
        for (let b = 0; b < P; b++) {
          if (b === a) continue;
          if (tops[b] !== 0 && tops[b] < r) continue;
          const ns = (code + (b - a) * pow[r - 1]) * phases + nextPhase;
          const nd = d + cost;
          if (nd < dist[ns]) {
            dist[ns] = nd;
            parent[ns] = s;
            pmove[ns] = a * P + b;
            push(nd, ns);
            pending++;
          }
        }
      }
    }
    buckets[d] = [];
  }

  if (foundIdx < 0) return null;
  const path: [number, number][] = [];
  for (let s = foundIdx; s !== startIdx; s = parent[s]) {
    const m = pmove[s];
    path.push([Math.floor(m / P), m % P]);
  }
  path.reverse();
  return { cost: dist[foundIdx], path };
};
