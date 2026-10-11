# Entropy: balance curve, modifiers, routes and liquidation

## Goal

Late rounds are currently too easy. From round ~26 the tower stops growing, perfect play always fits the energy budget, and combo and Bits run away. The goal is tension that scales with skill:

- A player making ~1% random mistakes per move should still reach the mid-20s.
- A player making ~3% mistakes should fail around round 12.
- A perfect player is never punished unfairly. Each round's requirement stays exact.

Add four modifiers and a new branching-route decision so every round is a choice.

## Non-goals

- No new game modes, no new screens beyond the shop changes below.
- No change to the profile/Archive schema. Only run state changes, so saved progress stays valid.
- No multiplayer or server state.

## 1. Balance curve

### Ring count

`ringCount(round) = min(3 + floor((round-1)/5), 9)`. Bosses add +1, capped at 9.

Four-peg towers (Wormhole) are only allowed when `ringCount <= 7`. Above that the solver state space is too large for a per-round solve, so Wormhole is excluded and another anomaly is drawn.

### Mercy (spare energy per refill)

Each refill is `floor((required + mercy + minMoveBonus + flat) * (1 + percent))`, and the existing start-of-run buffer is unchanged. Here:

`mercyRate(round) = max(0, 0.35 - 0.015 * (round - 2))`, and `mercy = floor(required * mercyRate)`.

Mercy is 35% of the requirement at round 2 and reaches zero from round 26. Late rounds need precision, and upgrades matter more.

### Anomaly count

- Round 1: Standard only.
- Rounds 2–7: one anomaly.
- Rounds 8–17: one anomaly, plus a second with 30% chance.
- Rounds 18–27: second anomaly with 60% chance.
- Round 28+: third anomaly with 40% chance.
- Each boss cycle beyond the first (`MK2+`) adds one extra anomaly.

### Combo

A perfect round adds `gain / (1 + 0.1 * (combo - 1))`, where `gain` is 0.1 (0.2 with Catalyst). Combo is capped at `5.0`.

## 2. New modifiers

All four are represented in the solver, so the displayed requirement is exact.

| Anomaly | Rule | Eligibility | Weight |
|---|---|---|---|
| Rails | Rings move only between adjacent pegs. | `ringCount <= 5`, no Wormhole | 1 |
| Quarantine | The spare peg holds at most `ceil(ringCount / 2)` rings. | always | 1 |
| Tidal Surge | Every 5th move costs 0 (boon). | always | 0.8 |
| Toll Road | Landing on the spare peg costs +2 energy. | always | 1 |

The spare peg is the first peg that is neither the start nor the goal. Rules that conflict with an existing anomaly are removed by the existing `ANOMALY_CONFLICTS` list (Target Swap and Mirror).

**Solvability check:** after the solver runs, if it returns no solution, the newest modifier is dropped and the roll is repeated with the same seed salt. A modifier is never shown if it makes the round unsolvable.

**Move cost order** (per move, `moveNumber` is 1-based within the round):
1. Tidal Surge: if enabled and `moveNumber % 5 === 0`, cost is 0.
2. Otherwise base cost: 3 for the largest ring under Dense Core, else 1.
3. Heavy Rings: +1 when `moveNumber % 3 === 0` (unless Heat Sink).
4. Toll Road: +2 when the destination is the spare peg.

## 3. Solver generalization

`services/solver.ts` changes:
- `CostRules` gains `tidal: boolean` and `toll: number | null` (the toll peg index).
- `SolveConfig` gains `rails: boolean` and `cap: { peg: number; max: number } | null`.
- `moveCost(rules, ring, moveNumber, dest)` takes the destination peg.
- The phase period is `(heavy ? 3 : 1) * (tidal ? 5 : 1)`, so states are `(positions, moves mod period)`.
- Transitions skip non-adjacent moves under rails and moves onto a full capped peg. Capacity is computed from the peg digits per state.

Measured state counts: 3 pegs at 9 rings with period 15 is about 295k states. Four pegs at 7 rings with period 15 is about 245k states. Both must solve in well under 500 ms; this is checked in tests.

