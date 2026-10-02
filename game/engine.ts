import {
  ANOMALY_CONFLICTS,
  ANOMALY_INFO,
  ANOMALY_ORDER,
  BOSS_EVERY,
  INITIAL_META_LEVELS,
  INITIAL_RUN_UPGRADES,
  MAX_CHARGES,
  MAX_RINGS_CAP,
  META_DEFS,
  POWER_INFO,
  POWER_ORDER,
  RELIC_INFO,
  RELIC_ORDER,
  UPGRADE_INFO,
  bossFor,
  calculateRingCount,
  getTier,
} from '../constants';
import {
  Directive,
  DirectiveType,
  GameMode,
  GameState,
  MetaKey,
  MetaUpgrades,
  Peg,
  PowerCharges,
  PowerId,
  RelicId,
  RoundReport,
  RoundSetup,
  RunState,
  RunStats,
  ShopOffer,
  UpgradeId,
  VariationType,
} from '../types';
import { Rng, makeRng, pickWeighted, shuffle } from '../services/rng';
import { CostRules, SolveConfig, moveCost, solve } from '../services/solver';

export type GameEvent =
  | { type: 'move'; paradox: boolean; cost: number }
  | { type: 'win'; report: RoundReport }
  | { type: 'defeat' }
  | { type: 'failsafe' }
  | { type: 'leak' }
  | { type: 'power'; power: PowerId };

export type MoveStatus = 'ok' | 'invalid' | 'noEnergy' | 'ignored';

export interface Outcome {
  run: RunState;
  status: MoveStatus;
  events: GameEvent[];
}

export const hasRelic = (relics: RelicId[], id: RelicId) => relics.includes(id);
export const totalCharges = (powers: PowerCharges) =>
  powers.REWIND + powers.LENS + powers.PARADOX + powers.CHRONO;

// ---------------------------------------------------------------------------
// Meta (Archive) -> effective values
// ---------------------------------------------------------------------------
export const getMetaEffects = (levels: Record<MetaKey, number>): MetaUpgrades => ({
  startBufferMultiplier: 1.5 + 0.1 * levels.overclock,
  comboRetention: 1.0 + 0.2 * levels.comboRetention,
  interestRate: 0.01 * levels.interest,
  minMoveBonus: levels.coreEfficiency,
  startRewind: levels.rewindModule,
  startLens: levels.lensModule,
  startBits: 75 * levels.seedCapital,
  shopSlots: levels.bazaar,
});

export const DEFAULT_META_EFFECTS = getMetaEffects(INITIAL_META_LEVELS);
export const META_KEYS = META_DEFS.map((d) => d.key);

// ---------------------------------------------------------------------------
// Rules helpers
// ---------------------------------------------------------------------------
export const rulesOf = (setup: RoundSetup, relics: RelicId[]): CostRules => ({
  rings: setup.ringCount,
  heavy: setup.anomalies.includes(VariationType.HEAVY_RINGS) && !hasRelic(relics, 'HEAT_SINK'),
  dense: setup.anomalies.includes(VariationType.DENSE_CORE),
});

export const isCanonical = (pegs: Peg[]) =>
  pegs.every((peg) => peg.every((ring, i) => i === 0 || peg[i - 1] > ring));

const isSolved = (pegs: Peg[], goalPeg: number, rings: number) => {
  const goal = pegs[goalPeg];
  return goal.length === rings && goal.every((r, i) => r === rings - i);
};

const emptyPegs = (n: number): Peg[] => Array.from({ length: n }, () => []);
const clonePegs = (pegs: Peg[]): Peg[] => pegs.map((p) => [...p]);

// ---------------------------------------------------------------------------
// Round generation (deterministic from seed + round)
// ---------------------------------------------------------------------------
const DIRECTIVE_WEIGHTS: Record<DirectiveType, number> = {
  FLAWLESS: 3,
  THRIFTY: 3,
  SPEED: 3,
  PURE: 2,
};

