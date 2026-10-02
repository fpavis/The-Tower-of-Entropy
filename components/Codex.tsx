import React, { useState } from 'react';
import { GameMode, Profile } from '../types';
import {
  ANOMALY_INFO,
  ANOMALY_ORDER,
  BOSSES,
  MODE_INFO,
  MODE_ORDER,
  POWER_INFO,
  POWER_ORDER,
  RARITY_COLOR,
  RELIC_INFO,
  RELIC_ORDER,
} from '../constants';
import { ACHIEVEMENTS } from '../game/achievements';

interface CodexProps {
  profile: Profile;
  onClose: () => void;
}

const TABS = ['Achievements', 'Anomalies', 'Relics', 'Records'] as const;
type Tab = (typeof TABS)[number];

const Codex: React.FC<CodexProps> = ({ profile, onClose }) => {
  const [tab, setTab] = useState<Tab>('Achievements');
  const unlocked = Object.keys(profile.achievements).length;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-900/95 border border-cyan-500/30 rounded-xl overflow-hidden flex flex-col max-h-[94vh] shadow-[0_0_50px_rgba(34,211,238,0.12)]">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display text-cyan-300">Codex</h2>
            <p className="text-xs text-slate-500">Everything the tower has taught you.</p>
          </div>
          <button onClick={onClose} className="px-4 py-2 rounded border border-slate-600 text-slate-300 hover:bg-slate-700/50">
            ← Back
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3 border-b border-slate-800 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm rounded-t-lg whitespace-nowrap ${
                tab === t ? 'bg-slate-800 text-cyan-300 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
              {t === 'Achievements' && <span className="ml-1 text-xs text-slate-500">{unlocked}/{ACHIEVEMENTS.length}</span>}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto thin-scroll">
          {tab === 'Achievements' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((a) => {
                const done = !!profile.achievements[a.id];
                return (
                  <div
                    key={a.id}
                    className={`flex gap-3 items-center p-3 rounded-lg border ${
                      done ? 'border-cyan-500/40 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/60 opacity-60'
                    }`}
                  >
                    <span className={`text-3xl w-10 text-center ${done ? 'text-cyan-300' : 'text-slate-600'}`}>{a.glyph}</span>
                    <div className="flex-1">
                      <div className="font-bold text-white text-sm">{a.name}</div>
                      <div className="text-xs text-slate-400">{a.desc}</div>
                    </div>
                    <span className={`font-mono text-xs ${done ? 'text-purple-300' : 'text-slate-600'}`}>
                      {done ? '✓' : `+${a.reward}◆`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'Anomalies' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {ANOMALY_ORDER.map((a) => {
                  const info = ANOMALY_INFO[a];
                  return (
                    <div key={a} className="p-3 rounded-lg border bg-slate-900/60" style={{ borderColor: `${info.color}44` }}>
                      <div className="font-bold" style={{ color: info.color }}>
                        {info.glyph} {info.name} {info.boon && <span className="text-[10px] text-emerald-400 ml-1">BOON</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{info.desc}</div>
                    </div>
                  );
                })}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Bosses (every 5th round)</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {BOSSES.map((b) => (
                    <div key={b.name} className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/10">
                      <div className="font-bold text-amber-300">♛ {b.name}</div>
                      <div className="text-xs text-slate-500 italic mb-1">“{b.quote}”</div>
                      <div className="text-xs text-slate-400">
                        {b.anomalies.map((a) => ANOMALY_INFO[a].name).join(' + ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'Relics' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {RELIC_ORDER.map((id) => {
                  const r = RELIC_INFO[id];
                  const c = RARITY_COLOR[r.rarity];
                  return (
                    <div key={id} className="flex gap-3 p-3 rounded-lg border bg-slate-900/60" style={{ borderColor: `${c}44` }}>
                      <span className="text-3xl w-10 text-center" style={{ color: c }}>{r.glyph}</span>
                      <div>
                        <div className="font-bold text-white text-sm">
                          {r.name} <span className="text-[10px] uppercase tracking-widest" style={{ color: c }}>{r.rarity}</span>
                          {r.blitzOnly && <span className="text-[10px] text-amber-400 ml-1">BLITZ</span>}
                        </div>
                        <div className="text-xs text-slate-400">{r.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Powers (consumable charges)</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {POWER_ORDER.map((p) => {
                    const info = POWER_INFO[p];
                    return (
                      <div key={p} className="flex gap-3 p-3 rounded-lg border bg-slate-900/60" style={{ borderColor: `${info.color}44` }}>
                        <span className="text-3xl w-10 text-center" style={{ color: info.color }}>{info.glyph}</span>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {info.name} <kbd className="text-[10px] text-slate-500 border border-slate-700 rounded px-1">{info.key}</kbd>
                            {info.blitzOnly && <span className="text-[10px] text-amber-400 ml-1">BLITZ</span>}
                          </div>
                          <div className="text-xs text-slate-400">{info.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'Records' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Runs', profile.stats.runs],
                  ['Total score', profile.stats.totalScore.toLocaleString()],
                  ['Perfect rounds', profile.stats.perfects],
                  ['Bosses slain', profile.stats.bosses],
                  ['Directives', profile.stats.directives],
                  ['Shards', profile.shards],
                ].map(([label, value]) => (
                  <div key={label as string} className="p-3 rounded-lg border border-slate-700 bg-slate-900/60 text-center">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
                    <div className="font-display text-xl text-slate-100">{value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 text-slate-400 text-xs uppercase tracking-widest">
                    <tr>
                      <th className="text-left p-2">Mode</th>
                      <th className="p-2">Best round</th>
                      <th className="p-2">Best score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODE_ORDER.map((m: GameMode) => (
                      <tr key={m} className="border-t border-slate-800">
                        <td className="p-2" style={{ color: MODE_INFO[m].color }}>
                          {MODE_INFO[m].glyph} {MODE_INFO[m].name}
                        </td>
                        <td className="p-2 text-center font-mono">{profile.stats.bestRound[m] || '—'}</td>
                        <td className="p-2 text-center font-mono text-yellow-300">
                          {profile.stats.bestScore[m] ? profile.stats.bestScore[m].toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Object.keys(profile.daily).length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Daily Collapse history</div>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(profile.daily) as [string, { round: number; score: number }][])
                      .sort((a, b) => b[0].localeCompare(a[0]))
                      .slice(0, 12)
                      .map(([day, rec]) => (
                        <span key={day} className="text-xs font-mono px-2 py-1 rounded border border-emerald-500/30 text-emerald-300">
                          {day} · R{rec.round} · {rec.score.toLocaleString()}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Codex;
