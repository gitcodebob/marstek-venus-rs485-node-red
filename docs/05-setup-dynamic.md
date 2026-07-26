---
layout: default
title: Dynamic Strategy Setup
nav_order: 5
---

# Dynamic Strategy Setup

The `dynamic` strategy automates charging/discharging based on changing hourly tariffs. It is only relevant if you have a dynamic/hourly contract.

It evaluates **every price interval individually** — marking the cheapest intervals to charge and the most expensive to discharge — and guarantees a minimum spread per cycle, so each marked cycle stays profitable. Because it works per interval instead of on a single fixed block, it captures **both** a morning and an evening price peak in the same day.

> The per-interval algorithm replaced the older fixed "cheapest N hours / expensive M hours" block approach. The deprecated block flow (`02 strategy-dynamic.json`) is kept in `node-red/deprecated/` for reference only.

---

## How it works

The strategy periodically checks for new tariff data from your supplier, marks each interval, and applies a sub-strategy per mark:

| Period | Meaning | Default action | Configurable options |
|---|---|---|---|
| **Low** (cheap intervals) | Economically attractive to charge | `Charge` *(from grid)* | `Charge`, `Charge PV`, `Self-consumption`, `Full stop` |
| **Neutral** (unmarked) | Neither cheap nor expensive enough | `Charge PV` | `Charge PV`, `Self-consumption`, `Full stop` |
| **High** (expensive intervals) | Economically attractive to discharge | `Self-consumption` | `Self-consumption`, `Sell`, `Charge PV`, `Full stop` |

Smart thresholds ensure intervals are only marked when economically beneficial: a pair of intervals is only marked when its price spread exceeds the minimum delta.

**Note:** the dynamic and timed strategy share settings for `Charge` / `Charge PV` / `Self-consumption`.

