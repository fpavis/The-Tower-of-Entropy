// Tiny deterministic RNG helpers so that Daily runs (and shop/round previews) are reproducible.

export const hashSeed = (...parts: (string | number)[]): number => {
  let h = 2166136261;
  for (const part of parts) {
    const s = String(part) + '|';
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return h >>> 0;
};

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type Rng = () => number;

export const makeRng = (seed: number, ...salt: (string | number)[]): Rng =>
  mulberry32(hashSeed(seed, ...salt));

export const pickWeighted = <T,>(rng: Rng, items: T[], weight: (t: T) => number): T => {
  const total = items.reduce((s, it) => s + weight(it), 0);
  let roll = rng() * total;
  for (const it of items) {
    roll -= weight(it);
    if (roll <= 0) return it;
  }
  return items[items.length - 1];
};

export const shuffle = <T,>(rng: Rng, items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const localDateKey = (d: Date = new Date()): string => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const dailySeed = (key: string = localDateKey()): number => hashSeed('entropy-daily', key);
export const randomSeed = (): number => (Math.random() * 0xffffffff) >>> 0;
