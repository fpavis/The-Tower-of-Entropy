import React from 'react';
import { GameStats, VariationType } from '../types';

interface HUDProps {
  stats: GameStats;
}

const HUD: React.FC<HUDProps> = ({ stats }) => {
  const isDanger = stats.movesLeft <= 5;

  // Calculate widths for the segmented bar
  const max = Math.max(stats.maxMoves, 1);
  const minMovesCount = Math.min(stats.movesLeft, stats.currentMinMoves);
  const bufferMovesCount = Math.max(0, stats.movesLeft - stats.currentMinMoves);
  
  const minMovesPct = (minMovesCount / max) * 100;
  const bufferMovesPct = (bufferMovesCount / max) * 100;

  // Function to create tick mark style based on count
  const getTickStyle = (count: number) => {
      if (count <= 0 || count > 50) return {};
      return {
          backgroundImage: 'linear-gradient(90deg, transparent 0%, transparent calc(100% - 1px), rgba(0,0,0,0.3) calc(100% - 1px))',
          backgroundSize: `${100/count}% 100%`
      };
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-4">
      {/* Top Bar: Rounds & Health */}
      <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-700 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Round</span>
          <span className="text-2xl font-display text-cyan-400">
            {stats.round} <span className="text-sm text-slate-500">({stats.ringCount} Rings)</span>
          </span>
        </div>

        <div className="flex flex-col items-center flex-1 mx-8">
           <div className="flex justify-between w-full text-[10px] text-slate-500 uppercase tracking-widest mb-1 px-1">
              <span>Required</span>
              <span>Buffer</span>
           </div>
           
           <div className="w-full h-8 bg-slate-800 rounded-lg overflow-hidden relative flex border border-slate-700">
              {/* Required Moves Segment */}
              <div 
                className={`h-full transition-all duration-300 relative ${stats.movesLeft < stats.currentMinMoves ? 'bg-orange-600 animate-pulse' : 'bg-cyan-600'}`}
                style={{ width: `${minMovesPct}%`, ...getTickStyle(minMovesCount) }}
              />
              
              {/* Buffer Moves Segment */}
              <div 
                className="h-full bg-emerald-500 transition-all duration-300 relative"
                style={{ width: `${bufferMovesPct}%`, ...getTickStyle(bufferMovesCount) }}
              />

              {/* Marker Line for Min Moves */}
              <div 
                className="absolute top-0 bottom-0 border-l-2 border-white/50 z-10"
                style={{ left: `${(stats.currentMinMoves / max) * 100}%`, opacity: bufferMovesCount > 0 ? 1 : 0.2 }}
              />

              {/* Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center font-bold text-shadow text-white z-20 pointer-events-none">
                 {stats.movesLeft}
              </div>
           </div>
           
           <div className="flex justify-between w-full text-xs text-slate-400 mt-1 px-1 font-mono">
             <div className="flex gap-4">
               <span className={stats.movesLeft < stats.currentMinMoves ? 'text-orange-400' : 'text-cyan-400'}>
                  Req: {stats.currentMinMoves}
               </span>
               <span className={bufferMovesCount > 0 ? 'text-emerald-400' : 'text-slate-600'}>
                  Buf: {bufferMovesCount}
               </span>
             </div>
             
             {/* Breakdown Stats */}
             <div className="flex gap-2 text-[10px] md:text-xs">
                <span title="Moves carried over from previous round" className="text-slate-500">
                  Carry: <span className="text-slate-300">+{stats.moveBreakdown.carryover}</span>
                </span>
                <span title="Moves added from upgrades" className="text-slate-500">
                  Bonus: <span className="text-slate-300">+{stats.moveBreakdown.bonus}</span>
                </span>
                <span title="Base moves for this round" className="text-slate-500">
                  Base: <span className="text-slate-300">+{stats.moveBreakdown.required}</span>
                </span>
             </div>
           </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Bits</span>
          <span className="text-2xl font-display text-yellow-400">{Math.floor(stats.bits)}</span>
        </div>
      </div>

      {/* Info Bar: Variation & Combo */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
           <span className="text-xs text-slate-500 uppercase bg-slate-900 px-2 py-1 rounded">Anomaly</span>
           <span className={`text-sm font-bold ${stats.variation === VariationType.STANDARD ? 'text-slate-300' : 'text-purple-400'}`}>
             {stats.variation}
           </span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-xs text-slate-500 uppercase bg-slate-900 px-2 py-1 rounded">Combo</span>
           <span className="text-xl font-display text-fuchsia-400">x{stats.combo.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default HUD;