---
layout: default
title: Dynamic Strategy v2
nav_order: 5.5
---

# Dynamic Strategy v2

> **Lab feature** — experimental strategy upgrade. Behavior may change between releases.
> Feedback welcome at [GitHub Issues](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues).

`02 strategy-dynamic-2.json` is a redesigned Dynamic strategy that evaluates **every price interval individually** instead of working with fixed "cheapest N hours" and "expensive M hours" blocks. This gives the algorithm more flexibility to react to multiple peaks and troughs during a day.

- Guarantees a minimum spread per cycle, so each marked cycle stays profitable.
- Think of v2 as an interim upgrade — better than v1, while a more advanced algorithm is still in development.

---

## Quick start

1. First-time setup (data source, Cheapest Energy Hours, dashboard wiring): follow the [Dynamic Strategy Setup](/05-setup-dynamic) guide.
2. Import `02 strategy-dynamic-2.json` into Node-RED and **deploy**.
3. In your Home Battery Control dashboard, switch to the **Lab features** tab.
4. Pick a [use-case configuration](#use-case-configurations) and set the controls accordingly.

Defaults that work out of the box:

| Period | Default action |
|---|---|
| **Low** (cheap intervals) | `Charge` |
| **Neutral** (unmarked) | `Charge PV` |
| **High** (expensive intervals) | `Self-consumption` |

> **Sensible starting values** 
> - `min_delta = 6¢/kWh`
> - `cheapest_hrs = 0` (no cap), `expensive_hrs = 0` (no cap). 
>
> See [Dashboard controls](#dashboard-controls) for what each does.

---

## Dashboard controls

The v2 controls live in the **Lab features** tab of the Home Battery Control dashboard.

| Control | Description |
|---|---|
| **Energy supplier / Data source** | Same data-source selector as the standard Dynamic strategy. |
| **Minimum price difference** (`min_delta`) | Spread threshold in cents/kWh — pairs with a spread below this are not marked. Default `6¢/kWh` (covers round-trip losses for a ~€1250 battery at 6000 cycles, 80% RTE; full derivation in the [setup guide](/05-setup-dynamic)). Lower towards `0` if you mostly charge from solar. |
| **Max cheap hours / day** (`cheapest_hrs`) | Cap on `low` marks per day, in hours. `0` = no limit (mark every viable pair). Useful when your battery can only absorb so much per day. |
| **Max expensive hours / day** (`expensive_hrs`) | Cap on `high` marks per day, in hours. `0` = no limit. |
| **Low period strategy** | Action during `low`-marked intervals. Choices: `Charge`, `Charge PV`, `Self-consumption`, `Full stop`. |
| **Regular period strategy** | Action during neutral (unmarked) intervals. Choices: `Charge PV`, `Self-consumption`, `Full stop`. |
| **High period strategy** | Action during `high`-marked intervals. Choices: `Self-consumption`, `Sell`, `Charge PV`, `Full stop`. |

> **Tip:** the underlying `Charge` / `Sell` strategies can be configured with solar forecast, peak-shaving reserves, etc. Dynamic v2 respects those settings.

The price-data table (today and tomorrow with marks) is visible in the same tab when debug/insights mode is enabled.

> **Tweaker note — how hour caps map to intervals.** With 15-min price data, 1 hour = 4 intervals; the cap is rounded to whole intervals. Asymmetric caps (e.g. `cheapest_hrs = 2`, `expensive_hrs = 1`) produce asymmetric marks — a "free sell" without a paired buy is allowed when the cap suppresses one side. Net spread only deducts round-trip loss for complete pairs.

---

## Use-case configurations

What the marks mean across all three configurations:

| Mark | Meaning |
|---|---|
| `low` | Cheap interval — economically attractive to charge |
| `high` | Expensive interval — economically attractive to discharge |
| `null` (neutral) | Not marked — neither cheap nor expensive enough relative to the other |

### 1. Self-Consumption Maximizer

**Goal:** Reduce grid imports for household loads; protect against price peaks; minimal grid interaction.

| Mark | Action |
|---|---|
| `low` | Charge from grid |
| `neutral` | Charge PV only |
| `high` | Self-consumption (discharge to home loads, no export) |

##### **Suggested starting values:** 

`min_delta ≈ 5-6¢/kWh`, `cheapest_hrs ≈ 2–4`, `expensive_hrs ≈ 4–6` — tune to your battery's daily cycle budget.

**Caveats:**
- On sunny summer days, the battery may already be full from PV before a `low` interval begins. The grid-charge slot is then wasted.
- `high` only saves the retail price you would have paid for grid import. 
  - If PV is already covering loads during a `high` hour, discharging stored energy on top of that provides no additional benefit.
- If a long stretch of `high` intervals occurs (cold evening, no sun), the battery can deplete before prices drop.

---

### 2. Arbitrage Trader

**Goal:** Buy cheap, sell expensive, profit on the spread. Treat the battery as a wholesale-market participant.

| Mark | Action |
|---|---|
| `low` | Charge from grid (charge until full) |
| `neutral` | Full stop / minimal Charge PV top-up |
| `high` | Sell (until empty) |

**Suggested starting values:** `min_delta ≈ 8–10¢/kWh` (must cover round-trip losses **plus** some profit margin), `cheapest_hrs` and `expensive_hrs` matched to your battery's daily energy budget so you don't over-cycle.

**Caveats:**
- Requires a dynamic contract
- In the Netherlands, the *salderingsregeling* phase-out (from 2027) progressively reduces the feed-in value; this configuration has a limited shelf life under current law.
- Daily cycle count increases — faster return on investment — battery degradation may also accelerate. 
- Grid-export caps and dynamic transport tariffs can claw back profit; the algorithm does not see them.
- House loads during `high` hours may be drawn from the grid at high prices after the battery is discharged — this can feel counter-intuitive even when the overall math is positive.

---

### 3. PV-First Hybrid

**Goal:** Run on own solar as much as possible; only use the grid when the spread genuinely beats PV self-consumption.

| Mark | Action |
|---|---|
| `low` | Charge from grid (solar forecast; PV on sunny days, grid otherwise) |
| `neutral` | Charge PV |
| `high` | Self-consumption (no import/export) |

**Suggested starting values:** `min_delta ≈ 0–2¢/kWh` (since PV charging is essentially free, almost any spread is profitable), `cheapest_hrs ≈ 1` (avoid charging more than needed when PV is plentiful), `expensive_hrs = 0` (no limit).

**Caveats:**
- Requires solar forecast to be configured. Easy, [see](/04-setup-solar-forecast).
- This is the most conservative on battery wear of the three configurations — fewest grid-charge cycles — at the cost of missing some spread opportunities.

---

## What's different from v1

v1 uses fixed blocks: *"find the cheapest N consecutive hours; find the most expensive M consecutive hours."* This works on a clean daily curve but misses opportunities on flat-price days or days with multiple peaks and troughs.

> **Key difference:** the fixed-block approach can only pick **one** expensive block — morning peak or evening peak, whichever scores higher. v2 identifies both peaks independently because it works on individual intervals without requiring them to be adjacent.

On a flat-price day where no pair meets the threshold, v2 marks nothing — and that's the correct behavior.

---

## How the algorithm works


<strong>Under the hood — algorithm internals (for tweakers)</strong>

The algorithm is called **Extreme-Pair Matching** and runs **per local calendar day** on the available price data. Per-day pairing means today's marks don't shift when tomorrow's prices arrive.

**Step-by-step (per day):**

1. Take all intervals for the day and sort them by price.
2. Point to the cheapest interval (low pointer) and the most expensive interval (high pointer).
3. Calculate the spread: `price_high − price_low`.
4. If the spread is **≥ `min_delta`**:
   - Mark the cheap interval as `low` (unless this day's `cheapest_hrs` cap is already reached).
   - Mark the expensive interval as `high` (unless this day's `expensive_hrs` cap is already reached).
   - Move both pointers one step inward (next cheapest / next most expensive).
   - Repeat from step 3.
5. If the spread falls **below `min_delta`**, or both per-day caps are reached: stop. No further intervals are marked for this day.

The result is a set of `low` / `high` marks where each detected pair has a guaranteed minimum spread. With `cheapest_hrs = 0` and `expensive_hrs = 0`, marks come in matched pairs — every `high` is backed by a `low`. With non-zero caps, one side of a detected pair may be suppressed, so the final mark counts can be asymmetric.

The algorithm pairs by price only; it doesn't check whether the cheap interval comes before the expensive one in time. See [Current limitations](#current-limitations) for what that implies in practice.

**Why this algorithm?** It marks the truly extreme hours (highest peaks as `high`, lowest troughs as `low`) — the intervals a user would intuitively expect. It is `O(n log n)`, straightforward to implement, and easy to explain. It does not attempt a globally optimal pairing (which would require backtracking).

---

## Current limitations

The algorithm identifies *economically valid candidates*; it does not enforce physical feasibility. Three things it cannot see:

- **Time direction** — a `high` interval at 02:00 cannot be served by charging at a `low` interval at 11:00 of the same day; the battery would have needed to be charged the previous evening.
  *Mitigation:* use Solar Forecast charge or a Timed strategy to pre-charge for early-morning `high` intervals.
- **Battery capacity** — if 8 intervals are marked `low` and 8 `high` but the battery only holds enough for 3 charge/discharge cycles, 5 of those marks are aspirational.
  *Mitigation:* the `cheapest_hrs` / `expensive_hrs` caps directly address this — set them to your battery's daily cycle budget.
- **PV contribution** — extra charge from solar during neutral intervals can make a planned `low` grid-charge unnecessary.
  *Mitigation:* set Low strategy to `Charge PV` instead of `Charge` on sunny days, or use a forecast-aware automation to switch dynamically.

---

## Feedback

Lab features are experimental — your feedback shapes the next iteration. Report issues, ideas, or unexpected behavior at our [![Discord](https://img.shields.io/badge/Discord-Join%20server-5865F2?logo=discord&logoColor=white)](https://discord.gg/yeAGaE4kgy) or the [project's GitHub Issues](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues).
