---
layout: default
title: Dynamic Strategy v2
nav_order: 5.5
---

# Dynamic Strategy v2

> **Lab feature** — This is an experimental strategy upgrade.
> Behavior may change between releases. Feedback is welcome.

Think of v2 as a solid interim upgrade: it solves real problems with the current approach, while a more advanced algorithm is still being developed.

`02 strategy-dynamic-2.json` is a slightly redesigned version of the Dynamic strategy that evaluates **every price interval individually** instead of working with fixed "cheapest N hours" and "expensive M hours" blocks. This gives the algorithm more flexibility to react to multiple peaks and throughs during a day.

For getting the dynamic strategy up and running (data source, Cheapest Energy Hours setup, dashboard connection), see the [Dynamic Strategy Setup](05-setup-dynamic) page. This page only covers what is different and new in v2.

---

## Why v2?

The original dynamic strategy uses fixed blocks:

- *"Find the cheapest 3 consecutive hours and charge there"*
- *"Find the most expensive 5 consecutive hours and discharge there"*

This works well on days with a clear, predictable price curve. On days where prices are flat, or where there are multiple distinct peaks and troughs, the v1 approach can miss opportunities or activate unnecessarily.

**v2 replaces the block concept** with a per-interval marking approach. Every hour (or 15-minute slot) in the dataset is independently evaluated and receives one of three marks:

| Mark | Meaning |
|---|---|
| `low` | Cheap interval — economically attractive to charge |
| `high` | Expensive interval — economically attractive to discharge |
| `null` (neutral) | Not marked — neither cheap nor expensive enough relative to the other |

No fixed hour count is needed. The number of marked intervals varies daily based on the actual price spread.

---

## How the algorithm works

The algorithm is called **Extreme-Pair Matching** and runs once per calendar day on the available price data.

**Step-by-step:**

1. Take all intervals for the day and sort them by price.
2. Point to the cheapest interval (low pointer) and the most expensive interval (high pointer).
3. Calculate the spread: `price_high − price_low`.
4. If the spread is **≥ the configured minimum price delta**:
   - Mark the cheap interval as `low`.
   - Mark the expensive interval as `high`.
   - Move both pointers one step inward (next cheapest and next most expensive).
   - Repeat from step 3.
5. If the spread falls **below the minimum delta**: stop. No further intervals are marked for this day.

The result is a set of paired `low` / `high` intervals where each pair has a guaranteed minimum spread. All remaining intervals stay neutral.

### Example: two-peak day

A realistic day often has **two separate price peaks** — one in the morning (commute demand) and one in the evening (cooking, heating, EV charging) — with cheap solar-driven prices in between. This is exactly where v2 outshines the fixed-block approach.

| Hour | Price | Mark |
|---|---|---|
| 00:00–06:00 | 18–24¢ | neutral |
| **07:00** | **30¢** | **`high`** |
| **08:00** | **33¢** | **`high`** |
| **09:00** | **28¢** | **`high`** |
| **10:00** | **17¢** | **`low`** |
| **11:00** | **12¢** | **`low`** |
| **12:00** | **11¢** | **`low`** |
| **13:00** | **13¢** | **`low`** |
| **14:00** | **15¢** | **`low`** |
| 15:00–17:00 | 21–25¢ | neutral |
| **18:00** | **29¢** | **`high`** |
| **19:00** | **32¢** | **`high`** |
| **20:00** | **31¢** | **`high`** |
| 21:00–23:00 | 22–27¢ | neutral |

With a minimum delta of 12¢, the algorithm pairs extremes inward: 33¢↔11¢ (spread 22¢ ✓), 32¢↔12¢ (20¢ ✓), 31¢↔13¢ (18¢ ✓), 30¢↔15¢ (15¢ ✓), 29¢↔17¢ (12¢ ✓) — then stops because the next pair would fall below 12¢.

**This is the key difference from v1.** The fixed-block approach ("find the most expensive 5 consecutive hours") can only pick *one* block — it would choose either the morning peak or the evening peak, whichever happens to score higher as a consecutive range. v2 identifies both peaks independently, because it works on individual intervals without requiring them to be adjacent.

On a flat-price day where no pair meets the threshold, nothing is marked at all — and that is correct behavior.

---

## Strategy configuration

Once intervals are marked, the strategy selects one of three configurable actions:

| Period | Triggered when | Configurable strategies |
|---|---|---|
| **Low (cheap)** | Current interval is marked `low` | `Charge`, `Charge PV`, `Self-consumption`, `Full stop` |
| **Neutral (regular)** | Current interval is not marked | `Charge PV`, `Self-consumption`, `Full stop` |
| **High (expensive)** | Current interval is marked `high` | `Self-consumption`, `Sell`, `Charge PV`, `Full stop` |

