import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameMode, GameState, MetaKey, PowerId, Profile, RelicId, RoundSetup, RunState } from './types';
import { META_DEFS, MODE_ORDER, ZONES, getZone, metaCost } from './constants';
import {
  applyMove,
  buyDefrag,
  buyOffer,
  castChrono,
  castLens,
  castRewind,
  createRun,
  getMetaEffects,
  hasRelic,
  leaveMetaShop,
  parOf,
  pickDraft,
  previewSetup,
  rerollShop,
  runPayout,
  startNextRound,
  tick,
  toggleParadox,
  totalCharges,
  GameEvent,
  MoveStatus,
} from './game/engine';
import { evaluateAchievements } from './game/achievements';
import { dailySeed, localDateKey, randomSeed } from './services/rng';
import { loadProfile, saveProfile } from './services/storage';
import { setMuted, sfx } from './services/audio';
import { getOracleWisdom } from './services/geminiService';
import TowerGame from './components/TowerGame';
import HUD from './components/HUD';
import Shop from './components/Shop';
import MetaShop from './components/MetaShop';
import Draft from './components/Draft';
import Menu from './components/Menu';
import GameOver, { RunSummary } from './components/GameOver';
import Codex from './components/Codex';
import HowToPlay from './components/HowToPlay';
import Background from './components/Background';
import { FloatingFx, FxItem, RoundBanner, ToastItem, Toasts } from './components/Effects';

type Screen = 'MENU' | 'RUN' | 'CODEX' | 'ARCHIVE';