const pickAnomalies = (rng: Rng, round: number): VariationType[] => {
  if (round === 1) return [VariationType.STANDARD];
  const first = pickWeighted(rng, ANOMALY_ORDER, (a) => ANOMALY_INFO[a].weight);
  const list = [first];
  if (first !== VariationType.STANDARD && round > 10 && rng() < 0.3) {
    const options = ANOMALY_ORDER.filter(
      (a) =>
        a !== VariationType.STANDARD &&
        a !== first &&
        !ANOMALY_CONFLICTS.some(([x, y]) => (x === a && y === first) || (y === a && x === first)),
    );
    list.push(options[Math.floor(rng() * options.length)]);
  }
  return list;
};

export const generateSetup = (
  mode: GameMode,
  seed: number,
  round: number,
  relics: RelicId[],
  hasPowers: boolean,
): RoundSetup => {
  const rng = makeRng(seed, 'round', round);
  const isBoss = round % BOSS_EVERY === 0;
  const ringCount = Math.min(calculateRingCount(round) + (isBoss ? 1 : 0), MAX_RINGS_CAP);

  let anomalies: VariationType[];
  let bossName: string | undefined;
  if (isBoss) {
    const boss = bossFor(round);
    anomalies = [...boss.info.anomalies];
    bossName = boss.name;
  } else {
    anomalies = pickAnomalies(rng, round);
  }

  const pegCount = anomalies.includes(VariationType.WORMHOLE) ? 4 : 3;
  let startPeg = 0;
  let goalPeg = 2;
  if (anomalies.includes(VariationType.TARGET_SWAP)) goalPeg = 1;
  if (anomalies.includes(VariationType.MIRROR)) {
    startPeg = 2;
    goalPeg = 0;
  }

  const scrambled = mode === GameMode.ENTROPY || (mode === GameMode.DAILY && rng() < 0.4);
  const pegs = emptyPegs(pegCount);
  if (scrambled) {
    let pos: number[] = [];
    for (let attempt = 0; attempt < 50; attempt++) {
      pos = Array.from({ length: ringCount }, () => Math.floor(rng() * pegCount));
      const distinct = new Set(pos).size;
      const solved = pos.every((p) => p === goalPeg);
      if (distinct >= 2 && !solved) break;
    }
    for (let r = ringCount; r >= 1; r--) pegs[pos[r - 1]].push(r);
  } else {
    for (let r = ringCount; r >= 1; r--) pegs[startPeg].push(r);
  }

  const rules = rulesOf({ ringCount, anomalies } as RoundSetup, relics);
  const solution = solve({ ...rules, pegs: pegCount, goalPeg }, pegs, 0);
  const required = solution ? solution.cost : Math.pow(2, ringCount) - 1;
  const par = Math.ceil((12 + required) * (hasRelic(relics, 'CHRONO_COIL') ? 1.5 : 1));

  // Directive
  const allowed = (Object.keys(DIRECTIVE_WEIGHTS) as DirectiveType[]).filter(
    (d) => d !== 'PURE' || hasPowers,
  );
  const type = pickWeighted(rng, allowed, (d) => DIRECTIVE_WEIGHTS[d]);
  const bossMult = isBoss ? 1.5 : 1;
  let directive: Directive;
  switch (type) {
    case 'FLAWLESS':
      directive = { type, target: 0, rewardPct: 0.6 * bossMult };
      break;
    case 'THRIFTY':
      directive = { type, target: Math.max(2, Math.ceil(required * 0.12)), rewardPct: 0.35 * bossMult };
      break;
    case 'SPEED':
      directive = { type, target: Math.ceil(par * 0.8), rewardPct: 0.45 * bossMult };
      break;
    default:
      directive = { type, target: 0, rewardPct: 0.4 * bossMult };
  }

  return {
    round,
    tier: getTier(round),
    ringCount,
    anomalies,
    pegCount,
    startPeg,
    goalPeg,
    pegs,
    scrambled,
    isBoss,
    bossName,
    required,
    par,
    directive,
  };
};

export const previewSetup = (run: RunState): RoundSetup =>
  generateSetup(run.mode, run.seed, run.round + 1, run.relics, totalCharges(run.powers) > 0);

