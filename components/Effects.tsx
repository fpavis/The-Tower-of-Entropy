import React from 'react';
import { RoundSetup } from '../types';
import { ANOMALY_INFO, DIRECTIVE_INFO, Zone, bossFor, directiveText } from '../constants';

export interface FxItem {
  id: number;
  text: string;
  color: string;
  x: number; // percent
  slot: number; // vertical stacking slot within a burst
}

export interface ToastItem {
  id: number;
  title: string;
  body: string;
  glyph: string;
}

export const FloatingFx: React.FC<{ items: FxItem[] }> = ({ items }) => (
  <div className="fixed inset-0 pointer-events-none z-[55] overflow-hidden">
    {items.map((fx) => (
      <div
        key={fx.id}
        className="fx-float absolute font-display font-bold text-xl md:text-3xl text-shadow whitespace-nowrap"
        style={{
          left: `${fx.x}%`,
          top: `${30 + fx.slot * 8}%`,
          animationDelay: `${fx.slot * 0.2}s`,
          color: fx.color,
          textShadow: `0 0 16px ${fx.color}`,
        }}
      >
        {fx.text}
      </div>
    ))}
  </div>
);

export const Toasts: React.FC<{ items: ToastItem[] }> = ({ items }) => (
  <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
    {items.map((t) => (
      <div
        key={t.id}
        className="toast-life flex items-center gap-3 bg-slate-900/95 border border-cyan-400/60 rounded-lg px-4 py-3 shadow-[0_0_24px_rgba(34,211,238,0.3)]"
      >
        <span className="text-2xl text-cyan-300">{t.glyph}</span>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-cyan-400">Achievement unlocked</div>
          <div className="font-bold text-white text-sm">{t.title}</div>
          <div className="text-xs text-purple-300">{t.body}</div>
        </div>
      </div>
    ))}
  </div>
);

export const RoundBanner: React.FC<{ setup: RoundSetup; zone: Zone }> = ({ setup, zone }) => {
  const d = setup.directive;
  const dInfo = DIRECTIVE_INFO[d.type];
  const boss = setup.isBoss ? bossFor(setup.round) : null;
  return (
    <div className="fixed inset-0 z-[52] flex items-center justify-center pointer-events-none">
      <div
        className="banner-life text-center px-8 py-6 rounded-2xl border backdrop-blur-md bg-slate-950/70 max-w-xl"
        style={{
          borderColor: boss ? '#f59e0bAA' : `${zone.accent}77`,
          boxShadow: `0 0 60px ${boss ? '#f59e0b33' : zone.accent + '33'}`,
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.4em] mb-1" style={{ color: boss ? '#fbbf24' : zone.accent }}>
          {zone.name}
        </div>
        <div className="font-display text-4xl md:text-5xl text-white mb-1">
          {boss ? `♛ ${boss.name}` : `Round ${setup.round}`}
        </div>
        {boss && <div className="text-sm italic text-amber-200/80 mb-1">“{boss.info.quote}”</div>}
        {!boss && setup.round === 1 && <div className="text-sm text-slate-400 mb-1">{zone.tagline}</div>}
        <div className="flex flex-wrap justify-center gap-2 my-2">
          {setup.anomalies.map((a) => {
            const info = ANOMALY_INFO[a];
            return (
              <span key={a} className="text-sm font-bold" style={{ color: info.color }}>
                {info.glyph} {info.name}
              </span>
            );
          })}
        </div>
        <div className="text-xs text-slate-400">
          {setup.ringCount} rings · {setup.required} energy needed
          {setup.scrambled ? ' · scrambled' : ''}
        </div>
        <div className="text-xs mt-1" style={{ color: dInfo.color }}>
          {dInfo.glyph} {dInfo.name}: {directiveText(d.type, d.target)}
        </div>
      </div>
    </div>
  );
};
