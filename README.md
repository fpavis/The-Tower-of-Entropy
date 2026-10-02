<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# The Tower of Entropy

A roguelite Tower of Hanoi. **Moves are your life**: every move costs energy, each round refills you with exactly what a perfect solution needs, and the universe is trying to run you dry.

This contains everything you need to run the game locally.

View your app in AI Studio: https://ai.studio/apps/drive/1wyJMlcNmUW2dBz-ANrjHGI_JRqGRIlTT

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Game flow

```
Menu ─ pick a mode ─▶ Round (puzzle) ─▶ Shop ─▶ next Round …
                          │                │
                          │                └─ every 5th round is a BOSS ─▶ Relic Draft ─▶ Archive ─▶ Shop
                          └─ run out of energy ─▶ System Failure ─▶ Shards payout ─▶ Menu / Archive
```

### Modes
| Mode | Twist |
| --- | --- |
| **Ascent** | The classic endless climb. |
| **Entropy** | Every tower starts *scrambled*; the optimal path is different every round. |
| **Blitz** | Each round has a par time. Overtime bleeds 1 energy every 4 seconds. |
| **Daily Collapse** | One shared seed per calendar day (some rounds scrambled). Your best daily score is tracked. |

### Rounds
* **Energy** – the bar shows *required* (the optimal solution) and *buffer*. Wasted moves eat the buffer; running dry ends the run.
* **Combo & Bits** – perfect rounds raise your combo. Bits (score *and* shop currency) scale with round and combo.
* **Directives** – every round has an optional goal for bonus Bits: *Flawless*, *Thrifty*, *Race* or *Pure Mind* (no powers).
* **Anomalies** – from round 2 the rules twist: *Target Swap*, *Fog of War*, *Heavy Rings*, *Wormhole* (a 4th peg), *Dense Core*, *Mirror*. Required energy is computed with an exact solver, so it is always correct for the active anomalies.
* **Bosses** – every 5th round stacks anomalies on a bigger tower. Beating one lets you draft a **relic** and earns a permanent **Shard**.
* **Zones** – each 5-round era (Cold Start → Thermal Drift → Static Field → Event Horizon → Dark Era → Heat Death) re-tints the world.

### Upgrades
* **Shop (Bits, per run)** – random stock of relics, powers and stackable upgrades, plus reroll, Emergency Defrag and a **forecast** of the next round's anomaly.
* **Powers** – ↺ Rewind `Z`, ◎ Oracle Lens `H` (shows the optimal next move), ✧ Paradox `P` (break the size rule once), ⧖ Chrono `C` (Blitz).
* **Relics** – 11 passive relics (Heat Sink, Clear Lens, Salvager, Bit Vault, Quantum Dice, Chrono Coil, Maxwell's Demon, Catalyst, Echo Chamber, Overclocker, Reboot Core).
* **Archive (Shards, permanent)** – start-of-run buffer, combo, interest, starting powers/Bits and extra shop slots.
* **Codex** – 17 achievements (which pay Shards), an anomaly / relic reference and your records.

Progress (Shards, Archive levels, achievements, records, daily history, sound setting) is saved in `localStorage`.

### Controls
Click a peg to lift its top ring, click another to drop it – or press `1`–`4`. `Esc` drops the ring, `Z`/`H`/`P`/`C` use powers.

## Code map
* `game/engine.ts` – pure game logic (round generation, moves, scoring, shop, draft, powers, timers); no React.
* `services/solver.ts` – optimal-cost solver (Dijkstra over ring positions) used for required energy and the Oracle Lens.
* `services/rng.ts` – seeded RNG so Daily runs and shop/round previews are deterministic.
* `constants.ts` – all game data (zones, modes, anomalies, bosses, relics, powers, Archive upgrades).
* `components/` – UI; `services/audio.ts` – synthesized sound effects; `services/storage.ts` – profile persistence.