const App: React.FC = () => {
  // --- STATE ---
  const [profile, setProfileState] = useState<Profile>(loadProfile);
  const profileRef = useRef(profile);
  const commitProfile = useCallback((p: Profile) => {
    profileRef.current = p;
    setProfileState(p);
    saveProfile(p);
  }, []);

  const [run, setRunState] = useState<RunState | null>(null);
  const runRef = useRef<RunState | null>(null);
  const commitRun = useCallback((r: RunState | null) => {
    runRef.current = r;
    setRunState(r);
  }, []);

  const [screen, setScreen] = useState<Screen>('MENU');
  const [menuMode, setMenuMode] = useState<GameMode>(MODE_ORDER[0]);
  const [selectedPeg, setSelectedPegState] = useState<number | null>(null);
  const selectedRef = useRef<number | null>(null);
  const setSelectedPeg = useCallback((v: number | null) => {
    selectedRef.current = v;
    setSelectedPegState(v);
  }, []);
  const [shake, setShake] = useState<{ peg: number; n: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [fx, setFx] = useState<FxItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [banner, setBanner] = useState<{ key: number; setup: RoundSetup } | null>(null);

  // Oracle
  const [oracleText, setOracleText] = useState<string>('');
  const [loadingOracle, setLoadingOracle] = useState(false);

  const counter = useRef(0);
  const oracleToken = useRef(0);
  const runUnlocked = useRef<string[]>([]);
  const dailyKey = useRef(localDateKey());

  useEffect(() => {
    setMuted(profile.settings.muted);
  }, [profile.settings.muted]);

  // --- UI HELPERS ---
  const fxBurst = useRef({ n: 0, t: 0 });
  const pushFx = useCallback((text: string, color: string) => {
    const id = ++counter.current;
    const now = Date.now();
    if (now - fxBurst.current.t > 700) fxBurst.current.n = 0;
    const slot = fxBurst.current.n++ % 5;
    fxBurst.current.t = now;
    const x = 44 + Math.random() * 12;
    setFx((prev) => [...prev.slice(-5), { id, text, color, x, slot }]);
    setTimeout(() => setFx((prev) => prev.filter((f) => f.id !== id)), 2200 + slot * 200);
  }, []);

  const pushToast = useCallback((title: string, body: string, glyph: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, title, body, glyph }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4100);
  }, []);

  const announceRound = useCallback((r: RunState) => {
    const key = ++counter.current;
    setBanner({ key, setup: r.setup });
    setTimeout(() => setBanner((b) => (b && b.key === key ? null : b)), 2700);

    const token = ++oracleToken.current;
    setLoadingOracle(true);
    getOracleWisdom(
      `Round ${r.round}, ${r.setup.ringCount} rings, Anomalies: ${r.setup.anomalies.join(' + ')}${
        r.setup.isBoss ? `, Boss: ${r.setup.bossName}` : ''
      }. Moves Left: ${r.energy}. Mode: ${r.mode}.`,
    ).then((text) => {
      if (token !== oracleToken.current) return;
      setOracleText(text);
      setLoadingOracle(false);
    });
  }, []);

  const metaEffects = useMemo(() => getMetaEffects(profile.meta), [profile.meta]);
  const metaRef = useRef(metaEffects);
  metaRef.current = metaEffects;

  // --- ACHIEVEMENTS ---
  const checkAchievements = useCallback(
    (r: RunState) => {
      const newly = evaluateAchievements(profileRef.current, r);
      if (newly.length === 0) return [];
      const p = profileRef.current;
      const achievements = { ...p.achievements };
      let shards = p.shards;
      newly.forEach((a) => {
        achievements[a.id] = Date.now();
        shards += a.reward;
        pushToast(a.name, `+${a.reward} ◆ Shards`, a.glyph);
        runUnlocked.current.push(a.name);
      });
      commitProfile({ ...p, achievements, shards });
      sfx.achievement();
      return newly;
    },
    [commitProfile, pushToast],
  );

  // --- RUN END ---
  const finishRun = useCallback(
    (r: RunState) => {
      checkAchievements(r);
      const p = profileRef.current;
      const payout = runPayout(r);
      const newBestRound = r.stats.roundsCleared > p.stats.bestRound[r.mode];
      const newBestScore = r.score > p.stats.bestScore[r.mode];
      const daily = { ...p.daily };
      if (r.mode === GameMode.DAILY) {
        const prev = daily[dailyKey.current];
        daily[dailyKey.current] = {
          round: Math.max(prev?.round ?? 0, r.stats.roundsCleared),
          score: Math.max(prev?.score ?? 0, Math.floor(r.score)),
        };
      }
      commitProfile({
        ...p,
        shards: p.shards + payout,
        daily,
        stats: {
          ...p.stats,
          runs: p.stats.runs + 1,
          totalScore: p.stats.totalScore + Math.floor(r.score),
          perfects: p.stats.perfects + r.stats.perfects,
          bosses: p.stats.bosses + r.stats.bosses,
          directives: p.stats.directives + r.stats.directivesDone,
          bestRound: { ...p.stats.bestRound, [r.mode]: Math.max(p.stats.bestRound[r.mode], r.stats.roundsCleared) },
          bestScore: { ...p.stats.bestScore, [r.mode]: Math.max(p.stats.bestScore[r.mode], Math.floor(r.score)) },
        },
      });
      setSummary({
        payout,
        bossShards: r.shardsEarned,
        newBestRound,
        newBestScore,
        unlocked: [...runUnlocked.current],
      });
    },
    [checkAchievements, commitProfile],
  );

  // --- EVENTS FROM THE ENGINE ---
  const handleEvents = useCallback(
    (events: GameEvent[], after: RunState) => {
      for (const e of events) {
        switch (e.type) {
          case 'move':
            if (e.paradox) {
              sfx.power();
              pushFx('✧ PARADOX', '#e879f9');
            } else sfx.move();
            break;
          case 'win': {
            const { report } = e;
            if (report.isBoss) sfx.boss();
            else if (report.perfect) sfx.perfect();
            else sfx.win();
            pushFx(`+${report.totalBits} BITS`, '#facc15');
            if (report.perfect) pushFx(`✦ PERFECT  x${report.comboAfter.toFixed(2)}`, '#e879f9');
            if (report.directiveMet) pushFx(`◆ DIRECTIVE +${report.directiveBonus}`, '#34d399');
            if (report.isBoss) {
              pushFx('♛ BOSS DEFEATED +1 ◆', '#f59e0b');
              const p = profileRef.current;
              commitProfile({ ...p, shards: p.shards + report.shards });
            }
            checkAchievements(after);
            break;
          }
          case 'failsafe':
            sfx.failsafe();
            pushFx('⟳ CORE REBOOTED', '#34d399');
            break;
          case 'leak':
            sfx.leak();
            pushFx('−1 energy leak', '#ef4444');
            break;
          case 'defeat':
            sfx.lose();
            finishRun(after);
            break;
        }
      }
    },
    [checkAchievements, commitProfile, finishRun, pushFx],
  );

  // --- RUN LIFECYCLE ---
  const startRun = useCallback(
    (mode: GameMode) => {
      const p = profileRef.current;
      const seed = mode === GameMode.DAILY ? dailySeed() : randomSeed();
      dailyKey.current = localDateKey();
      runUnlocked.current = [];
      const r = createRun(mode, seed, getMetaEffects(p.meta));
      const modesPlayed = p.stats.modesPlayed.includes(mode) ? p.stats.modesPlayed : [...p.stats.modesPlayed, mode];
      commitProfile({
        ...p,
        stats: { ...p.stats, modesPlayed },
        settings: { ...p.settings, seenHelp: true },
      });
      commitRun(r);
      setSummary(null);
      setSelectedPeg(null);
      setScreen('RUN');
      if (!p.settings.seenHelp) setShowHelp(true);
      sfx.click();
      announceRound(r);
    },
    [announceRound, commitProfile, commitRun],
  );

  const toMenu = () => {
    commitRun(null);
    setSummary(null);
    setBanner(null);
    setScreen('MENU');
  };

  const abandonRun = () => {
    const r = runRef.current;
    if (!r || r.phase === GameState.GAME_OVER) return;
    if (!window.confirm('Abandon this run? Your progress so far is paid out in Shards.')) return;
    const over: RunState = { ...r, phase: GameState.GAME_OVER };
    commitRun(over);
    finishRun(over);
  };

  // --- GAMEPLAY ---
  const handlePegClick = useCallback(
    (index: number) => {
      const r = runRef.current;
      if (!r || r.phase !== GameState.PLAYING) return;
      const sel = selectedRef.current;
      if (sel === null) {
        if (r.pegs[index] && r.pegs[index].length > 0) {
          sfx.select();
          setSelectedPeg(index);
        }
        return;
      }
      setSelectedPeg(null);
      if (sel === index) return; // deselect
      const out = applyMove(r, sel, index, metaRef.current);
      if (out.status === 'ok') {
        commitRun(out.run);
        handleEvents(out.events, out.run);
      } else if (out.status === 'invalid') {
        sfx.invalid();
        setShake({ peg: index, n: Date.now() });
      } else if (out.status === 'noEnergy') {
        sfx.deny();
        pushFx('NOT ENOUGH ENERGY', '#f97316');
      }
    },
    [commitRun, handleEvents, pushFx, setSelectedPeg],
  );

  const handlePower = useCallback(
    (power: PowerId) => {
      const r = runRef.current;
      if (!r || r.phase !== GameState.PLAYING) return;
      let next: RunState | null = null;
      if (power === 'REWIND') next = castRewind(r);
      if (power === 'LENS') next = castLens(r);
      if (power === 'PARADOX') next = toggleParadox(r);
      if (power === 'CHRONO') next = castChrono(r);
      if (!next) {
        sfx.deny();
        return;
      }
      commitRun(next);
      sfx.power();
      if (power === 'REWIND') setSelectedPeg(null);
      if (power === 'CHRONO') pushFx('⧖ +20s', '#34d399');
    },
    [commitRun, pushFx, setSelectedPeg],
  );

  // Round timer (par time / Blitz leak)
  const playing = screen === 'RUN' && run?.phase === GameState.PLAYING;
  useEffect(() => {
    if (!playing || showHelp) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 1);
      last = now;
      if (document.hidden) return;
      const cur = runRef.current;
      if (!cur || cur.phase !== GameState.PLAYING) return;
      const out = tick(cur, dt);
      commitRun(out.run);
      if (out.events.length > 0) handleEvents(out.events, out.run);
    }, 200);
    return () => clearInterval(id);
  }, [playing, run?.round, showHelp, commitRun, handleEvents]);

  // Keyboard controls
  const keyHandlers = useRef({ handlePegClick, handlePower });
  keyHandlers.current = { handlePegClick, handlePower };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const r = runRef.current;
      if (e.key === 'Escape') {
        setShowHelp(false);
        setSelectedPeg(null);
        return;
      }
      if (!r || r.phase !== GameState.PLAYING) return;
      const k = e.key.toLowerCase();
      const n = parseInt(k, 10);
      if (n >= 1 && n <= r.setup.pegCount) keyHandlers.current.handlePegClick(n - 1);
      else if (k === 'z' || k === 'u') keyHandlers.current.handlePower('REWIND');
      else if (k === 'h') keyHandlers.current.handlePower('LENS');
      else if (k === 'p') keyHandlers.current.handlePower('PARADOX');
      else if (k === 'c') keyHandlers.current.handlePower('CHRONO');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // --- SHOP / DRAFT / META HANDLERS ---
  const apply = (next: RunState | null, ok: () => void = sfx.buy) => {
    if (next) {
      commitRun(next);
      ok();
    } else sfx.deny();
  };

  const handleMetaPurchase = (key: MetaKey) => {
    const p = profileRef.current;
    const def = META_DEFS.find((d) => d.key === key)!;
    const level = p.meta[key];
    const cost = metaCost(def, level);
    if (level >= def.max || p.shards < cost) {
      sfx.deny();
      return;
    }
    sfx.buy();
    commitProfile({ ...p, shards: p.shards - cost, meta: { ...p.meta, [key]: level + 1 } });
  };

  const toggleMute = () => {
    const p = profileRef.current;
    commitProfile({ ...p, settings: { ...p.settings, muted: !p.settings.muted } });
  };

  // Next-round forecast shown in the shop
  const hasPowers = run ? totalCharges(run.powers) > 0 : false;
  const forecast = useMemo(
    () => (run && run.phase === GameState.SHOP ? previewSetup(run) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run?.phase, run?.round, run?.relics, run?.seed, run?.mode, hasPowers],
  );

  // --- RENDERING ---
  const zone = run ? getZone(run.round) : ZONES[0];
  let danger = 0;
  if (screen === 'RUN' && run && run.phase === GameState.PLAYING) {
    danger = run.energy <= 5 ? (6 - run.energy) / 6 : 0;
    if (run.mode === GameMode.BLITZ && run.elapsed > parOf(run)) danger = Math.max(danger, 0.6);
  }

  const rootStyle = { ['--accent' as string]: zone.accent, ['--accent-rgb' as string]: zone.rgb } as React.CSSProperties;

  let content: React.ReactNode;

  if (screen === 'MENU') {
    content = (
      <Menu
        profile={profile}
        mode={menuMode}
        onMode={(m) => {
          sfx.click();
          setMenuMode(m);
        }}
        onStart={() => startRun(menuMode)}
        onArchive={() => setScreen('ARCHIVE')}
        onCodex={() => setScreen('CODEX')}
        onHelp={() => setShowHelp(true)}
        onToggleMute={toggleMute}
      />
    );
  } else if (screen === 'ARCHIVE') {
    content = (
      <MetaShop
        fullScreen
        title="The Archive"
        subtitle="Knowledge that survives every collapse."
        shards={profile.shards}
        levels={profile.meta}
        onPurchase={handleMetaPurchase}
        onContinue={() => setScreen(run && run.phase === GameState.GAME_OVER ? 'RUN' : 'MENU')}
        continueLabel={run && run.phase === GameState.GAME_OVER ? '← Back' : '← Main Menu'}
      />
    );
  } else if (screen === 'CODEX') {
    content = <Codex profile={profile} onClose={() => setScreen('MENU')} />;
  } else if (run && run.phase === GameState.GAME_OVER && summary) {
    content = (
      <GameOver
        run={run}
        summary={summary}
        shards={profile.shards}
        onRetry={() => startRun(run.mode)}
        onMenu={toMenu}
        onArchive={() => setScreen('ARCHIVE')}
      />
    );
  } else if (run) {
    const celebrate = run.phase !== GameState.PLAYING;
    content = (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        {/* Oracle Text */}
        <div className="absolute top-4 w-full text-center px-16 pointer-events-none">
          <p
            className="text-xs md:text-sm font-display uppercase tracking-[0.3em] opacity-50"
            style={{ color: zone.accent }}
          >
            {loadingOracle ? 'Receiving Transmission...' : oracleText}
          </p>
        </div>
        <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-1">
          <button
            onClick={abandonRun}
            className="text-[10px] uppercase tracking-widest text-slate-600 hover:text-red-400 border border-slate-800 rounded px-2 py-1"
          >
            ✕ Abandon
          </button>
          <span data-testid="seed" className="text-[10px] font-mono tracking-widest text-slate-700">
            {run.mode === GameMode.DAILY ? dailyKey.current : 'SEED'} · {run.seed.toString(16).toUpperCase()}
          </span>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="absolute top-3 right-3 z-20 text-[10px] uppercase tracking-widest text-slate-600 hover:text-cyan-300 border border-slate-800 rounded px-2 py-1"
        >
          ? Help
        </button>

        <div className="flex-1 flex flex-col justify-center pt-8">
          <TowerGame
            round={run.round}
            pegs={run.pegs}
            setup={run.setup}
            selectedPeg={selectedPeg}
            onPegClick={handlePegClick}
            hint={run.hint}
            clearLens={hasRelic(run.relics, 'CLEAR_LENS')}
            paradoxArmed={run.paradoxArmed}
            shake={shake}
            celebrate={celebrate}
            accent={zone.accent}
          />
        </div>

        <HUD run={run} zone={zone} onPower={handlePower} />

        {run.phase === GameState.SHOP && forecast && (
          <Shop
            run={run}
            next={forecast}
            zone={zone}
            onBuy={(uid) => apply(buyOffer(runRef.current!, uid))}
            onDefrag={() => apply(buyDefrag(runRef.current!, forecast.required))}
            onReroll={() => apply(rerollShop(runRef.current!, metaEffects), sfx.click)}
            onNextRound={() => {
              const cur = runRef.current!;
              const next = startNextRound(cur, metaEffects);
              if (next === cur) return; // already started (double click)
              commitRun(next);
              setSelectedPeg(null);
              sfx.click();
              announceRound(next);
            }}
          />
        )}

        {run.phase === GameState.DRAFT && (
          <Draft run={run} onPick={(id: RelicId) => apply(pickDraft(runRef.current!, id))} />
        )}

        {run.phase === GameState.META_SHOP && (
          <MetaShop
            shards={profile.shards}
            levels={profile.meta}
            onPurchase={handleMetaPurchase}
            onContinue={() => apply(leaveMetaShop(runRef.current!, metaEffects), sfx.click)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={rootStyle} className="relative min-h-screen">
      <Background accentRgb={zone.rgb} danger={danger} />
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top, rgba(${zone.rgb},0.14), transparent 60%), radial-gradient(ellipse at bottom, rgba(168,85,247,0.08), transparent 55%)`,
        }}
      />
      <div
        className="fixed inset-0 z-[51] pointer-events-none transition-opacity duration-500"
        style={{
          opacity: danger > 0 ? 1 : 0,
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(239,68,68,${0.12 + danger * 0.35}) 100%)`,
        }}
      />
      {content}
      {banner && screen === 'RUN' && run?.phase === GameState.PLAYING && <RoundBanner key={banner.key} setup={banner.setup} zone={getZone(banner.setup.round)} />}
      <FloatingFx items={fx} />
      <Toasts items={toasts} />
      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default App;
