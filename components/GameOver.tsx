import React from 'react';
import { RunState } from '../types';
import { MODE_INFO, RARITY_COLOR, RELIC_INFO, getZone } from '../constants';
import { Stat } from './ui';

export interface RunSummary {
  payout: number;
  bossShards: number;
  newBestRound: boolean;
  newBestScore: boolean;
  unlocked: string[];
}

interface GameOverProps {
  run: RunState;
  summary: RunSummary;
  shards: number;
  onRetry: () => void;
  onMenu: () => void;
  onArchive: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ run, summary, shards, onRetry, onMenu, onArchive }) => {
  const mode = MODE_INFO[run.mode];
  const zone = getZone(run.round);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-950/30 p-4 text-center overflow-y-auto">
      <h1 className="text-5xl md:text-6xl font-display text-red-500 mb-2 glitch">SYSTEM FAILURE</h1>
      <p className="text-xl text-slate-300 mb-1">
        Energy Depleted at Round {run.round}{' '}
        <span className="text-sm" style={{ color: zone.accent }}>
          · {zone.name}
        </span>
      </p>
      <p className="text-slate-500 mb-6">Entropy has claimed you.</p>

      <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-2xl">
        <Stat label="Mode" value={`${mode.glyph} ${mode.name}`} color={mode.color} />
        <Stat label="Rounds" value={run.stats.roundsCleared} color="#22d3ee" />
        <Stat label="Score" value={run.score.toLocaleString()} color="#facc15" />
        <Stat label="Perfects" value={run.stats.perfects} color="#e879f9" />
        <Stat label="Directives" value={run.stats.directivesDone} color="#34d399" />
        <Stat label="Bosses" value={run.stats.bosses} color="#f59e0b" />
        <Stat label="Best combo" value={`x${run.stats.bestCombo.toFixed(2)}`} color="#e879f9" />
      </div>

      {(summary.newBestRound || summary.newBestScore) && (
        <div className="mb-3 text-sm text-amber-300 font-bold tracking-widest uppercase">
          ★ New record{summary.newBestRound && ' · deepest round'}
          {summary.newBestScore && ' · highest score'}
        </div>
      )}

      {run.relics.length > 0 && (
        <div className="flex gap-2 mb-4">
          {run.relics.map((id) => (
            <span
              key={id}
              title={RELIC_INFO[id].name}
              className="w-9 h-9 flex items-center justify-center rounded-lg border text-lg"
              style={{
                color: RARITY_COLOR[RELIC_INFO[id].rarity],
                borderColor: `${RARITY_COLOR[RELIC_INFO[id].rarity]}66`,
              }}
            >
              {RELIC_INFO[id].glyph}
            </span>
          ))}
        </div>
      )}

      <div className="mb-3 rounded-lg border border-purple-500/40 bg-purple-950/30 px-5 py-3">
        <div className="text-purple-300 font-mono">
          ◆ +{summary.payout + summary.bossShards} Shards{' '}
          <span className="text-purple-400/70 text-xs">
            ({summary.bossShards} boss · {summary.payout} run payout)
          </span>
        </div>
        <div className="text-[11px] text-slate-500">Wallet: {shards} ◆ — spend them in the Archive</div>
      </div>

      {summary.unlocked.length > 0 && (
        <div className="mb-4 text-sm text-cyan-300">
          ❖ Unlocked: {summary.unlocked.join(' · ')}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-3 mt-2">
        <button
          onClick={onRetry}
          className="px-8 py-3 border border-red-500 text-red-300 hover:bg-red-500 hover:text-white transition-all rounded"
        >
          REBOOT {mode.name.toUpperCase()}
        </button>
        <button
          onClick={onArchive}
          className="px-8 py-3 border border-purple-500/60 text-purple-300 hover:bg-purple-500/20 transition-all rounded"
        >
          ARCHIVE
        </button>
        <button
          onClick={onMenu}
          className="px-8 py-3 border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-all rounded"
        >
          MAIN MENU
        </button>
      </div>
    </div>
  );
};

export default GameOver;