// ---------------------------------------------------------------------------
// Run lifecycle
// ---------------------------------------------------------------------------
const INITIAL_STATS: RunStats = {
  perfects: 0,
  perfectStreak: 0,
  bestStreak: 0,
  directivesDone: 0,
  bosses: 0,
  bestCombo: 1,
  roundsCleared: 0,
  lastGasp: false,
  maxRingsCleared: 0,
  powersUsed: 0,
};

const beginRound = (run: RunState, meta: MetaUpgrades, isNewRun: boolean): RunState => {
  const round = isNewRun ? 1 : run.round + 1;
  const setup = generateSetup(run.mode, run.seed, round, run.relics, totalCharges(run.powers) > 0);
  const required = setup.required;
  const carry = isNewRun ? 0 : run.energy;

  let movesAdded: number;
  if (isNewRun) {
    movesAdded = Math.ceil(required * meta.startBufferMultiplier);
  } else {
    const base = required + meta.minMoveBonus + run.upgrades.flatRefillBonus;
    movesAdded = Math.floor(base * (1 + run.upgrades.percentRefillBonus));
    if (hasRelic(run.relics, 'OVERCLOCKER')) movesAdded = Math.floor(movesAdded * 0.95);
    if (meta.interestRate > 0) movesAdded += Math.floor(carry * meta.interestRate);
  }
  const total = carry + movesAdded;

  return {
    ...run,
    phase: GameState.PLAYING,
    round,
    setup,
    pegs: clonePegs(setup.pegs),
    history: [],
    energy: total,
    maxEnergy: Math.max(run.maxEnergy, total),
    roundStartEnergy: total,
    breakdown: { required, carryover: carry, bonus: Math.max(0, movesAdded - required) },
    energyUsed: 0,
    elapsed: 0,
    parBonus: 0,
    leakAcc: 0,
    paradoxArmed: false,
    hint: null,
    powerUsedThisRound: false,
    report: null,
    offers: [],
    rerolls: 0,
    draft: [],
  };
};

export const createRun = (mode: GameMode, seed: number, meta: MetaUpgrades): RunState => {
  const base: RunState = {
    mode,
    seed,
    phase: GameState.PLAYING,
    round: 0,
    setup: undefined as unknown as RoundSetup,
    pegs: [],
    history: [],
    energy: 0,
    maxEnergy: 0,
    roundStartEnergy: 0,
    breakdown: { required: 0, carryover: 0, bonus: 0 },
    energyUsed: 0,
    elapsed: 0,
    parBonus: 0,
    leakAcc: 0,
    bits: meta.startBits,
    score: 0,
    combo: meta.comboRetention,
    upgrades: { ...INITIAL_RUN_UPGRADES },
    relics: [],
    powers: { REWIND: meta.startRewind, LENS: meta.startLens, PARADOX: 0, CHRONO: 0 },
    paradoxArmed: false,
    hint: null,
    powerUsedThisRound: false,
    failsafeUsed: false,
    report: null,
    offers: [],
    rerolls: 0,
    draft: [],
    stats: { ...INITIAL_STATS, bestCombo: meta.comboRetention },
    shardsEarned: 0,
  };
  return beginRound(base, meta, true);
};

export const startNextRound = (run: RunState, meta: MetaUpgrades): RunState =>
  run.phase === GameState.SHOP ? beginRound(run, meta, false) : run;

// ---------------------------------------------------------------------------
// Moves
// ---------------------------------------------------------------------------
const fail = (run: RunState): Outcome => {
  if (hasRelic(run.relics, 'FAILSAFE') && !run.failsafeUsed) {
    return {
      run: {
        ...run,
        pegs: clonePegs(run.setup.pegs),
        history: [],
        energy: run.setup.required,
        roundStartEnergy: run.setup.required,
        energyUsed: 0,
        elapsed: 0,
        parBonus: 0,
        leakAcc: 0,
        paradoxArmed: false,
        hint: null,
        failsafeUsed: true,
      },
      status: 'ok',
      events: [{ type: 'failsafe' }],
    };
  }
  return { run: { ...run, phase: GameState.GAME_OVER, hint: null }, status: 'ok', events: [{ type: 'defeat' }] };
};

