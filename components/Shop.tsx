import React from 'react';
import {
  ANOMALY_INFO,
  DIRECTIVE_INFO,
  POWER_INFO,
  RARITY_COLOR,
  RELIC_INFO,
  UPGRADE_INFO,
  Zone,
  directiveText,
} from '../constants';
import { PowerId, RelicId, RoundSetup, RunState, ShopOffer, UpgradeId } from '../types';
import { canBuy, defragCost, rerollCost } from '../game/engine';
import { AnomalyChip, Stat } from './ui';
import { fmtTime } from './HUD';

interface ShopProps {
  run: RunState;
  next: RoundSetup;
  zone: Zone;
  onBuy: (uid: string) => void;
  onDefrag: () => void;
  onReroll: () => void;
  onNextRound: () => void;
}

const describe = (o: ShopOffer) => {
  if (o.kind === 'relic') {
    const r = RELIC_INFO[o.ref as RelicId];
    return { name: r.name, glyph: r.glyph, desc: r.desc, tag: `Relic · ${r.rarity}`, color: RARITY_COLOR[r.rarity] };
  }
  if (o.kind === 'power') {
    const p = POWER_INFO[o.ref as PowerId];
    return { name: p.name, glyph: p.glyph, desc: p.desc, tag: `Power · +1 charge [${p.key}]`, color: p.color };
  }
  const u = UPGRADE_INFO[o.ref as UpgradeId];
  return { name: u.name, glyph: u.glyph, desc: u.desc, tag: 'Upgrade', color: '#22d3ee' };
};

