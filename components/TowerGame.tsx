import React from 'react';
import { Peg, RoundSetup, VariationType } from '../types';
import { COLORS } from '../constants';

interface TowerGameProps {
  round: number;
  pegs: Peg[];
  setup: RoundSetup;
  selectedPeg: number | null;
  onPegClick: (index: number) => void;
  hint: [number, number] | null;
  clearLens: boolean;
  paradoxArmed: boolean;
  shake: { peg: number; n: number } | null;
  celebrate: boolean;
  accent: string;
}

const LETTERS = ['A', 'B', 'C', 'D'];

const TowerGame: React.FC<TowerGameProps> = ({
  round,
  pegs,
  setup,
  selectedPeg,
  onPegClick,
  hint,
  clearLens,
  paradoxArmed,
  shake,
  celebrate,
  accent,
}) => {
  const N = setup.ringCount;
  const P = setup.pegCount;
  const colW = 100 / P;
  const fog = setup.anomalies.includes(VariationType.FOG_OF_WAR);
  const dense = setup.anomalies.includes(VariationType.DENSE_CORE);

  const roleOf = (i: number) => {
    if (i === setup.goalPeg) return 'DEST';
    if (i === setup.startPeg && !setup.scrambled) return 'SRC';
    if (P === 4 && i === 3) return 'WORM';
    return 'AUX';
  };

  // Rings rendered in a stable (size) order so their DOM nodes never move and CSS transitions survive.
  const rings = Array.from({ length: N }, (_, k) => {
    const size = k + 1;
    const pegIdx = pegs.findIndex((p) => p.includes(size));
    const level = pegIdx >= 0 ? pegs[pegIdx].indexOf(size) : 0;
    return { size, pegIdx, level };
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-6 pb-12 select-none">
      <div
        className={`relative h-64 md:h-96 w-full rounded-xl transition-shadow duration-300 ${
          paradoxArmed ? 'shadow-[0_0_0_2px_rgba(232,121,249,0.7),0_0_40px_rgba(232,121,249,0.25)]' : ''
        }`}
        style={{ ['--rh' as string]: `min(30px, calc(100% / ${N + 2}))` }}
      >
        {paradoxArmed && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-fuchsia-300 font-display glitch">
            ✧ PARADOX ARMED ✧
          </div>
        )}

        {/* Pegs */}
        {pegs.map((peg, i) => {
          const isGoal = i === setup.goalPeg;
          const isSelected = selectedPeg === i;
          const isHintFrom = hint?.[0] === i;
          const isHintTo = hint?.[1] === i;
          return (
            <div
              key={`${i}-${shake?.peg === i ? shake.n : 0}`}
              role="button"
              aria-label={`Peg ${LETTERS[i]} (${roleOf(i)})`}
              onClick={() => onPegClick(i)}
              className={`group absolute top-0 bottom-0 cursor-pointer rounded-lg transition-colors duration-200 ${
                shake?.peg === i ? 'peg-shake' : ''
              } ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'} ${isHintFrom ? 'hint-pulse' : ''} ${
                isHintTo ? 'outline outline-2 outline-dashed outline-amber-400/80 -outline-offset-2' : ''
              }`}
              style={{ left: `${i * colW}%`, width: `${colW}%` }}
            >
              {/* pole */}
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-[6px] top-4 w-2 md:w-3 rounded-t-full -z-0"
                style={{
                  background: isGoal
                    ? `linear-gradient(to top, ${accent}, ${accent}33)`
                    : 'linear-gradient(to top, #475569, #33415588)',
                  boxShadow: isGoal ? `0 0 18px ${accent}66` : 'none',
                  opacity: isGoal ? 0.85 : 0.6,
                }}
              />
              {/* base */}
              <div
                className="absolute bottom-0 left-3 right-3 h-[6px] rounded-full"
                style={{ background: isGoal ? accent : isSelected ? '#22d3ee' : '#475569', opacity: isGoal ? 0.9 : 1 }}
              />
              {/* goal beacon */}
              {isGoal && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-0 text-sm md:text-base leading-none"
                  style={{ color: accent, textShadow: `0 0 10px ${accent}` }}
                >
                  ◎
                </div>
              )}
              {/* empty-peg drop hint */}
              {selectedPeg !== null && selectedPeg !== i && peg.length === 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-3 w-8 h-8 rounded-full border-2 border-dashed border-white/30 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
              )}
              {/* label */}
              <div className="absolute top-full mt-2 w-full text-center text-[10px] md:text-xs font-display tracking-widest">
                <span className={isGoal ? 'text-white' : 'text-slate-400'} style={isGoal ? { color: accent } : undefined}>
                  {LETTERS[i]} <span className="opacity-70">· {roleOf(i)}</span>
                </span>
                <span className="hidden md:inline text-slate-600 ml-1">[{i + 1}]</span>
              </div>
            </div>
          );
        })}

        {/* Rings */}
        {rings.map(({ size, pegIdx, level }) => {
          if (pegIdx < 0) return null;
          const peg = pegs[pegIdx];
          const isTop = level === peg.length - 1;
          const lifted = selectedPeg === pegIdx && isTop;
          const fogged = fog && !isTop;
          const hidden = fogged && !clearLens;
          const shownSize = hidden ? peg[peg.length - 1] : size;
          const color = COLORS[(hidden ? shownSize : size) - 1] || '#fff';
          const widthPct = colW * (0.2 + (shownSize / N) * 0.7);
          const isDense = dense && size === N;
          const bottom = lifted ? `calc(6px + var(--rh) * ${N + 0.6})` : `calc(6px + var(--rh) * ${level})`;

          return (
            <div
              key={`${round}-${size}`}
              className={`ring-enter absolute rounded-full pointer-events-none flex items-center justify-center ${
                celebrate ? 'win-pulse' : ''
              }`}
              style={{
                left: `${(pegIdx + 0.5) * colW}%`,
                bottom,
                width: `${widthPct}%`,
                height: 'calc(var(--rh) - 3px)',
                transform: 'translateX(-50%)',
                animationDelay: celebrate ? `${size * 90}ms` : `${size * 45}ms`,
                backgroundColor: hidden ? '#334155' : color,
                backgroundImage: hidden
                  ? 'none'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0) 52%, rgba(0,0,0,0.28) 100%)',
                opacity: hidden ? 0.35 : fogged ? 0.55 : 1,
                boxShadow: hidden
                  ? 'inset 0 0 0 1px #475569'
                  : `0 0 ${lifted ? 22 : 12}px ${color}${lifted ? 'cc' : '80'}, inset 0 0 0 1px rgba(255,255,255,0.28)`,
                border: isDense ? '2px solid rgba(239,68,68,0.95)' : undefined,
                transition: lifted
                  ? 'left 240ms ease, bottom 170ms ease-out, width 200ms, opacity 200ms, box-shadow 200ms'
                  : 'left 280ms cubic-bezier(.4,0,.2,1), bottom 230ms ease-in 170ms, width 200ms, opacity 200ms, background-color 200ms, box-shadow 200ms',
                zIndex: lifted ? 20 : 10,
              }}
            >
              {!hidden && (
                <span className="font-display text-[9px] md:text-[11px] font-bold text-black/55 leading-none">
                  {isDense ? `${size}·3` : size}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TowerGame;
