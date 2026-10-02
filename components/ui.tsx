import React from 'react';
import { RELIC_INFO, RARITY_COLOR, ANOMALY_INFO } from '../constants';
import { RelicId, VariationType } from '../types';

export const RelicCard: React.FC<{
  id: RelicId;
  onClick?: () => void;
  footer?: React.ReactNode;
  className?: string;
}> = ({ id, onClick, footer, className = '' }) => {
  const r = RELIC_INFO[id];
  const color = RARITY_COLOR[r.rarity];
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col text-left p-5 rounded-xl border bg-slate-900/80 transition-all hover:-translate-y-1 ${className}`}
      style={{ borderColor: `${color}66`, boxShadow: `0 0 24px ${color}18` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-4xl" style={{ color, textShadow: `0 0 16px ${color}` }}>
          {r.glyph}
        </span>
        <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color }}>
          {r.rarity}
        </span>
      </div>
      <div className="font-display font-bold text-white mb-1">{r.name}</div>
      <p className="text-sm text-slate-400 flex-1">{r.desc}</p>
      {footer}
    </button>
  );
};

export const AnomalyChip: React.FC<{ anomaly: VariationType }> = ({ anomaly }) => {
  const info = ANOMALY_INFO[anomaly];
  return (
    <span
      title={info.desc}
      className="text-xs font-bold px-2 py-0.5 rounded border cursor-help whitespace-nowrap"
      style={{ color: info.color, borderColor: `${info.color}55`, background: `${info.color}14` }}
    >
      {info.glyph} {info.name}
    </span>
  );
};

export const Stat: React.FC<{ label: string; value: React.ReactNode; color?: string }> = ({ label, value, color }) => (
  <div className="flex flex-col items-center bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 min-w-[84px]">
    <span className="text-[10px] uppercase tracking-widest text-slate-500">{label}</span>
    <span className="font-display text-lg" style={{ color: color || '#e2e8f0' }}>
      {value}
    </span>
  </div>
);
