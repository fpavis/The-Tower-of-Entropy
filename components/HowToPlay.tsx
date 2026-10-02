import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div className="text-xs uppercase tracking-widest text-cyan-400 mb-1">{title}</div>
    <div className="text-sm text-slate-300 space-y-1">{children}</div>
  </div>
);

const HowToPlay: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
    <div
      className="max-w-2xl w-full max-h-[92vh] overflow-y-auto thin-scroll bg-slate-900 border border-cyan-500/30 rounded-xl p-6 space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-2xl font-display text-cyan-300">How to play</h2>
      <Section title="The puzzle">
        <p>Move the whole tower to the glowing <b>DEST</b> peg. Only the top ring moves, and never onto a smaller ring. Click a peg to pick up its top ring, click another to drop it (or press 1-4).</p>
      </Section>
      <Section title="Energy is life">
        <p>Every move costs energy. Each round refills you with exactly what the perfect solution needs, so wasted moves eat into your buffer. Run dry before finishing and the run ends.</p>
      </Section>
      <Section title="Combo, Bits & Directives">
        <p>Perfect rounds grow your <b>combo</b>. Bits (score and shop currency) scale with round and combo. Each round carries an optional <b>directive</b> — Flawless, Thrifty, Race or Pure Mind — for bonus Bits.</p>
      </Section>
      <Section title="Anomalies & bosses">
        <p>From round 2, rounds twist the rules: fog, heavy rings, a wormhole 4th peg, mirrored towers… Every 5th round is a <b>boss</b> with stacked anomalies. Beat it to draft a relic and earn permanent <b>Shards</b>.</p>
      </Section>
      <Section title="Between rounds">
        <p>Spend Bits on relics, powers and upgrades. Check the <b>forecast</b> to see the next anomaly before you buy. Spend Shards in the <b>Archive</b> for permanent upgrades.</p>
      </Section>
      <Section title="Powers & hotkeys">
        <p><b>↺ Rewind</b> [Z] undo a move · <b>◎ Oracle Lens</b> [H] reveal the best move · <b>✧ Paradox</b> [P] break the size rule once · <b>⧖ Chrono</b> [C] +20s (Blitz). <b>Esc</b> drops your ring.</p>
      </Section>
      <Section title="Modes">
        <p><b>Ascent</b> classic · <b>Entropy</b> scrambled towers · <b>Blitz</b> overtime bleeds energy · <b>Daily Collapse</b> one shared seed per day.</p>
      </Section>
      <div className="flex justify-end">
        <button onClick={onClose} className="px-6 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
          Got it
        </button>
      </div>
    </div>
  </div>
);

export default HowToPlay;
