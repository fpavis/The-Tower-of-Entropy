import React from 'react';
import { GameMode, GameState, PowerId, RunState, VariationType } from '../types';
import {
  ANOMALY_INFO,
  DIRECTIVE_INFO,
  MODE_INFO,
  POWER_INFO,
  POWER_ORDER,
  RELIC_INFO,
  RARITY_COLOR,
  Zone,
  directiveText,
} from '../constants';
import { parOf, rulesOf } from '../game/engine';

interface HUDProps {
  run: RunState;
  zone: Zone;
  onPower: (power: PowerId) => void;
}

export const fmtTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const HUD: React.FC<HUDProps> = ({ run, zone, onPower }) => {
  const { setup } = run;
  const required = setup.required;

  // Calculate widths for the segmented bar
  const max = Math.max(run.maxEnergy, 1);
  const minMovesCount = Math.min(run.energy, required);
  const bufferMovesCount = Math.max(0, run.energy - required);
  const minMovesPct = (minMovesCount / max) * 100;
  const bufferMovesPct = (bufferMovesCount / max) * 100;

  // Function to create tick mark style based on count
  const getTickStyle = (count: number) => {
    if (count <= 0 || count > 50) return {};
    return {
      backgroundImage:
        'linear-gradient(90deg, transparent 0%, transparent calc(100% - 1px), rgba(0,0,0,0.3) calc(100% - 1px))',
      backgroundSize: `${100 / count}% 100%`,
    };
  };

  const rules = rulesOf(setup, run.relics);
  const surcharge = rules.heavy && (run.history.length + 1) % 3 === 0;

  // Directive tracking (only "certain failure" is flagged mid-round)
  const d = setup.directive;
  const dInfo = DIRECTIVE_INFO[d.type];
  let dFailed = false;
  let dProgress = '';
  switch (d.type) {
    case 'FLAWLESS':
      dFailed = run.energyUsed > required;
      dProgress = `${run.energyUsed}/${required}`;
      break;
    case 'THRIFTY':
      dFailed = run.energyUsed > required + d.target;
      dProgress = `${run.energyUsed}/${required + d.target}`;
      break;
    case 'SPEED':
      dFailed = run.elapsed > d.target;
      dProgress = `${fmtTime(run.elapsed)}/${fmtTime(d.target)}`;
      break;
    case 'PURE':
      dFailed = run.powerUsedThisRound;
      dProgress = dFailed ? 'powers used' : 'no powers';
      break;
  }

  const par = parOf(run);
  const isBlitz = run.mode === GameMode.BLITZ;
  const overtime = run.elapsed > par;
  const timePct = Math.min(100, (run.elapsed / par) * 100);

  const mode = MODE_INFO[run.mode];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-3">
      {/* Top Bar: Rounds & Health */}
      <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col min-w-[96px]">
          <span className="text-xs text-slate-400 uppercase tracking-wider">
            {setup.isBoss ? 'Boss Round' : 'Round'}
          </span>
          <span className="text-2xl font-display" style={{ color: zone.accent }}>
            {run.round} <span className="text-sm text-slate-500">({setup.ringCount} Rings)</span>
          </span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">{zone.name}</span>
        </div>

        <div className="flex flex-col items-center flex-1 order-last md:order-none w-full md:w-auto md:mx-4">
          <div className="flex justify-between w-full text-[10px] text-slate-500 uppercase tracking-widest mb-1 px-1">
            <span>Required</span>
            <span>Buffer</span>
          </div>

          <div className="w-full h-8 bg-slate-800 rounded-lg overflow-hidden relative flex border border-slate-700">
            {/* Required Moves Segment */}
            <div
              className={`h-full transition-all duration-300 relative ${
                run.energy < required ? 'bg-orange-600 animate-pulse' : 'bg-cyan-600'
              }`}
              style={{ width: `${minMovesPct}%`, ...getTickStyle(minMovesCount) }}
            />

            {/* Buffer Moves Segment */}
            <div
              className="h-full bg-emerald-500 transition-all duration-300 relative"
              style={{ width: `${bufferMovesPct}%`, ...getTickStyle(bufferMovesCount) }}
            />

            {/* Marker Line for Min Moves */}
            <div
              className="absolute top-0 bottom-0 border-l-2 border-white/50 z-10"
              style={{ left: `${(required / max) * 100}%`, opacity: bufferMovesCount > 0 ? 1 : 0.2 }}
            />

            {/* Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center font-bold text-shadow text-white z-20 pointer-events-none">
              {run.energy}
            </div>
          </div>

          <div className="flex justify-between w-full text-xs text-slate-400 mt-1 px-1 font-mono">
            <div className="flex gap-4">
              <span className={run.energy < required ? 'text-orange-400' : 'text-cyan-400'}>Req: {required}</span>
              <span className={bufferMovesCount > 0 ? 'text-emerald-400' : 'text-slate-600'}>
                Buf: {bufferMovesCount}
              </span>
            </div>

            {/* Breakdown Stats */}
            <div className="flex gap-2 text-[10px] md:text-xs">
              <span title="Moves carried over from previous round" className="text-slate-500">
                Carry: <span className="text-slate-300">+{run.breakdown.carryover}</span>
              </span>
              <span title="Moves added from upgrades" className="text-slate-500">
                Bonus: <span className="text-slate-300">+{run.breakdown.bonus}</span>
              </span>
              <span title="Base moves for this round" className="text-slate-500">
                Base: <span className="text-slate-300">+{run.breakdown.required}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end min-w-[80px]">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Bits</span>
          <span className="text-2xl font-display text-yellow-400">{Math.floor(run.bits)}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">
            Score {Math.floor(run.score).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Info Bar: Mode, Anomalies, Combo */}
      <div className="flex flex-wrap justify-between items-center gap-2 px-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-widest px-2 py-1 rounded border"
            style={{ color: mode.color, borderColor: `${mode.color}55`, background: `${mode.color}12` }}
            title={mode.tagline}
          >
            {mode.glyph} {mode.name}
          </span>
          <span className="text-xs text-slate-500 uppercase bg-slate-900 px-2 py-1 rounded">Anomaly</span>
          {setup.anomalies.map((a) => {
            const info = ANOMALY_INFO[a];
            return (
              <span
                key={a}
                title={info.desc}
                className="text-sm font-bold px-2 py-0.5 rounded border cursor-help"
                style={{
                  color: a === VariationType.STANDARD ? '#cbd5e1' : info.color,
                  borderColor: `${info.color}44`,
                  background: `${info.color}14`,
                }}
              >
                {info.glyph} {info.name}
              </span>
            );
          })}
          {surcharge && (
            <span className="text-xs font-bold text-orange-300 bg-orange-950/60 border border-orange-500/40 px-2 py-0.5 rounded animate-pulse">
              ⛓ Next move costs +1
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase bg-slate-900 px-2 py-1 rounded">Combo</span>
          <span className="text-xl font-display text-fuchsia-400">x{run.combo.toFixed(2)}</span>
          {run.upgrades.comboShield && (
            <span title="Combo Shield active" className="text-cyan-300">
              ⛨
            </span>
          )}
        </div>
      </div>

      {/* Directive + timer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          className={`md:col-span-2 flex items-center gap-3 rounded-xl border px-4 py-2 bg-slate-900/70 ${
            dFailed ? 'border-slate-700 opacity-60' : ''
          }`}
          style={dFailed ? undefined : { borderColor: `${dInfo.color}55` }}
        >
          <span className="text-2xl" style={{ color: dFailed ? '#64748b' : dInfo.color }}>
            {dInfo.glyph}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">
              Directive · +{Math.round(d.rewardPct * 100)}% Bits
            </div>
            <div className="text-sm text-slate-200 truncate">
              <span className="font-bold" style={{ color: dFailed ? '#94a3b8' : dInfo.color }}>
                {dInfo.name}
              </span>{' '}
              — {directiveText(d.type, d.target)}
            </div>
          </div>
          <span
            className={`text-[11px] font-mono px-2 py-1 rounded ${
              dFailed ? 'bg-red-950/70 text-red-300' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {dFailed ? '✕ ' : ''}
            {dProgress}
          </span>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-2">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
            <span>⏱ Time</span>
            <span className={isBlitz && overtime ? 'text-red-400 animate-pulse' : ''}>
              {isBlitz ? (overtime ? 'OVERTIME – LEAKING' : `Par ${fmtTime(par)}`) : `Par ${fmtTime(par)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-display text-lg text-slate-200 w-14">{fmtTime(run.elapsed)}</span>
            <div className="flex-1 h-2 bg-slate-800 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  overtime ? (isBlitz ? 'bg-red-500' : 'bg-slate-500') : timePct > 75 ? 'bg-amber-400' : 'bg-cyan-500'
                }`}
                style={{ width: `${timePct}%`, opacity: isBlitz ? 1 : 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Powers + Relics */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap gap-2">
          {POWER_ORDER.filter((p) => !POWER_INFO[p].blitzOnly || isBlitz).map((p) => {
            const info = POWER_INFO[p];
            const charges = run.powers[p];
            const armed = p === 'PARADOX' && run.paradoxArmed;
            const usable =
              run.phase === GameState.PLAYING &&
              (charges > 0 || armed) &&
              (p !== 'REWIND' || run.history.length > 0) &&
              (p !== 'LENS' || !run.hint);
            return (
              <button
                key={p}
                disabled={!usable}
                onClick={() => onPower(p)}
                title={`${info.name} [${info.key}] — ${info.desc}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  usable ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'opacity-40 cursor-not-allowed'
                }`}
                style={{
                  color: info.color,
                  borderColor: armed ? info.color : `${info.color}44`,
                  background: armed ? `${info.color}33` : `${info.color}10`,
                  boxShadow: armed ? `0 0 14px ${info.color}66` : 'none',
                }}
              >
                <span className="text-lg leading-none">{info.glyph}</span>
                <span className="hidden sm:inline font-bold">{info.name}</span>
                <span className="font-mono text-xs bg-black/40 px-1.5 rounded">{charges}</span>
                <kbd className="hidden md:inline text-[10px] text-slate-500 border border-slate-700 rounded px-1">
                  {info.key}
                </kbd>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          {run.relics.length === 0 && (
            <span className="text-[10px] uppercase tracking-widest text-slate-600">No relics</span>
          )}
          {run.relics.map((id) => {
            const r = RELIC_INFO[id];
            return (
              <span
                key={id}
                title={`${r.name} — ${r.desc}`}
                className="w-8 h-8 flex items-center justify-center rounded-lg border text-base cursor-help"
                style={{
                  color: RARITY_COLOR[r.rarity],
                  borderColor: `${RARITY_COLOR[r.rarity]}66`,
                  background: `${RARITY_COLOR[r.rarity]}14`,
                }}
              >
                {r.glyph}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HUD;