export const applyMove = (run: RunState, from: number, to: number, meta: MetaUpgrades): Outcome => {
  const ignored: Outcome = { run, status: 'ignored', events: [] };
  if (run.phase !== GameState.PLAYING || from === to) return ignored;
  const src = run.pegs[from];
  if (!src || src.length === 0) return ignored;

  const ring = src[src.length - 1];
  const dst = run.pegs[to];
  const topDst = dst.length > 0 ? dst[dst.length - 1] : Infinity;
  let paradox = false;
  if (ring > topDst) {
    if (!run.paradoxArmed) return { run, status: 'invalid', events: [] };
    paradox = true;
  }

  const cost = moveCost(rulesOf(run.setup, run.relics), ring, run.history.length + 1);
  if (cost > run.energy) return { run, status: 'noEnergy', events: [] };

  const pegs = clonePegs(run.pegs);
  pegs[from].pop();
  pegs[to].push(ring);

  let next: RunState = {
    ...run,
    pegs,
    energy: run.energy - cost,
    energyUsed: run.energyUsed + cost,
    history: [...run.history, { from, to, cost, paradox }],
    hint: null,
    paradoxArmed: paradox ? false : run.paradoxArmed,
    powers: paradox ? { ...run.powers, PARADOX: run.powers.PARADOX - 1 } : run.powers,
    powerUsedThisRound: run.powerUsedThisRound || paradox,
    stats: paradox ? { ...run.stats, powersUsed: run.stats.powersUsed + 1 } : run.stats,
  };
  const events: GameEvent[] = [{ type: 'move', paradox, cost }];

  if (isSolved(pegs, run.setup.goalPeg, run.setup.ringCount)) {
    const won = completeRound(next, meta);
    return { run: won.run, status: 'ok', events: [...events, ...won.events] };
  }
  if (next.energy <= 0) {
    const lost = fail(next);
    return { run: lost.run, status: 'ok', events: [...events, ...lost.events] };
  }
  return { run: next, status: 'ok', events };
};

// ---------------------------------------------------------------------------
// Round completion: scoring, combo, directive
// ---------------------------------------------------------------------------
const completeRound = (run: RunState, meta: MetaUpgrades): { run: RunState; events: GameEvent[] } => {
  const s = run.setup;
  const over = Math.max(0, run.energyUsed - s.required);
  const startBuffer = Math.max(0, run.roundStartEnergy - s.required);
  const perfect = over === 0;

  const comboBefore = run.combo;
  let combo = run.combo;
  let shielded = false;
  let buffered = false;
  let upgrades = run.upgrades;
  if (perfect) {
    combo += hasRelic(run.relics, 'CATALYST') ? 0.2 : 0.1;
  } else if (over <= startBuffer) {
    buffered = true; // protected by the starting buffer
  } else if (run.upgrades.comboShield) {
    shielded = true;
    upgrades = { ...upgrades, comboShield: false };
  } else {
    combo = Math.max(1.0, combo - 0.01 * (over - startBuffer));
  }

  const baseBits =
    100 * Math.sqrt(s.round) * upgrades.baseBitMultiplier * (hasRelic(run.relics, 'OVERCLOCKER') ? 1.6 : 1);
  const penalty = 20 * over;
  const roundBits = Math.max(0, baseBits - penalty) * combo;

  const d = s.directive;
  const directiveMet =
    (d.type === 'FLAWLESS' && over === 0) ||
    (d.type === 'THRIFTY' && over <= d.target) ||
    (d.type === 'SPEED' && run.elapsed <= d.target) ||
    (d.type === 'PURE' && !run.powerUsedThisRound);
  const directiveBonus = directiveMet ? Math.round(baseBits * d.rewardPct * combo) : 0;

  const salvage = hasRelic(run.relics, 'SALVAGER') ? run.energy * 2 : 0;
  const interest = hasRelic(run.relics, 'VAULT')
    ? Math.min(120, Math.floor((run.bits + roundBits + directiveBonus) * 0.05))
    : 0;
  const refund = perfect && hasRelic(run.relics, 'DAEMON') ? 3 : 0;
  const shards = s.isBoss ? 1 : 0;
  const totalBits = Math.round(roundBits + directiveBonus + salvage + interest);

  const report: RoundReport = {
    round: s.round,
    isBoss: s.isBoss,
    over,
    perfect,
    comboBefore,
    comboAfter: combo,
    shielded,
    buffered,
    baseBits,
    penalty,
    roundBits: Math.round(roundBits),
    directive: d,
    directiveMet,
    directiveBonus,
    salvage,
    interest,
    refund,
    timeSec: run.elapsed,
    shards,
    totalBits,
  };

  const stats: RunStats = {
    ...run.stats,
    perfects: run.stats.perfects + (perfect ? 1 : 0),
    perfectStreak: perfect ? run.stats.perfectStreak + 1 : 0,
    bestStreak: Math.max(run.stats.bestStreak, perfect ? run.stats.perfectStreak + 1 : 0),
    directivesDone: run.stats.directivesDone + (directiveMet ? 1 : 0),
    bosses: run.stats.bosses + (s.isBoss ? 1 : 0),
    bestCombo: Math.max(run.stats.bestCombo, combo),
    roundsCleared: s.round,
    lastGasp: run.stats.lastGasp || run.energy === 0,
    maxRingsCleared: Math.max(run.stats.maxRingsCleared, s.ringCount),
  };

  const powers = { ...run.powers };
  if (perfect && hasRelic(run.relics, 'ECHO')) powers.REWIND = Math.min(MAX_CHARGES, powers.REWIND + 1);

  let next: RunState = {
    ...run,
    upgrades,
    combo,
    bits: run.bits + totalBits,
    score: run.score + totalBits,
    energy: run.energy + refund,
    maxEnergy: Math.max(run.maxEnergy, run.energy + refund),
    powers,
    stats,
    report,
    hint: null,
    paradoxArmed: false,
    shardsEarned: run.shardsEarned + shards,
  };

  if (s.isBoss) {
    const draft = generateDraft(next);
    next = draft.length > 0
      ? { ...next, phase: GameState.DRAFT, draft }
      : { ...next, phase: GameState.META_SHOP };
  } else {
    next = enterShop(next, meta);
  }
  return { run: next, events: [{ type: 'win', report }] };
};

