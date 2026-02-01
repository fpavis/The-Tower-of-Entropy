import React from 'react';
import { calculateMinMoves } from '../constants';
import { RunUpgrades } from '../types';

interface ShopProps {
  bits: number;
  movesLeft: number;
  currentRound: number;
  nextRings: number;
  runUpgrades: RunUpgrades;
  onPurchase: (cost: number, action: () => any) => void;
  onNextRound: () => void;
}

const Shop: React.FC<ShopProps> = ({ 
  bits, 
  movesLeft, 
  currentRound, 
  nextRings, 
  runUpgrades,
  onPurchase, 
  onNextRound 
}) => {
  const minMovesNext = calculateMinMoves(nextRings);

  const Upgrades: {
    id: string;
    name: string;
    desc: string;
    cost: number;
    action: () => { type: string; val: number | boolean };
  }[] = [
    {
      id: 'logic',
      name: 'Logic Optimization',
      desc: '+2 Moves per round refill',
      cost: 150,
      action: () => {
        // Handled in parent via checking type, but for simple callback:
        // We pass a function that updates the runUpgrades state in App
        return { type: 'flatRefillBonus', val: 2 };
      }
    },
    {
      id: 'cache',
      name: 'Cache Expansion',
      desc: '+10% Move refill',
      cost: 250,
      action: () => {
         return { type: 'percentRefillBonus', val: 0.1 };
      }
    },
    {
      id: 'miner',
      name: 'Bit Miner',
      desc: '+20% Base Bits earned',
      cost: 300,
      action: () => {
         return { type: 'baseBitMultiplier', val: 0.2 };
      }
    },
    {
      id: 'defrag',
      name: 'Emergency Defrag',
      desc: `Add ${minMovesNext} moves now`,
      cost: 400,
      action: () => {
         return { type: 'heal', val: minMovesNext };
      }
    }
  ];

  if (!runUpgrades.comboShield) {
    Upgrades.push({
      id: 'shield',
      name: 'Combo Shield',
      desc: 'Protect combo once per round',
      cost: 500,
      action: () => {
        return { type: 'comboShield', val: true };
      }
    });
  }

  return (
    <div className="absolute inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-700 bg-slate-900">
          <h2 className="text-3xl font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            System Maintenance
          </h2>
          <div className="flex justify-between mt-2 text-sm text-slate-400">
            <span>Current Buffer: <span className="text-emerald-400">{movesLeft}</span></span>
            <span>Available Bits: <span className="text-yellow-400">{Math.floor(bits)}</span></span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
          {Upgrades.map((u) => (
            <button
              key={u.id}
              disabled={bits < u.cost}
              onClick={() => onPurchase(u.cost, u.action)}
              className={`
                group flex flex-col p-4 rounded-lg border text-left transition-all
                ${bits >= u.cost 
                  ? 'bg-slate-700 border-slate-600 hover:border-cyan-400 hover:bg-slate-600' 
                  : 'bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed'}
              `}
            >
              <div className="flex justify-between w-full mb-2">
                <span className="font-bold text-white group-hover:text-cyan-300">{u.name}</span>
                <span className="text-yellow-400 font-mono">{u.cost} B</span>
              </div>
              <p className="text-sm text-slate-400">{u.desc}</p>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-slate-700 bg-slate-900 flex justify-end">
          <button 
            onClick={onNextRound}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all active:scale-95"
          >
            Initiate Round {currentRound + 1}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Shop;