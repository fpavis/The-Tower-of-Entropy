import React from 'react';
import { GameMode, Profile } from '../types';
import { MODE_INFO, MODE_ORDER } from '../constants';
import { ACHIEVEMENTS } from '../game/achievements';
import { localDateKey } from '../services/rng';

interface MenuProps {
  profile: Profile;
  mode: GameMode;
  onMode: (m: GameMode) => void;
  onStart: () => void;
  onArchive: () => void;
  onCodex: () => void;
  onHelp: () => void;
  onToggleMute: () => void;
}

const Menu: React.FC<MenuProps> = ({ profile, mode, onMode, onStart, onArchive, onCodex, onHelp, onToggleMute }) => {
  const info = MODE_INFO[mode];
  const best = profile.stats.bestRound[mode];
  const bestScore = profile.stats.bestScore[mode];
  const today = localDateKey();
  const todays = profile.daily[today];
  const unlocked = Object.keys(profile.achievements).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative">
      <button
        onClick={onToggleMute}
        className="absolute top-4 right-4 text-xs uppercase tracking-widest text-slate-500 hover:text-cyan-300 border border-slate-800 rounded px-3 py-1"
        title="Toggle sound"
      >
        {profile.settings.muted ? '🔇 Sound off' : '🔊 Sound on'}
      </button>

      <h1 className="text-6xl md:text-8xl font-display text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-600 mb-4 animate-pulse">
        ENTROPY
      </h1>
      <p className="max-w-md text-slate-400 mb-8 font-mono text-sm md:text-base">
        The universe tends towards disorder. Organize the rings. Manage your energy. Delay the inevitable.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl mb-4">
        {MODE_ORDER.map((m) => {
          const mi = MODE_INFO[m];
          const active = m === mode;
          return (
            <button
              key={m}
              onClick={() => onMode(m)}
              className={`relative p-4 rounded-xl border text-left transition-all ${
                active ? '-translate-y-1' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                borderColor: active ? mi.color : '#334155',
                background: active ? `${mi.color}18` : 'rgba(15,23,42,0.7)',
                boxShadow: active ? `0 0 28px ${mi.color}33` : 'none',
              }}
            >
              <div className="text-2xl mb-1" style={{ color: mi.color }}>
                {mi.glyph}
              </div>
              <div className="font-display text-sm md:text-base text-white">{mi.name}</div>
              <div className="text-[11px] text-slate-400">{mi.tagline}</div>
              {profile.stats.bestRound[m] > 0 && (
                <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-500">
                  R{profile.stats.bestRound[m]}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="w-full max-w-3xl rounded-xl border bg-slate-900/70 p-4 mb-8 text-left grid md:grid-cols-2 gap-4"
        style={{ borderColor: `${info.color}44` }}
      >
        <ul className="text-sm text-slate-300 space-y-1">
          {info.rules.map((r) => (
            <li key={r}>
              <span style={{ color: info.color }}>›</span> {r}
            </li>
          ))}
        </ul>
        <div className="flex md:justify-end gap-6 items-center text-center">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Best round</div>
            <div className="font-display text-xl" style={{ color: info.color }}>
              {best || '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Best score</div>
            <div className="font-display text-xl text-yellow-400">{bestScore ? bestScore.toLocaleString() : '—'}</div>
          </div>
          {mode === GameMode.DAILY && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Today · {today}</div>
              <div className="font-display text-xl text-emerald-300">
                {todays ? `R${todays.round} · ${todays.score.toLocaleString()}` : 'Not played'}
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onStart}
        className="px-10 py-4 text-white font-bold rounded-lg transition-all hover:brightness-110 active:scale-95"
        style={{ background: info.color === '#fbbf24' ? '#d97706' : info.color, boxShadow: `0 0 24px ${info.color}66`, color: '#0b1220' }}
      >
        INITIALIZE {info.name.toUpperCase()}
      </button>

      <div className="flex flex-wrap justify-center gap-3 mt-8 text-sm">
        <button
          onClick={onArchive}
          className="px-5 py-2 rounded-lg border border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
        >
          ◆ Archive <span className="font-mono text-purple-200">({profile.shards})</span>
        </button>
        <button
          onClick={onCodex}
          className="px-5 py-2 rounded-lg border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
        >
          ❖ Codex{' '}
          <span className="font-mono text-cyan-200">
            ({unlocked}/{ACHIEVEMENTS.length})
          </span>
        </button>
        <button
          onClick={onHelp}
          className="px-5 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/40"
        >
          ? How to play
        </button>
      </div>
    </div>
  );
};

export default Menu;