The default configuration out of the box is:
- Low → `Charge`
- Neutral → `Charge PV`
- High → `Self-consumption`

---

## Dashboard

The v2 controls are located in the **Lab features** tab of the Home Battery Control dashboard. The controls available there are:

| Control | Description |
|---|---|
| **Energy supplier / Data source** | Same data source selector as the standard Dynamic strategy |
| **Minimum price difference** | The `min_delta` threshold in cents/kWh — below this spread, no intervals are marked |
| **Low period strategy** | What to do during `low`-marked intervals |
| **Regular period strategy** | What to do during neutral (unmarked) intervals |
| **High period strategy** | What to do during `high`-marked intervals |

The price data table (today and tomorrow's prices, with markings) is also visible in the Lab features tab when debug/insights mode is enabled.

---

## Use-case configurations

### 1. Self-Consumption Maximizer

**Goal:** Reduce grid imports for household loads; protect against price peaks; minimal grid interaction.

| Mark | Action |
|---|---|
| `low` | Charge from grid |
| `neutral` | Charge PV only |
| `high` | Self-consumption (discharge to home loads, no export) |

**Caveats:**
- On sunny summer days, the battery may already be full from PV before a `low` interval begins. The grid-charge slot is then wasted. A SoC pre-check before acting on `low` would improve this.
- `high` only saves the retail price you would have paid for grid import. If PV is already covering loads during a `high` hour, discharging stored energy on top of that provides no additional benefit.
- If a long stretch of `high` intervals occurs (cold evening, no sun), the battery can deplete before prices drop. Consider setting a minimum SoC reserve.
- The minimum delta only needs to cover round-trip losses (~15 %) since both legs of the cycle are valued at the retail tariff.

---

### 2. Arbitrage Trader

**Goal:** Buy cheap, sell expensive, profit on the spread. Treat the battery as a wholesale-market participant.

| Mark | Action |
|---|---|
| `low` | Charge from grid (full charge if possible) |
| `neutral` | Idle / minimal PV top-up |
| `high` | Discharge to grid (active export) |

**Caveats:**
- Requires a dynamic **feed-in contract** that pays close to the dynamic import rate. Without one, the spread shown by the algorithm does not reflect real revenue and the cycle will lose money.
- In the Netherlands, the *salderingsregeling* phase-out (from 2027) progressively reduces the feed-in value; this configuration has a limited shelf life under current law.
- Daily cycle count increases — battery degradation accelerates. The minimum delta must cover round-trip losses **and** prorated cell-wear cost; otherwise you are cycling for a net loss in lifetime terms.
- Grid-export caps and dynamic transport tariffs can claw back profit; the algorithm does not see them.
- House loads during `high` hours are drawn from the grid at peak prices while the battery exports — this can feel counter-intuitive even when the overall math is positive.

---

### 3. PV-First Hybrid

**Goal:** Run on own solar as much as possible; only use the grid when the spread genuinely beats PV self-consumption.

| Mark | Action |
|---|---|
| `low` | Charge from grid **only if** SoC is below threshold AND PV forecast is poor; otherwise PV-only |
| `neutral` | Charge PV |
| `high` | Self-consumption (no export) |

**Caveats:**
- This configuration requires PV forecast data and SoC awareness inside the `low`-handler. The current flow does not yet provide these automatically — integration is a manual task in the Execution area.
- The SoC and forecast thresholds are empirical and seasonal. A value tuned for January will under-utilize the battery in June, and vice versa.
- On sunny days, a `low` interval may pass unused (PV is free, grid is not). This is technically correct but can feel suboptimal.
- This is the most conservative on battery wear of the three configurations — fewest grid-charge cycles — at the cost of missing some spread opportunities.

---

## Current limitations

The algorithm identifies *economically valid candidates*; it does not enforce physical feasibility. Three things it cannot see:

- **Time direction** — a `high` interval at 02:00 cannot be served by charging at a `low` interval at 11:00 of the same day; the battery would have needed to be charged the previous evening.
- **Battery capacity** — if 8 intervals are marked `low` and 8 `high` but the battery only holds enough for 3 charge/discharge cycles, 5 of those marks are aspirational.
- **PV contribution** — extra charge from solar during neutral intervals can make a planned `low` grid-charge unnecessary.

These constraints are handled by the Execution area (the sub-strategies themselves, SoC guards, and manual configuration). Keeping them out of the marking algorithm makes it simpler and easier to reason about.


---

## Getting started

To use this strategy, first follow the [Dynamic Strategy Setup](05-setup-dynamic) guide to connect your data source and deploy the required flows. Then import `02 strategy-dynamic-2.json` into Node-RED, deploy, and switch to the **Lab features** tab in your dashboard to configure the v2 controls.