View the explanation videos of the general idea behind this strategy:
* How to SETUP dynamic: _English text and subtitles, NL spoken: [https://youtu.be/AdnXlbPMrTA](https://youtu.be/AdnXlbPMrTA)_
* How to USE dynamic: _English text and subtitles, NL spoken: [https://youtu.be/PR1XA5GUlAE](https://youtu.be/PR1XA5GUlAE)_

### Solar prediction
Tuning of charging levels (SoC) based on PV Forecast can be created by you as a user — via handmade automations or flows setting the now-available SoC and threshold fields. The project will move towards built-in integration in the future.

---

## Setup — getting dynamic up and running
[![How to setup Dynamic](https://img.youtube.com/vi/AdnXlbPMrTA/hqdefault.jpg)](https://youtu.be/AdnXlbPMrTA)

1. Install [Cheapest Energy Hours](https://github.com/TheFes/cheapest-energy-hours?tab=readme-ov-file#how-to-install) if you have not done so already.
1. Provide data from your energy supplier to Home Assistant. [See this easy list](https://github.com/TheFes/cheapest-energy-hours/blob/main/documentation/1-source_data.md#data-provider-settings) with addons from TheFes.
   - Follow any instructions provided by the Data Provider addon.
   - Tip: is your energy supplier not supported? Use [ENTSO-e](https://my.home-assistant.io/redirect/hacs_repository/?owner=JaccoR&repository=hass-entso-e&category=integration).
1. Import the `02 strategy-dynamic-2.json` flow into Node-RED and *deploy*.
1. Go to your Home Battery Control dashboard in HA.
   - Select `Full control` and `Dynamic` to activate the strategy.
1. Go to the `Timed/Dynamic` tab, this shows the `timed` and `dynamic` planning.
   - Select your energy supplier from the dropdown.
   - The dashboard should (with a small delay) display when it will be charging/idle/discharging in the next 24 hrs.
1. Minimum price difference (`min_delta`)
   - Leave the price delta at €0,06/kWh or set it to your desired value.
   - For a Marstek bought at ~ €1250, 6000 cycles at 88% DoD and an 80% RTE = delta at €0,06/kWh.
   - If you charge largely using solar power, you can lower the price delta down to €0,00/kWh.

Done.

Need an example of a Data Provider utilizing a blueprint and template sensor? See the [Nordpool (core)](#nordpool-core) example below.

---

## Dashboard controls

The Dynamic controls live in the `Timed/Dynamic` tab of the Home Battery Control dashboard.

| Control | Description |
|---|---|
| **Energy supplier / Data source** | Selects the price data source used to determine when to charge and discharge. |
| **Minimum price difference** (`min_delta`) | Spread threshold in cents/kWh — pairs with a spread below this are not marked. Default `6¢/kWh` (covers round-trip losses for a ~€1250 battery at 6000 cycles, 80% RTE; see the derivation in [Setup](#setup--getting-dynamic-up-and-running)). Lower towards `0` if you mostly charge from solar. |
| **Max cheap hours / day** (`cheapest_hrs`) | Cap on `low` marks per day, in hours. `0` = no limit (mark every viable pair). Useful when your battery can only absorb so much per day. |
| **Max expensive hours / day** (`expensive_hrs`) | Cap on `high` marks per day, in hours. `0` = no limit. |
| **Low period strategy** | Action during `low`-marked intervals. Choices: `Charge`, `Charge PV`, `Self-consumption`, `Full stop`. |
| **Regular period strategy** | Action during neutral (unmarked) intervals. Choices: `Charge PV`, `Self-consumption`, `Full stop`. |
| **High period strategy** | Action during `high`-marked intervals. Choices: `Self-consumption`, `Sell`, `Charge PV`, `Full stop`. |

> **Tip:** the underlying `Charge` / `Sell` strategies can be configured with solar forecast, peak-shaving reserves, etc. Dynamic respects those settings.

The price-data table (today and tomorrow with marks) and an ApexChart for review are visible in the same tab when debug/insights mode is enabled.

> **Sensible starting values**
> - `min_delta = 6¢/kWh`
> - `cheapest_hrs = 0` (no cap), `expensive_hrs = 0` (no cap).

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
- Requires a dynamic contract.
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

## How the algorithm works

<details>
<summary><strong>Under the hood — algorithm internals (for tweakers)</strong></summary>

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

On a flat-price day where no pair meets the threshold, the strategy marks nothing — and that's the correct behavior.

**Why this algorithm?** It marks the truly extreme hours (highest peaks as `high`, lowest troughs as `low`) — the intervals a user would intuitively expect. It is `O(n log n)`, straightforward to implement, and easy to explain. It does not attempt a globally optimal pairing (which would require backtracking).

</details>

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

## Examples

### Nordpool (core)
1. Install Nordpool Core integration [(link)](https://www.home-assistant.io/integrations/nordpool/)
2. Install Cheapest Energy Hours integration through HACS [(link)](https://github.com/TheFes/cheapest-energy-hours)
3. Install blueprint from Cheapest Energy Hours [(link)](https://github.com/TheFes/cheapest-energy-hours/blob/main/documentation/blueprints/energy_price_sensor.md)
4. Put the following code into your template.yaml file, make sure that file is linked from your configuration.yaml file:

```
- use_blueprint:
    path: TheFes/energy_price_sensor.yaml
    input:
      entity_id: sensor.nordpool_ceh_prices
      source: nordpool
      resolution: 15
      name: Nordpool Cheapest Energy Hours
  unique_id: 881b6558-26c6-44bb-81c5-d86c05451bd4
```

5. Now you have a sensor called `sensor.nordpool_ceh_prices`.
6. Replace this sensor name in the Node-RED flow for the Dynamic strategy: go to Node-RED, select the `Strategy Dynamic` tab, double-click `Data Source Settings`.
7. Probably you have to wait some time until data is loaded.

---

## Feedback

Report issues, ideas, or unexpected behavior on our [![Discord](https://img.shields.io/badge/Discord-Join%20server-5865F2?logo=discord&logoColor=white)](https://discord.gg/yeAGaE4kgy) or the [project's GitHub Issues](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues).