## 4. Routes (the new spin)

After each non-boss round, the shop shows two routes for the next round:

- **Safe (route 0):** the standard roll for that round.
- **Gamble (route 1):** the same tower and mode, plus one extra anomaly drawn from the eligible pool (not conflicting). Round Bits and the directive bonus are multiplied by `1.5`.

If no extra anomaly is eligible, Gamble still pays 1.5× and is identical to Safe. Boss rounds have no route choice and always pay 1×.

Both routes are deterministic from `(mode, seed, round, relics, hasPowers, route)`. `generateSetup` is memoized, so the forecast and the round start reuse the same result.

The chosen route is stored in `RunState.route`. The shop shows both previews. Route selection is required before "Initiate Round" and defaults to Safe.

## 5. Liquidation

In the shop, the player can sell energy above the chosen route's `required` at **4 Bits per energy**. The button shows the amount available. Sold energy is removed from the carry, and Bits are added immediately. Selling is only available in the shop phase.

## Data changes

- `RoundSetup`: gains `reward: number` (1 or 1.5), `extraAnomaly: boolean`, `capPeg: number | null`, `capMax: number`, `tollPeg: number | null`, `tidal`, `rails`.
- `RunState`: gains `route: 0 | 1`.
- `constants.ts`: adds `RAILS`, `QUARANTINE`, `TIDAL_SURGE`, `TOLL_ROAD` to `VariationType`, with `ANOMALY_INFO` entries (name, glyph, colour, description, weight). Adds `MAX_RINGS_CAP = 9`, `COMBO_CAP = 5`, `MERCY_START = 0.35`, `MERCY_STEP = 0.015`, `SELL_RATE = 4`, `GAMBLE_REWARD = 1.5`.

## UI

- **Shop:** a two-card route picker (Safe / Gamble) showing anomalies, directive and requirement for each, and a "Sell surplus energy" button with the amount and Bits gained.
- **Tower (`TowerGame.tsx`):** draws rails (thin lines between adjacent pegs) under the pegs; labels the spare peg with `cap N` (Quarantine) or `+2` (Toll Road).
- **HUD:** new anomaly chips come from `ANOMALY_INFO`, so no HUD code change is needed.
- **How to play:** add a Routes paragraph and a Liquidation paragraph.
- **Codex:** lists anomalies from `ANOMALY_ORDER`, so no change beyond the new entries.

## Testing

**Engine unit tests** (run with esbuild and node, as before):
- Hand-checked solver values for each rule: Rails 3 pegs n=3 → 26, Quarantine solvable for 3–5 rings, Tidal 3 rings with and without the 5th-move free rule, Toll Road with a known total.
- Route determinism: same inputs give identical setups; route 1 has one extra anomaly or is identical with reward 1.5.
- Mercy values: `mercyRate(2) = 0.35`, `mercyRate(26) = 0`.
- Combo: diminishing gain and the 5.0 cap.
- Liquidation: sells only energy above requirement; cannot go below requirement; rejects outside shop.
- Solver timing: the worst-case 9-ring and 7-ring-with-Wormhole setups finish under 500 ms.

**Balance simulator** (`tools/balance-sim.ts`):
- A player with error rate `p` plays the optimal path but, with probability `p` per move, makes a random legal move, then re-solves from that position.
- Runs 200 games per setting, always picking Safe, and reports the median and 10th/90th percentile death round.
- **Acceptance:** `p = 0.01` median death round in 22–28; `p = 0.03` median in 10–14; `p = 0` never dies.
- Mercy and combo constants are tuned with the simulator until these hold.

**Browser:** a Playwright run through a route choice and a liquidation, and screenshots of the shop and a Quarantine round.

## Risks and open items

- Quarantine's capacity formula is a starting point. If it makes some rolls unsolvable too often, the fallback will drop it and the simulator will show the effect. The formula may need changing.
- The 1.5× Gamble multiplier and the 4-Bit liquidation rate are guesses. The simulator measures survival, not economy, so economy may need a second tuning pass after playtesting.
- Route choice is a new decision with no existing UI pattern. It is kept deliberately simple: two cards and one button.
