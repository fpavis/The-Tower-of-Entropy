import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GameState, 
  GameStats, 
  Peg, 
  VariationType, 
  MetaUpgrades, 
  RunUpgrades 
} from './types';
import { 
  calculateMinMoves, 
  calculateRingCount, 
  INITIAL_META_UPGRADES, 
  INITIAL_RUN_UPGRADES, 
  VARIATIONS_POOL, 
  COLORS
} from './constants';
import TowerGame from './components/TowerGame';
import HUD from './components/HUD';
import Shop from './components/Shop';
import MetaShop from './components/MetaShop';
import { getOracleWisdom } from './services/geminiService';

const App: React.FC = () => {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [pegs, setPegs] = useState<Peg[]>([[], [], []]);
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
  
  // Game Stats
  const [stats, setStats] = useState<GameStats>({
    round: 1,
    ringCount: 3,
    movesLeft: 0,
    maxMoves: 0,
    currentMinMoves: 7,
    roundStartTotal: 0,
    moveBreakdown: { required: 0, carryover: 0, bonus: 0 },
    bits: 0,
    combo: 1.0,
    metaPoints: 0,
    variation: VariationType.STANDARD,
  });

  // Tracking for current round performance
  const [roundMovesUsed, setRoundMovesUsed] = useState(0);
  const [roundMoveCount, setRoundMoveCount] = useState(0); // Tracks raw number of moves
  const [minMovesForRound, setMinMovesForRound] = useState(0);

  // Upgrades
  const [metaUpgrades, setMetaUpgrades] = useState<MetaUpgrades>(INITIAL_META_UPGRADES);
  const [runUpgrades, setRunUpgrades] = useState<RunUpgrades>(INITIAL_RUN_UPGRADES);

  // Oracle
  const [oracleText, setOracleText] = useState<string>("");
  const [loadingOracle, setLoadingOracle] = useState(false);

  // --- GAMEPLAY LOGIC ---

  const initializeRound = useCallback((round: number, carryOverMoves: number, isNewRun: boolean) => {
    const ringCount = calculateRingCount(round);
    const minMoves = calculateMinMoves(ringCount);
    
    // Select Variation (Random, but Round 1 is always Standard)
    let variation = VariationType.STANDARD;
    if (round > 1) {
      const idx = Math.floor(Math.random() * VARIATIONS_POOL.length);
      variation = VARIATIONS_POOL[idx];
    }

    // Initialize Pegs
    const newPegs: Peg[] = [[], [], []];
    for (let i = ringCount; i >= 1; i--) {
      newPegs[0].push(i);
    }

    // Calculate New Moves Added
    let movesAdded = 0;
    let bonus = 0;

    if (isNewRun) {
      // Start of run formula
      movesAdded = Math.ceil(minMoves * metaUpgrades.startBufferMultiplier);
      bonus = movesAdded - minMoves;
    } else {
      // Standard refill formula
      // Base Min + Flat Bonus + % Bonus
      const baseRefill = minMoves + metaUpgrades.minMoveBonus + runUpgrades.flatRefillBonus;
      movesAdded = Math.floor(baseRefill * (1 + runUpgrades.percentRefillBonus));
      
      // Interest logic (Meta Upgrade)
      if (metaUpgrades.interestRate > 0) {
        movesAdded += Math.floor(carryOverMoves * metaUpgrades.interestRate);
      }
      bonus = movesAdded - minMoves;
    }

    const totalMoves = carryOverMoves + movesAdded;

    setPegs(newPegs);
    setStats(prev => ({
      ...prev,
      round,
      ringCount,
      movesLeft: totalMoves,
      maxMoves: Math.max(prev.maxMoves, totalMoves),
      currentMinMoves: minMoves,
      roundStartTotal: totalMoves,
      moveBreakdown: {
        required: minMoves,
        carryover: carryOverMoves,
        bonus: Math.max(0, bonus)
      },
      variation,
    }));
    setRoundMovesUsed(0);
    setRoundMoveCount(0);
    setMinMovesForRound(minMoves);
    setSelectedPeg(null);
    setGameState(GameState.PLAYING);

    // Call Oracle
    setLoadingOracle(true);
    getOracleWisdom(`Round ${round}, ${ringCount} rings, Variation: ${variation}. Moves Left: ${totalMoves}.`)
      .then(text => {
        setOracleText(text);
        setLoadingOracle(false);
      });

  }, [metaUpgrades, runUpgrades]);

  const startGame = () => {
    setStats({
      round: 1,
      ringCount: 3,
      movesLeft: 0,
      maxMoves: 0,
      currentMinMoves: 7,
      roundStartTotal: 0,
      moveBreakdown: { required: 0, carryover: 0, bonus: 0 },
      bits: 0,
      combo: metaUpgrades.comboRetention,
      metaPoints: 0,
      variation: VariationType.STANDARD,
    });
    setRunUpgrades(INITIAL_RUN_UPGRADES);
    initializeRound(1, 0, true);
  };

  const handleMove = (from: number, to: number) => {
    if (gameState !== GameState.PLAYING) return;
    
    // Check locked peg variation
    if (stats.variation === VariationType.LOCKED_PEG && to === 1 && pegs[to].length >= 2) {
       return; 
    }

    const sourcePeg = [...pegs[from]];
    const targetPeg = [...pegs[to]];

    if (sourcePeg.length === 0) return;

    const ringToMove = sourcePeg[sourcePeg.length - 1];
    const targetTopRing = targetPeg.length > 0 ? targetPeg[targetPeg.length - 1] : Infinity;

    if (ringToMove < targetTopRing) {
      // Valid Move
      sourcePeg.pop();
      targetPeg.push(ringToMove);

      const newPegs = [...pegs];
      newPegs[from] = sourcePeg;
      newPegs[to] = targetPeg;
      setPegs(newPegs);
      setSelectedPeg(null);

      // Consume Moves
      const currentMoveNumber = roundMoveCount + 1;
      setRoundMoveCount(currentMoveNumber);

      let cost = 1;
      if (stats.variation === VariationType.HEAVY_RINGS) {
        if (currentMoveNumber % 3 === 0) {
          cost = 2;
        }
      }
      
      const newMovesLeft = stats.movesLeft - cost;
      setRoundMovesUsed(prev => prev + cost);
      
      setStats(prev => ({
        ...prev,
        movesLeft: newMovesLeft
      }));

      // Check Game Over
      if (newMovesLeft < 0) {
        setGameState(GameState.GAME_OVER);
        return;
      }

      // Check Win Condition
      const targetIndex = stats.variation === VariationType.TARGET_SWAP ? 1 : 2;
      
      if (newPegs[targetIndex].length === stats.ringCount) {
        handleRoundWin(newMovesLeft);
      }
    } else {
      setSelectedPeg(null);
    }
  };

  const handleRoundWin = (remainingMoves: number) => {
    const movesOverMin = Math.max(0, roundMovesUsed - minMovesForRound);
    
    // Combo Logic
    // Buffer is defined as the extra moves available at START of round beyond minimum.
    const startBuffer = Math.max(0, stats.roundStartTotal - minMovesForRound);
    
    let newCombo = stats.combo;
    
    if (movesOverMin === 0) {
      // Perfect Play
      newCombo += 0.1;
    } else {
      // Imperfect Play
      if (movesOverMin <= startBuffer) {
        // Protected by Buffer - No Change
      } else {
        // Exceeded Buffer - Decay
        const unprotectedMistakes = movesOverMin - startBuffer;
        if (!runUpgrades.comboShield) {
           newCombo = Math.max(1.0, newCombo - (0.01 * unprotectedMistakes));
        } else {
          setRunUpgrades(prev => ({ ...prev, comboShield: false }));
        }
      }
    }

    // Bits Calculation
    const baseBits = (100 * Math.sqrt(stats.round)) * runUpgrades.baseBitMultiplier;
    const penalty = 20; 
    const earnedBits = Math.max(0, baseBits - (penalty * movesOverMin)) * newCombo;

    setStats(prev => ({
      ...prev,
      bits: prev.bits + earnedBits,
      combo: newCombo,
    }));

    if (stats.round % 5 === 0) {
      setStats(prev => ({ ...prev, metaPoints: prev.metaPoints + 1 }));
      setGameState(GameState.META_SHOP);
    } else {
      setGameState(GameState.SHOP);
    }
  };

  // --- SHOP HANDLERS ---

  const handleShopPurchase = (cost: number, action: any) => {
    setStats(prev => ({ ...prev, bits: prev.bits - cost }));
    
    const result = action();
    if (result.type === 'flatRefillBonus') {
       setRunUpgrades(prev => ({ ...prev, flatRefillBonus: prev.flatRefillBonus + result.val }));
    } else if (result.type === 'percentRefillBonus') {
       setRunUpgrades(prev => ({ ...prev, percentRefillBonus: prev.percentRefillBonus + result.val }));
    } else if (result.type === 'baseBitMultiplier') {
       setRunUpgrades(prev => ({ ...prev, baseBitMultiplier: prev.baseBitMultiplier + result.val }));
    } else if (result.type === 'comboShield') {
       setRunUpgrades(prev => ({ ...prev, comboShield: true }));
    } else if (result.type === 'heal') {
       setStats(prev => ({ ...prev, movesLeft: prev.movesLeft + result.val }));
    }
  };

  const handleMetaPurchase = (key: keyof MetaUpgrades, cost: number) => {
    setStats(prev => ({ ...prev, metaPoints: prev.metaPoints - cost }));
    setMetaUpgrades(prev => {
      const newState = { ...prev };
      if (key === 'startBufferMultiplier') newState.startBufferMultiplier += 0.1;
      if (key === 'comboRetention') newState.comboRetention += 0.2;
      if (key === 'interestRate') newState.interestRate += 0.01;
      if (key === 'minMoveBonus') newState.minMoveBonus += 1;
      return newState;
    });
  };

  const nextRoundFromShop = () => {
    initializeRound(stats.round + 1, stats.movesLeft, false);
  };

  const nextFromMeta = () => {
    setGameState(GameState.SHOP);
  };


  // --- RENDERING ---

  if (gameState === GameState.MENU) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-4 text-center">
        <h1 className="text-6xl md:text-8xl font-display text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-600 mb-8 animate-pulse">
          ENTROPY
        </h1>
        <p className="max-w-md text-slate-400 mb-8 font-mono">
          The universe tends towards disorder. Organize the rings. Manage your energy. Delay the inevitable.
        </p>
        <button 
          onClick={startGame}
          className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(8,145,178,0.5)]"
        >
          INITIALIZE SEQUENCE
        </button>
      </div>
    );
  }

  if (gameState === GameState.GAME_OVER) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-950/30 p-4 text-center">
        <h1 className="text-6xl font-display text-red-500 mb-4">SYSTEM FAILURE</h1>
        <p className="text-xl text-slate-300 mb-2">Energy Depleted at Round {stats.round}</p>
        <p className="text-slate-500 mb-8">Entropy has claimed you.</p>
        <button 
          onClick={() => setGameState(GameState.MENU)}
          className="px-8 py-3 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all rounded"
        >
          REBOOT
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black -z-10 pointer-events-none" />
      
      {/* Oracle Text */}
      <div className="absolute top-4 w-full text-center px-4 pointer-events-none">
        <p className="text-xs md:text-sm text-cyan-900/50 font-display uppercase tracking-[0.3em]">
          {loadingOracle ? "Receiving Transmission..." : oracleText}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <TowerGame 
          pegs={pegs} 
          ringCount={stats.ringCount} 
          variation={stats.variation}
          onMove={handleMove}
          selectedPeg={selectedPeg}
          setSelectedPeg={setSelectedPeg}
        />
      </div>

      <HUD stats={stats} />

      {gameState === GameState.SHOP && (
        <Shop 
          bits={stats.bits}
          movesLeft={stats.movesLeft}
          currentRound={stats.round}
          nextRings={calculateRingCount(stats.round + 1)}
          runUpgrades={runUpgrades}
          onPurchase={handleShopPurchase}
          onNextRound={nextRoundFromShop}
        />
      )}

      {gameState === GameState.META_SHOP && (
        <MetaShop 
          metaPoints={stats.metaPoints}
          metaUpgrades={metaUpgrades}
          onPurchase={handleMetaPurchase}
          onContinue={nextFromMeta}
        />
      )}
    </div>
  );
};

export default App;