// ---------------------------------------------------------------------------
// Powers
// ---------------------------------------------------------------------------
const spend = (run: RunState, power: PowerId, patch: Partial<RunState>): RunState => ({
  ...run,
  ...patch,
  powers: { ...run.powers, [power]: run.powers[power] - 1 },
  powerUsedThisRound: true,
  stats: { ...run.stats, powersUsed: run.stats.powersUsed + 1 },
});

export const castRewind = (run: RunState): RunState | null => {
  if (run.phase !== GameState.PLAYING || run.powers.REWIND < 1 || run.history.length === 0) return null;
  const last = run.history[run.history.length - 1];
  const pegs = clonePegs(run.pegs);
  const ring = pegs[last.to].pop()!;
  pegs[last.from].push(ring);
  return spend(run, 'REWIND', {
    pegs,
    history: run.history.slice(0, -1),
    energy: run.energy + last.cost,
    energyUsed: run.energyUsed - last.cost,
    hint: null,
  });
};

export const castLens = (run: RunState): RunState | null => {
  if (run.phase !== GameState.PLAYING || run.powers.LENS < 1 || run.hint) return null;
  if (!isCanonical(run.pegs)) return null;
  const rules = rulesOf(run.setup, run.relics);
  const cfg: SolveConfig = { ...rules, pegs: run.setup.pegCount, goalPeg: run.setup.goalPeg };
  const sol = solve(cfg, run.pegs, run.history.length);
  if (!sol || sol.path.length === 0) return null;
  return spend(run, 'LENS', { hint: sol.path[0] });
};

export const castChrono = (run: RunState): RunState | null => {
  if (run.phase !== GameState.PLAYING || run.mode !== GameMode.BLITZ || run.powers.CHRONO < 1) return null;
  return spend(run, 'CHRONO', { parBonus: run.parBonus + 20 });
};

export const toggleParadox = (run: RunState): RunState | null => {
  if (run.phase !== GameState.PLAYING) return null;
  if (!run.paradoxArmed && run.powers.PARADOX < 1) return null;
  return { ...run, paradoxArmed: !run.paradoxArmed };
};

