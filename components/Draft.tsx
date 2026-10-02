import React from 'react';
import { RelicId, RunState } from '../types';
import { RelicCard } from './ui';

interface DraftProps {
  run: RunState;
  onPick: (id: RelicId) => void;
}

const Draft: React.FC<DraftProps> = ({ run, onPick }) => (
  <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div className="max-w-4xl w-full text-center">
      <div className="text-xs uppercase tracking-[0.4em] text-amber-300 mb-2">♛ Boss Defeated</div>
      <h2 className="text-3xl md:text-4xl font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-fuchsia-400 mb-1">
        Claim a Relic
      </h2>
      <p className="text-slate-400 mb-8">
        {run.report?.isBoss && run.setup.bossName ? `${run.setup.bossName} drops its core. ` : ''}
        Choose one permanent relic for this run.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {run.draft.map((id, i) => (
          <div key={id} className="card-rise" style={{ animationDelay: `${i * 120}ms` }}>
            <RelicCard
              id={id}
              onClick={() => onPick(id)}
              className="w-full h-full"
              footer={<span className="mt-4 text-xs uppercase tracking-widest text-cyan-300 group-hover:text-white">Take relic →</span>}
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Draft;
