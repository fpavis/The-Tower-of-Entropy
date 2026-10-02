import React from 'react';
import { MetaKey } from '../types';
import { META_DEFS, metaCost } from '../constants';

interface MetaShopProps {
  shards: number;
  levels: Record<MetaKey, number>;
  onPurchase: (key: MetaKey) => void;
  onContinue: () => void;
  title?: string;
  subtitle?: string;
  continueLabel?: string;
  fullScreen?: boolean;
}

const MetaShop: React.FC<MetaShopProps> = ({
  shards,
  levels,
  onPurchase,
  onContinue,
  title = 'Singularity Reached',
  subtitle = 'Structure Stabilized. Meta-Evolution Available.',
  continueLabel = 'Resume Simulation',
  fullScreen = false,
}) => {
  return (
    <div
      className={`${
        fullScreen ? 'min-h-screen' : 'absolute inset-0 z-50'
      } bg-black/95 flex items-center justify-center p-4 overflow-y-auto`}
    >
      <div className="max-w-4xl w-full bg-slate-900 border border-purple-500/50 rounded-xl shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden flex flex-col max-h-[96vh]">
        <div className="p-6 border-b border-purple-900 text-center">
          <h2 className="text-3xl md:text-4xl font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 mb-2">
            {title}
          </h2>
          <p className="text-slate-400">{subtitle}</p>
          <div className="mt-3 text-2xl font-mono text-purple-300">◆ Shards: {shards}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Shards are permanent. Earn them from bosses, run payouts and achievements.
          </p>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto thin-scroll">
          {META_DEFS.map((def) => {
            const level = levels[def.key];
            const maxed = level >= def.max;
            const cost = metaCost(def, level);
            const canAfford = !maxed && shards >= cost;
            return (
              <button
                key={def.key}
                disabled={!canAfford}
                onClick={() => onPurchase(def.key)}
                className={`
                  flex flex-col p-4 rounded-lg border text-left transition-all
                  ${
                    canAfford
                      ? 'bg-slate-800 border-purple-500/30 hover:border-purple-400 hover:bg-slate-800/80'
                      : 'bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex justify-between w-full mb-1">
                  <span className="font-bold text-white">
                    <span className="text-purple-400 mr-2">{def.glyph}</span>
                    {def.name}
                  </span>
                  <span className={`font-mono ${maxed ? 'text-emerald-400' : 'text-purple-400'}`}>
                    {maxed ? 'MAX' : `${cost} ◆`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{def.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {Array.from({ length: def.max }, (_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full ${def.max > 6 ? 'w-2' : 'w-4'} ${
                          i < level ? 'bg-purple-400' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-purple-200">
                    {def.format(level)}
                    {!maxed && <span className="text-slate-500"> → {def.format(level + 1)}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 flex justify-center border-t border-purple-900/60">
          <button
            onClick={onContinue}
            className="px-12 py-3 bg-purple-600 rounded-full font-bold text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/50"
          >
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetaShop;