// ---------------------------------------------------------------------------
// Timer (par time / Blitz energy leak)
// ---------------------------------------------------------------------------
export const LEAK_SECONDS = 4;

export const parOf = (run: RunState) => run.setup.par + run.parBonus;

export const tick = (run: RunState, dt: number): { run: RunState; events: GameEvent[] } => {
  if (run.phase !== GameState.PLAYING) return { run, events: [] };
  const elapsed = run.elapsed + dt;
  let next: RunState = { ...run, elapsed };
  const events: GameEvent[] = [];
  if (run.mode === GameMode.BLITZ) {
    const par = parOf(run);
    const overtime = Math.max(0, elapsed - par) - Math.max(0, run.elapsed - par);
    let acc = run.leakAcc + overtime;
    while (acc >= LEAK_SECONDS) {
      acc -= LEAK_SECONDS;
      next = { ...next, energy: next.energy - 1 };
      events.push({ type: 'leak' });
      if (next.energy <= 0) {
        const lost = fail({ ...next, leakAcc: 0 });
        return { run: lost.run, events: [...events, ...lost.events] };
      }
    }
    next = { ...next, leakAcc: acc };
  }
  return { run: next, events };
};

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------
const inflation = (round: number) => 1 + 0.07 * (round - 1);
export const priceOf = (base: number, round: number) => Math.max(5, Math.round((base * inflation(round)) / 5) * 5);

export const shopSlots = (run: RunState, meta: MetaUpgrades) =>
  3 + meta.shopSlots + (hasRelic(run.relics, 'LUCKY_DICE') ? 1 : 0);

const RARITY_WEIGHT = { common: 3, rare: 2, legendary: 1 } as const;

const eligibleRelics = (run: RunState): RelicId[] =>
  RELIC_ORDER.filter(
    (id) => !hasRelic(run.relics, id) && (!RELIC_INFO[id].blitzOnly || run.mode === GameMode.BLITZ),
  );

export const generateOffers = (run: RunState, meta: MetaUpgrades, rerolls: number): ShopOffer[] => {
  const rng = makeRng(run.seed, 'shop', run.round, rerolls);
  const slots = shopSlots(run, meta);
  const round = run.round;

  const relicOffers: ShopOffer[] = eligibleRelics(run).map((ref) => ({
    uid: `relic:${ref}`,
    kind: 'relic',
    ref,
    cost: priceOf(RELIC_INFO[ref].cost, round),
    sold: false,
  }));
  const powerOffers: ShopOffer[] = POWER_ORDER.filter(
    (p) => !POWER_INFO[p].blitzOnly || run.mode === GameMode.BLITZ,
  ).map((ref) => ({
    uid: `power:${ref}`,
    kind: 'power',
    ref,
    cost: priceOf(POWER_INFO[ref].price, round),
    sold: false,
  }));
  const upgradeIds = (Object.keys(UPGRADE_INFO) as UpgradeId[]).filter(
    (u) => u !== 'SHIELD' || !run.upgrades.comboShield,
  );
  const upgradeOffers: ShopOffer[] = upgradeIds.map((ref) => ({
    uid: `upgrade:${ref}`,
    kind: 'upgrade',
    ref,
    cost: priceOf(UPGRADE_INFO[ref].cost, round),
    sold: false,
  }));

  const chosen: ShopOffer[] = [];
  const take = (pool: ShopOffer[], weight?: (o: ShopOffer) => number) => {
    const avail = pool.filter((o) => !chosen.some((c) => c.uid === o.uid));
    if (avail.length === 0) return;
    chosen.push(weight ? pickWeighted(rng, avail, weight) : avail[Math.floor(rng() * avail.length)]);
  };
  take(relicOffers, (o) => RARITY_WEIGHT[RELIC_INFO[o.ref as RelicId].rarity]);
  take(powerOffers);
  take(upgradeOffers);
  const rest = shuffle(rng, [...relicOffers, ...powerOffers, ...upgradeOffers]);
  for (const o of rest) {
    if (chosen.length >= slots) break;
    if (!chosen.some((c) => c.uid === o.uid)) chosen.push(o);
  }
  return chosen.slice(0, slots);
};

