---
layout: default
title: Control Strategies
nav_order: 3
---

# Battery Control Strategies

Pick the strategy that matches what you want the battery to do today — switch any time from the Home Assistant dashboard.

## Pick by goal

| I want to… | Use | Setup |
|---|---|---|
| Use my own energy, keep grid meter at 0 Watt | [**Self-consumption**](#self-consumption) | [Setup](/04-setup-self-consumption) |
| Save money on a dynamic / hourly tariff | [**Dynamic**](#dynamic) (or [**Dynamic v2**](#dynamic-v2) lab) | [Setup](/05-setup-dynamic) |
| Charge/discharge on a fixed clock | [**Timed**](#timed) | – |
| Fill the battery now (outage, cheap window) | [**Charge**](#charge) | [Setup](/04-setup-solar-forecast) |
| Sell stored energy at a price peak | [**Sell**](#sell) | – |
| Soak up solar surplus only | [**Charge PV**](#charge-pv) | – |
| Never import from the grid | [**Zero import**](#zero-import) | – |
| Stay idle, only act on grid peaks (capacity tariff) | [**Standby / peak shave**](#standby-peak-shave) | [Setup](/06-advanced-features#grid-power-limits) |
| Halt all battery activity | [**Full stop**](#full-stop) | – |

## At a glance — capabilities

| Strategy | Grid→Bat | PV→Bat | Bat→Home | Bat→Grid | Needs PV | Needs price feed |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Self-consumption | – | ✅ | ✅ | – | recommended | – |
| Dynamic | ⚙️ | ⚙️ | ⚙️ | ⚙️ | – | ✅ |
| Timed | ✅ | ✅ | ✅ | ✅ | – | – |
| Charge | ✅ | ✅ | – | – | – | – |
| Sell | – | – | – | ✅ | – | recommended |
| Charge PV | – | ✅ | – | – | ✅ | – |
| Zero import | – | – | ✅ | – | – | – |
| Standby / peak shave | only on peak | only on peak | only on peak | only on peak | – | – |
| Full stop | – | – | – | – | – | – |

*⚙️ = depends on the sub-strategy selected for that period.*

*PV = photovoltaic aka solar panel energy*

*Peak Shaving = a system-wide feature that piggybacks on most strategies — see [Peak Shaving in Advanced Features](/06-advanced-features#peak-shaving) except the Full stop strategy, which completely passifies the batteries.*

## Switching strategies

All strategies are selectable from the Home Battery Control dashboard. Most settings live in the dashboard's Settings tab; per-strategy details below note when extra setup is required.

---

## 🔋 Core

### 🔋 Self-consumption *(mandatory)* {#self-consumption}
*Maintains ~0 W grid power with a PID controller: battery charges from solar surplus and discharges to cover home loads.*

**Best for:** the baseline "use my own energy" mode — also the engine other strategies build on. \
**Setup:** PID tuning recommended — see [Self-consumption Setup Guide](/04-setup-self-consumption). \
**Flow:** `02 strategy-self-consumption.json`

- Always configure this one — it is used internally by Charge PV, Zero import, Dynamic, and Timed.

---

## 🎯 Goal-driven

### 🎯 Charge *(from grid)* {#charge}
*Forces the battery to charge from the grid until a configurable goal is met, then switches to a follow-up strategy.*

**Best for:** preparing for power outages, pre-charging before expensive hours, or topping up on a cheap night tariff. \
**Setup:** Dashboard. Solar-forecast goal: see [Solar Forecast Setup](/04-setup-solar-forecast). \
**Flow:** `02 strategy-charge.json`

**Charge goals** *(pick one)*
- **Batteries full** — charge to each battery's max SoC (respects cutoff settings).
- **Energy reserve (kWh)** — charge to a fixed target.
- **State of charge (%)** — charge to a fixed SoC.
- **Solar forecast** — auto-calculates how much grid charging is needed given today's forecast.

**After goal reached** — the strategy hands off to whichever follow-up you pick on the dashboard:
- `Charge PV` *(default)* — keep topping up from solar surplus.
- `Self-consumption` — start using the stored energy.
- `Full stop` — hold the charge for a known peak later.
- `Zero import` — discharge only what's needed to avoid grid imports.

**Power mode:** *Maximum* (fastest) or *Grid power limit* (PID-controlled). Configure in the Settings tab — see [Charge / Sell Power Mode](/06-advanced-features#charge--sell-power-mode).

### 🎯 Sell *(to grid)* {#sell}
*Discharges the battery to the grid for profit during high prices, until a configurable floor is reached.*

**Best for:** dynamic-tariff users with a price peak, or anyone compensated for grid export. \
**Setup:** Dashboard. \
**Flow:** `02 strategy-sell.json`

**Stop conditions** *(pick one)*
- **All batteries at minimum SoC** — discharge until every battery hits its floor.
- **Average SoC (%)** — stop at an average across all batteries (per-battery floors are still respected).
- **Energy floor (kWh)** — avoid depleting completely.

**After goal reached** — the strategy hands off to your selected follow-up:
- `Charge PV` *(default)* — refill from solar surplus.
- `Self-consumption` — use remaining capacity for home loads.
- `Full stop` — keep the battery idle until you switch manually.
- `Zero import` — keep covering home loads from what's left, without grid import.

**Power mode:** *Maximum* or *Grid power limit* — see [Charge / Sell Power Mode](/06-advanced-features#charge--sell-power-mode).

---

## 💶 Price-driven

### 💶 Dynamic {#dynamic}
*Picks a sub-strategy per period based on hourly tariffs: a cheapest block, an expensive block, and the regular hours in between.*

**Best for:** dynamic / hourly energy contracts where you want to capture the daily price spread. \
**Setup:** Cheapest Energy Hours integration + a price data source — see [Dynamic Strategy Setup](/05-setup-dynamic). \
**Flow:** `02 strategy-dynamic.json`

| Period | Default | Configurable options |
|---|---|---|
| Cheapest | `Charge` | `Charge`, `Charge PV` |
| Expensive | `Self-consumption` | `Self-consumption`, `Sell`, `Zero import` |
| Regular | `Charge PV` | `Charge PV`, `Self-consumption`, `Zero import`, `Full stop` |

Smart activation: the cheapest block only fires below a configurable tariff threshold, and the expensive block only fires when the price spread exceeds the minimum delta.

### 💶 Dynamic v2 — *lab feature* {#dynamic-v2}

<div style="background:#3a2e14;padding:0.6em 0.9em;border-left:4px solid #e6b800;color:#ffe9a8;margin:0.6em 0;border-radius:2px;">
🧪 A redesigned Dynamic strategy that evaluates <strong style="color:#fff3c4;">every price interval individually</strong> instead of fixed N-hour blocks. Lab feature — behavior may change between releases. Full guide: <a href="/05-dynamic-v2" style="color:#ffd866;text-decoration:underline;"><strong>Dynamic Strategy v2</strong></a>.
</div>

**Flow:** `02 strategy-dynamic-2.json`

---

## ⏰ Time-driven

### ⏰ Timed {#timed}
*Charges or discharges according to a fixed daily schedule with up to three configurable time windows.*

**Best for:** time-of-use tariffs and predictable daily routines (cheap night rate, expensive evening peak). \
**Setup:** Dashboard — set the time windows. \
**Flow:** `02 strategy-timed.json`

- Each window can independently charge, discharge, or idle.
- Shares charge / Charge PV / Self-consumption settings with the Dynamic strategy.

---

## ☀️ PV-aware / passive

These three strategies share a single Node-RED flow (`02 strategy-partials.json`) — import it once and all three become available.

### ☀️ Charge PV {#charge-pv}
*Charges the battery only when surplus solar is available — never draws from the grid, never discharges.*

**Best for:** sunny days when you just want to soak up free solar without grid round-tripping. \
**Setup:** None. \
**Flow:** `02 strategy-partials.json`

- Battery **never discharges** in this mode — any grid imports are not buffered.
- Soft-stops the battery when PV drops, avoiding relay chatter.
- *Migration:* the standalone `02 strategy-charge-pv.json` is **deprecated** in v4.10.0. After importing `02 strategy-partials.json`, remove the old `Strategy Charge PV` tab.

### ☀️ Zero import {#zero-import}
*Uses stored energy to cover home loads while blocking grid imports; surplus PV exports as usual.*

**Best for:** maximizing self-reliance — capacity tariffs, post-saldering tariffs, or anywhere imports are penalized. \
**Setup:** None. \
**Flow:** `02 strategy-partials.json`

- Charging is **disabled** — surplus PV always exports, never to the battery.
- Battery discharges until empty; after that, home loads pull from grid (unavoidable).
- Opposite of Charge PV — also available as a Dynamic sub-strategy and as an after-goal option on Charge/Sell.

### ☀️ Standby / peak shave {#standby-peak-shave}
*Battery idles by default; activates only when grid power exceeds the configured import or export limit, then peak-shaves until the grid drops back.*

**Best for:** capacity-tariff contracts (CAPTAR) and homes near their connection limit — minimizes battery wear by acting only on peaks. \
**Setup:** Dashboard — set the import / export power limits. \
**Flow:** `02 strategy-partials.json`

- Thresholds: import limit and export limit (W), each independently toggleable. See [Grid Power Limits](/06-advanced-features#grid-power-limits).
- Hysteresis: peak-shaving releases ~10 s after grid power returns below the limit (prevents chatter).
- This is the only strategy where the battery is *exclusively* a peak-shaver — other strategies peak-shave on top of their normal behavior.

---

## ⏹ Off

### ⏹ Full stop {#full-stop}
*Halts all battery operations.*

**Best for:** maintenance, testing, emergency situations. \
**Setup:** None. \
**Flow:** `02 strategy-full-stop.json`

- Takes precedence over Peak Shaving — the battery stays idle.
