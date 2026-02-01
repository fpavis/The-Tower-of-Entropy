import React, { useState, useEffect } from 'react';
import { Peg, VariationType } from '../types';
import { COLORS } from '../constants';

interface TowerGameProps {
  pegs: Peg[];
  ringCount: number;
  variation: VariationType;
  onMove: (from: number, to: number) => void;
  selectedPeg: number | null;
  setSelectedPeg: (index: number | null) => void;
}

const TowerGame: React.FC<TowerGameProps> = ({ 
  pegs, 
  ringCount, 
  variation, 
  onMove, 
  selectedPeg, 
  setSelectedPeg 
}) => {
  
  const handlePegClick = (index: number) => {
    if (selectedPeg === null) {
      // Select source
      if (pegs[index].length > 0) {
        setSelectedPeg(index);
      }
    } else {
      // Move or deselect
      if (selectedPeg === index) {
        setSelectedPeg(null); // Deselect
      } else {
        onMove(selectedPeg, index);
      }
    }
  };

  const getTargetLabel = (index: number) => {
    if (variation === VariationType.TARGET_SWAP) {
      if (index === 0) return 'SRC';
      if (index === 1) return 'DEST';
      if (index === 2) return 'AUX';
    }
    // Standard
    if (index === 0) return 'SRC';
    if (index === 1) return 'AUX';
    if (index === 2) return 'DEST';
    return '';
  };

  return (
    <div className="flex justify-center items-end gap-4 md:gap-12 h-64 md:h-96 w-full max-w-4xl mx-auto p-4 select-none">
      {pegs.map((peg, pegIndex) => (
        <div 
          key={pegIndex}
          onClick={() => handlePegClick(pegIndex)}
          className={`
            relative flex flex-col items-center justify-end w-1/3 h-full cursor-pointer transition-all duration-200 rounded-lg border-b-4
            ${selectedPeg === pegIndex ? 'bg-white/10 border-cyan-400' : 'hover:bg-white/5 border-slate-700'}
          `}
        >
          {/* The Pole */}
          <div className="absolute bottom-0 w-2 md:w-4 h-full bg-slate-600 rounded-t-full -z-10 opacity-50"></div>
          
          {/* Label */}
          <div className="absolute -bottom-8 text-xs md:text-sm font-display text-slate-400">
            {getTargetLabel(pegIndex)}
          </div>

          {/* Rings */}
          <div className="flex flex-col-reverse items-center w-full mb-1 space-y-reverse space-y-1">
            {peg.map((ringSize, ringIndex) => {
              const isTop = ringIndex === peg.length - 1;
              const isFogged = variation === VariationType.FOG_OF_WAR && !isTop;
              
              // Fog of War: Hidden rings mimic the top ring's size to confuse the player
              const displayedSize = isFogged ? peg[peg.length - 1] : ringSize;

              // Calculate width percentage based on ring size vs total ring count
              // Min width 20%, Max 90%
              const widthPct = 20 + ((displayedSize / ringCount) * 70); 

              return (
                <div
                  key={`${pegIndex}-${ringIndex}`}
                  style={{
                    width: `${widthPct}%`,
                    height: '24px',
                    backgroundColor: isFogged ? '#334155' : COLORS[ringSize - 1] || '#fff',
                    opacity: isFogged ? 0.3 : 1,
                    boxShadow: isFogged ? 'none' : `0 0 10px ${COLORS[ringSize - 1]}80`,
                    transform: (selectedPeg === pegIndex && isTop) ? 'translateY(-10px)' : 'none',
                  }}
                  className={`
                    rounded-md transition-transform duration-200
                    ${isFogged ? 'border border-slate-600' : ''}
                  `}
                />
              );
            })}
          </div>
          
          {/* Hover helper for empty pegs when dragging */}
          {selectedPeg !== null && selectedPeg !== pegIndex && peg.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
               <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 animate-pulse"></div>
             </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TowerGame;