export const enterShop = (run: RunState, meta: MetaUpgrades): RunState => ({
  ...run,
  phase: GameState.SHOP,
  rerolls: 0,
  offers: generateOffers(run, meta, 0),
});

export const leaveMetaShop = (run: RunState, meta: MetaUpgrades): RunState =>
  run.phase === GameState.META_SHOP ? enterShop(run, meta) : run;

export const rerollCost = (run: RunState) =>
  Math.max(5, Math.round(priceOf(50, run.round) * (run.rerolls + 1) * (hasRelic(run.relics, 'LUCKY_DICE') ? 0.5 : 1)));

export const defragCost = (run: RunState) => priceOf(400, run.round);

export const rerollShop = (run: RunState, meta: MetaUpgrades): RunState | null => {
  const cost = rerollCost(run);
  if (run.phase !== GameState.SHOP || run.bits < cost) return null;
  const rerolls = run.rerolls + 1;
  return { ...run, bits: run.bits - cost, rerolls, offers: generateOffers(run, meta, rerolls) };
};

export const buyDefrag = (run: RunState, amount: number): RunState | null => {
  const cost = defragCost(run);
  if (run.phase !== GameState.SHOP || run.bits < cost) return null;
  return {
    ...run,
    bits: run.bits - cost,
    energy: run.energy + amount,
    maxEnergy: Math.max(run.maxEnergy, run.energy + amount),
  };
};

export const canBuy = (run: RunState, offer: ShopOffer): boolean => {
  if (offer.sold || run.bits < offer.cost) return false;
  if (offer.kind === 'power') return run.powers[offer.ref as PowerId] < MAX_CHARGES;
  if (offer.kind === 'relic') return !hasRelic(run.relics, offer.ref as RelicId);
  return true;
};

export const buyOffer = (run: RunState, uid: string): RunState | null => {
  const offer = run.offers.find((o) => o.uid === uid);
  if (!offer || run.phase !== GameState.SHOP || !canBuy(run, offer)) return null;
  let next: RunState = {
    ...run,
    bits: run.bits - offer.cost,
    offers: run.offers.map((o) => (o.uid === uid ? { ...o, sold: true } : o)),
  };
  if (offer.kind === 'relic') {
    next = { ...next, relics: [...next.relics, offer.ref as RelicId] };
  } else if (offer.kind === 'power') {
    const p = offer.ref as PowerId;
    next = { ...next, powers: { ...next.powers, [p]: Math.min(MAX_CHARGES, next.powers[p] + 1) } };
  } else {
    const u = offer.ref as UpgradeId;
    const up = { ...next.upgrades };
    if (u === 'LOGIC') up.flatRefillBonus += 2;
    if (u === 'CACHE') up.percentRefillBonus += 0.1;
    if (u === 'MINER') up.baseBitMultiplier += 0.2;
    if (u === 'SHIELD') up.comboShield = true;
    next = { ...next, upgrades: up };
  }
  return next;
};

// ---------------------------------------------------------------------------
// Relic draft (after every boss)
// ---------------------------------------------------------------------------
export const generateDraft = (run: RunState): RelicId[] => {
  const rng = makeRng(run.seed, 'draft', run.round);
  const pool = eligibleRelics(run);
  const picks: RelicId[] = [];
  while (picks.length < 3 && pool.length > 0) {
    const pick = pickWeighted(rng, pool, (id) => RARITY_WEIGHT[RELIC_INFO[id].rarity] + (run.round >= 10 ? 1 : 0));
    picks.push(pick);
    pool.splice(pool.indexOf(pick), 1);
  }
  return picks;
};

export const pickDraft = (run: RunState, id: RelicId): RunState | null => {
  if (run.phase !== GameState.DRAFT || !run.draft.includes(id)) return null;
  return { ...run, relics: [...run.relics, id], draft: [], phase: GameState.META_SHOP };
};

// ---------------------------------------------------------------------------
// End of run
// ---------------------------------------------------------------------------
/** Shards paid out when a run ends (bosses already paid out on the spot). */
export const runPayout = (run: RunState): number => Math.floor(run.stats.roundsCleared / 3);

export const totalRelicsOwned = (run: RunState) => run.relics.length;
