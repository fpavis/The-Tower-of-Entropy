import React from 'react';
import { MetaUpgrades } from '../types';

interface MetaShopProps {
  metaPoints: number;
  metaUpgrades: MetaUpgrades;
  onPurchase: (upgradeKey: keyof MetaUpgrades, cost: number) => void;
  onContinue: () => void;
}

const MetaShop: React.FC<MetaShopProps> = ({ metaPoints, metaUpgrades, onPurchase, onContinue }) => {
  const upgrades = [
    {
      key: 'startBufferMultiplier',
      name: 'Overclock Start',
      desc: 'Increase starting move multiplier (+0.1x)',
      current: `${metaUpgrades.startBufferMultiplier.toFixed(1)}x`,
      cost: 1
    },
    {
      key: 'comboRetention',
      name: 'Combo Retention',
      desc: 'Start runs with higher combo (+0.2)',
      current: `${metaUpgrades.comboRetention.toFixed(1)}x`,
      cost: 1
    },
    {
      key: 'interestRate',
      name: 'Compound Interest',
      desc: 'Unused moves generate interest (+1%)',
      current: `${(metaUpgrades.interestRate * 100).toFixed(0)}%`,
      cost: 1
    },
    {
      key: 'minMoveBonus',
      name: 'Core Efficiency',
      desc: 'Flat bonus to minimum moves per round (+1)',
      current: `+${metaUpgrades.minMoveBonus}`,
      cost: 1
    }
  ];

  return (
    <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-slate-900 border border-purple-500/50 rounded-xl shadow-[0_0_50px_rgba(168,85,247,0.2)] overflow-hidden flex flex-col">
        
        <div className="p-8 border-b border-purple-900 text-center">
          <h2 className="text-4xl font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 mb-2">
            Singularity Reached
          </h2>
          <p className="text-slate-400">Structure Stabilized. Meta-Evolution Available.</p>
          <div className="mt-4 text-2xl font-mono text-purple-300">
            Available Points: {metaPoints}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {upgrades.map((u) => (
            <button
              key={u.key}
              disabled={metaPoints < u.cost}
              onClick={() => onPurchase(u.key as keyof MetaUpgrades, u.cost)}
              className={`
                flex flex-col p-4 rounded-lg border text-left transition-all
                ${metaPoints >= u.cost 
                  ? 'bg-slate-800 border-purple-500/30 hover:border-purple-400 hover:bg-slate-800/80' 
                  : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}
              `}
            >
              <div className="flex justify-between w-full mb-1">
                <span className="font-bold text-white">{u.name}</span>
                <span className="text-purple-400 font-mono">{u.cost} PT</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{u.desc}</p>
              <div className="text-right text-xs text-purple-200">Current: {u.current}</div>
            </button>
          ))}
        </div>

        <div className="p-8 flex justify-center">
          <button 
            onClick={onContinue}
            className="px-12 py-3 bg-purple-600 rounded-full font-bold text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/50"
          >
            Resume Simulation
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetaShop;