const Shop: React.FC<ShopProps> = ({ run, next, zone, onBuy, onDefrag, onReroll, onNextRound }) => {
  const report = run.report;
  const dInfo = report ? DIRECTIVE_INFO[report.directive.type] : null;
  const nextDirective = DIRECTIVE_INFO[next.directive.type];
  const defrag = defragCost(run);
  const reroll = rerollCost(run);

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4">
      <div className="max-w-4xl w-full bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        <div className="p-5 border-b border-slate-700 bg-slate-900">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-2xl md:text-3xl font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              System Maintenance
            </h2>
            <div className="flex gap-4 text-sm text-slate-400">
              <span>
                Energy: <span className="text-emerald-400">{run.energy}</span>
              </span>
              <span>
                Bits: <span className="text-yellow-400">{Math.floor(run.bits)}</span>
              </span>
            </div>
          </div>

          {report && (
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/50 p-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-xs uppercase tracking-widest text-slate-500">Round {report.round} report</span>
                {report.perfect ? (
                  <span className="text-xs font-bold text-fuchsia-300 bg-fuchsia-950/60 border border-fuchsia-500/40 px-2 py-0.5 rounded">
                    ✦ PERFECT +{(report.comboAfter - report.comboBefore).toFixed(1)} combo
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    +{report.over} wasted energy
                    {report.buffered && ' (buffer protected your combo)'}
                    {report.shielded && ' (Combo Shield absorbed the loss)'}
                  </span>
                )}
                <span className="text-xs text-slate-500">⏱ {fmtTime(report.timeSec)}</span>
                {report.isBoss && <span className="text-xs text-amber-300">♛ Boss defeated · +1 Shard</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Stat label="Round Bits" value={`+${report.roundBits}`} color="#facc15" />
                <Stat label="Combo" value={`x${report.comboAfter.toFixed(2)}`} color="#e879f9" />
                {dInfo && (
                  <Stat
                    label={`${dInfo.name}`}
                    value={report.directiveMet ? `+${report.directiveBonus}` : '✕'}
                    color={report.directiveMet ? dInfo.color : '#64748b'}
                  />
                )}
                {report.salvage > 0 && <Stat label="Salvage" value={`+${report.salvage}`} color="#a3e635" />}
                {report.interest > 0 && <Stat label="Interest" value={`+${report.interest}`} color="#a3e635" />}
                {report.refund > 0 && <Stat label="Refund" value={`+${report.refund}⚡`} color="#34d399" />}
                <Stat label="Total" value={`+${report.totalBits}`} color="#fde047" />
              </div>
            </div>
          )}
        </div>

        <div className="p-5 overflow-y-auto thin-scroll flex flex-col gap-5">
          {/* Offers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-slate-500">Today's Stock</span>
              <button
                onClick={onReroll}
                disabled={run.bits < reroll}
                className="text-xs px-3 py-1 rounded border border-slate-600 text-slate-300 enabled:hover:border-cyan-400 enabled:hover:text-cyan-300 disabled:opacity-40"
              >
                ⟳ Reroll <span className="text-yellow-400 font-mono">{reroll} B</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {run.offers.map((o, i) => {
                const d = describe(o);
                const affordable = canBuy(run, o);
                return (
                  <button
                    key={o.uid}
                    disabled={!affordable}
                    onClick={() => onBuy(o.uid)}
                    style={{ borderColor: affordable ? `${d.color}55` : undefined, animationDelay: `${i * 60}ms` }}
                    className={`card-rise group relative flex gap-3 p-4 rounded-lg border text-left transition-all ${
                      affordable
                        ? 'bg-slate-700 hover:bg-slate-600 hover:-translate-y-0.5'
                        : 'bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-3xl w-10 text-center" style={{ color: d.color }}>
                      {d.glyph}
                    </span>
                    <span className="flex-1">
                      <span className="flex justify-between w-full mb-1">
                        <span className="font-bold text-white" style={affordable ? undefined : undefined}>
                          {d.name}
                        </span>
                        <span className="text-yellow-400 font-mono">{o.cost} B</span>
                      </span>
                      <span className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: d.color }}>
                        {d.tag}
                      </span>
                      <span className="block text-sm text-slate-400">{d.desc}</span>
                    </span>
                    {o.sold && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/70 text-emerald-400 font-display tracking-[0.3em] text-sm">
                        ACQUIRED
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-3">
            <button
              disabled={run.bits < defrag}
              onClick={onDefrag}
              className="flex-1 min-w-[220px] flex justify-between items-center gap-3 p-3 rounded-lg border border-slate-600 bg-slate-700/60 text-left enabled:hover:border-emerald-400 enabled:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>
                <span className="block font-bold text-white">Emergency Defrag</span>
                <span className="block text-sm text-slate-400">Add {next.required} moves now</span>
              </span>
              <span className="text-yellow-400 font-mono">{defrag} B</span>
            </button>
            <div className="flex-1 min-w-[220px] text-xs text-slate-400 p-3 rounded-lg border border-slate-700 bg-slate-900/50 grid grid-cols-3 gap-2 text-center">
              <span>
                <span className="block text-slate-500 uppercase tracking-widest text-[10px]">Refill</span>
                <span className="text-cyan-300 font-mono">
                  +{run.upgrades.flatRefillBonus} / +{Math.round(run.upgrades.percentRefillBonus * 100)}%
                </span>
              </span>
              <span>
                <span className="block text-slate-500 uppercase tracking-widest text-[10px]">Bit mult</span>
                <span className="text-yellow-300 font-mono">x{run.upgrades.baseBitMultiplier.toFixed(1)}</span>
              </span>
              <span>
                <span className="block text-slate-500 uppercase tracking-widest text-[10px]">Shield</span>
                <span className="text-slate-200 font-mono">{run.upgrades.comboShield ? '⛨ ready' : '—'}</span>
              </span>
            </div>
          </div>

          {/* Forecast */}
          <div
            className="rounded-lg border p-3 bg-slate-950/50"
            style={{ borderColor: next.isBoss ? '#f59e0b66' : `${zone.accent}33` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs uppercase tracking-widest text-slate-500">
                Forecast · Round {next.round}
                {next.isBoss && <span className="text-amber-300"> · ♛ BOSS: {next.bossName}</span>}
              </span>
              <span className="text-xs text-slate-400">
                {next.ringCount} rings · needs <span className="text-cyan-300">{next.required}</span> energy
                {next.scrambled && <span className="text-fuchsia-300"> · scrambled start</span>}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {next.anomalies.map((a) => (
                <AnomalyChip key={a} anomaly={a} />
              ))}
              <span className="text-xs text-slate-400 ml-1">
                <span style={{ color: nextDirective.color }}>
                  {nextDirective.glyph} {nextDirective.name}
                </span>{' '}
                — {directiveText(next.directive.type, next.directive.target)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {next.anomalies.map((a) => ANOMALY_INFO[a].desc).join(' ')}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 bg-slate-900 flex justify-end">
          <button
            onClick={onNextRound}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all active:scale-95"
          >
            Initiate Round {run.round + 1}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Shop;
