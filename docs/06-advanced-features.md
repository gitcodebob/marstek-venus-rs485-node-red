---
layout: default
title: Advanced Features
nav_order: 6
---

# Advanced Features

## EV Stop Trigger
- **Electric Vehicle Charging Override:** Automatically changes battery behavior when your EV or other heavy appliance starts charging
  - Overrules the active strategy to prevent unwanted battery discharge or to reserve the battery for peak shaving
  - Configure by entering the `entity_id` of an `input_boolean` or `on/off` template sensor
  - The trigger sensor should indicate when your EV or heavy appliance is actively charging
  - Choose the trigger strategy:
    - **Full stop:** stop battery operation until the trigger sensor returns to off
    - **Standby / peak shave:** keep normal battery operation idle, but allow peak shaving when grid limits are exceeded
  - Manual **Full stop** in the main strategy selector always takes precedence, even when the EV trigger strategy is set to `Standby / peak shave`
  - Useful for preventing home battery discharge during high-power EV charging sessions
  - Configurable through the Advanced Settings dashboard

## Battery Life
- **Stop after idle time:** Configurable minimum time before allowing battery grid relay disengagement
  - Reduces relay wear and extends battery life
  - Eliminates clicking/clacking noises during frequent charge/discharge transitions around 0W
  - Configurable through Home Assistant dashboard
  - Recommended setting: 5 min
- **Hysteresis:** Smooths your system during the period where your energy usage equals the energy production (equilibrium)
   - Prevents excessive switching between charge and discharge mode around the 0 Watt line.
   - If the PID output level lies within hysteresis, it will not switch from charge to discharge or vise versa. 
   - 0 = apply no hysteresis
   - _Recommended setting_: off (0W)
    - Observe your home with hysteresis turned off during equilibrium. If it looks good. Leave it off. 
   - _Alternate setting_: 200W 
     - If the system swings up and down a lot during equilibrium, turn hysteresis up to see if it improves. 
- **Cycle which battery to charge first:** (Multi-battery only)
   - Batteries gets charged in order. By changing which battery is first in order, you can optimize battery wear.
   - Especially during cloudy periods when the first battery takes the grunt of the charging and discharging.
   - The **Cycle** setting controls how battery priority changes over time:

     | Option | Behaviour |
     |---|---|
     | **Auto balance** | Rotates priority every 30 minutes throughout the day. Spreads energy reserve more evenly across all batteries, maximizing combined charge and discharge power delivery. Best for multi-battery setups where keeping batteries at similar SoC matters. |
     | **Daily** | Rotates once per day at 02:00. |
     | **Weekly** | Rotates once per week on Sunday at 02:00. |
     | **Never** | Keeps the manually set priority. No automatic cycling. |

   - **Auto balance** automatically disables the _reverse discharge priority_ optimization, since that feature is designed for batteries at different SoC levels and conflicts with balanced operation.
   - **Tip:** For single-battery setups, cycling has no effect — any setting works.
- **Controller Output Protection:** Software protection based on battery maximum charge/discharge values
  - Adjusts control output to stay within configured battery capabilities

## Performance Optimizations
- **Rate Limiter:** Dynamically adjusts processing rate based on grid power changes and system load to reduce CPU load
  - *Power saving mode:* Processes 0.333 messages/second (every 3 seconds) during stable operation
  - *Responsive mode:* Increases to 1 message/second when significant changes detected (>20W AND >2%)
  - *High load cool-down:* If the previous strategy execution took ≥ 1.0 second, high load is detected and the system is forced into power saving mode for the next cycle, regardless of power changes. This gives the system time to recover and helps prevent Node-RED from grinding to a halt during error storms or excessive load.
  - Automatically switches between modes based on power fluctuations and execution time
  - Change P1 change thresholds in `Home Battery Start` → `Rate limiter` → `F:node P1 change (20W or 2%)`
  - Change the execution time threshold in `Home Battery Start` → `Rate limiter` → `F:node Operational thresholds`
- **Deadband:** Control loop only activates when _P1 error_ is outside the deadband threshold
  - Further reduces unnecessary battery adjustments during stable operation
  - Change the deadband in `Strategy Self-consumption` → `F:node Deadband(15W)` 
- **Reporting by Exception:** Action nodes only trigger when values actually change
  - Reduces unnecessary Home Assistant calls and system load
  - Note: the SET MODE action nodes have proven unreliable, for _safety reasons_ the `On Change` RBE has been left out.

## Multi-Battery Management
- **More than 6 batteries:** Override or change `input_number.house_battery_count` and you are good to go.
  - The dashboard supports 6 batteries out of the box. For 7 or more, duplicate and edit these cards or create your own dashboard.
- **Manual phase assignment:** Assign each configured battery to `L1`, `L2`, `L3`, or `Unassigned` from the dashboard.
  - The overview shows the assigned phase on each battery header and shows live battery AC power per phase in kW.
  - The Node-RED battery object exposes this as `battery.phase`, so custom strategies can use the mapping.
  - Optional per-phase grid power aliases can be configured in `packages/house_battery_control_config.yaml` as `sensor.p1_meter_l1_power`, `sensor.p1_meter_l2_power`, and `sensor.p1_meter_l3_power`. Leave them commented out if your setup is not three-phase.
  - Node-RED exposes configured phase meter values as `msg.grid_power_phase.L1`, `.L2`, and `.L3`, with missing or unreadable values set to `null`.
  - Built-in strategies still use aggregate control by default. Enable per-phase peak shaving to let peak shaving also react to phase-level power limits.
- **Load concentration:** when no phase is overloaded, the requested power is assigned to as
  few batteries as possible, in battery-priority order, rather than being split evenly.
  Inverters are inefficient at a small fraction of their rating, so one battery at 800 W beats
  four at 200 W. Batteries that are left over idle at 1 W and disconnect their relay once the
  `Stop after Idle for Minutes` timer expires.
  - Power is still shared across the batteries on a phase when per-phase peak shaving is
    actively correcting that phase, and per-phase command limits are always respected.
  - Which battery is filled first follows the `Prioritize battery` setting, and is reversed
    for discharging when reverse discharge priority is on.
- **Unavailable batteries:** a battery whose telemetry cannot be read is skipped rather than
  treated as reporting `0`. It is excluded from load distribution, from the cumulative totals,
  and from the "batteries are full" check, and the dashboard totals hold their last good value
  until it reports again.
- **3-Phase self-consumption:** if you require 0 W grid consumption on a per phase basis, the setup changes slightly. 
      
      Note: most homes get billed for the net total of all phases. If that is the case for you as well, ignore these instructions.

   - Duplicate `Home Battery Start` to `Home Battery Start L1`, `Home Battery Start L2`, `Home Battery Start L3` (one for each phase).
   - Set the correct battery index in the `Start Loop` node. Keeping an eye on which battery is on which phase and thus which flow.
   - Remove the `Loop step` and `Loop until`, tie the `Mapping` to the `Battery strategy` directly.
   - Deploy as per normal instructions.

## Power Limits Configuration
The system uses two distinct types of power limits, each serving different purposes:

### Battery State of Charge (SoC) Limits
These protect your battery by preventing over-charging and over-discharging.

- Marstek Venus E batteries with hardware versions prior to V3 allowed setting these limits directly on the device. These are no longer exposed in V3 batteries.
- Home Battery Control uses `input_number` helpers to manage SoC limits globally across all batteries
- **Minimum SoC (Discharge limit):** Prevents the battery from discharging below this level (protects battery health and ensures reserve capacity)
  - Example: Set to 10% to keep a minimum reserve for emergencies
  - Can be set higher than manufacturer limits using the software helpers
- **Maximum SoC (Charge limit):** Prevents charging beyond this level (extends battery lifespan)
  - Example: Set to 95% to reduce stress on battery cells
- **Configuration:** Adjust from the "Power Limits" tab in the Home Assistant dashboard
- **Advanced use case:** Implement [Victron BatteryLife-like strategies](https://www.victronenergy.com/media/pg/Energy_Storage_System/en/controlling-depth-of-discharge.html#UUID-af4a7478-4b75-68ac-cf3c-16c381335d1e) by enforcing regular full charge cycles for battery calibration

### Grid Power Limits
Controls grid import/export thresholds for `peak shaving` functionality.

- **Import limit:** Maximum power to draw from the grid (example: 16A × 230V = 3680W for CAPTAR contracts)
- **Export limit:** Maximum power to feed back to the grid (example: 3000W if grid connection has export limits)
- **Hard phase ceiling (Max phase power):** Existing shared per-phase limit, exposed as `msg.grid_power_limit_phase`. Hard-ceiling violations always receive immediate correction. The controller never raises this setting to accommodate an operating target.
- **Phase operating target:** Default **5500 W**, configurable separately from the hard ceiling. When throttling is needed, available charging is `max(0, target − non-battery phase load)`, capped by the requested charge and eligible capacity. For example, 3680 W of non-battery load allows 1820 W of battery charging: a running 5000 W charge drops directly to 1820 W, shared by the batteries on that phase. Other phases retain their own allowances.
- **Target hysteresis (± W):** Default **100 W** on either side of the target. With a 5500 W target, hold the allowance steady from **5400–5600 W**; above the band, calculate the correction back toward 5500 W; below it, wait for continuous headroom and then recover at the configured rate until entering the band. Small fluctuations inside the band neither move the allowance nor restart the timer. The same behavior applies to phase import and export.
- **Valid operating settings:** Both values must be positive and `target + hysteresis < hard ceiling`. Invalid or unavailable helper values retain the last valid pair, provided it still fits the current ceiling. On cold start, the fallback is `min(5500, ceiling − 250)` with ±100 W. For example, an unchanged 5500 W ceiling gives a 5250 W fallback target; set a 5750 W ceiling explicitly if that is the intended limit. Very small limits supplied outside the dashboard use a proportionally smaller positive fallback band.
- **Per-phase peak shaving:** Optional protection using configured L1/L2/L3 grid power sensors and battery phase assignments. A shared controller limits the final battery solutions returned by every strategy except Full stop. It reduces battery interaction first and supplies corrective charging/discharging where needed. Phase meter aliases must report watts; convert current-only sensors in `house_battery_control_config.yaml`. Unassigned batteries cannot correct a specific phase. Unavailable batteries have zero assignable capacity; the controller asks eligible batteries on the same phase to carry the correction.
- **Recovery delay:** Stable-headroom wait before protection relaxes; default **10 seconds**, adjustable from **0–120 seconds**.
- **Recovery rate:** Maximum relaxation after the wait; default **100 W/s**, adjustable from **10–1000 W/s**. Batteries on a phase share this allowance. Whole-house import/export protection shares one allowance across the installation; both sets of constraints apply when enabled together. These settings apply to charge/discharge throttling and withdrawing peak-shaving support.
- **Configuration:** Adjust from the "Settings" tab in the Home Assistant dashboard

### Charge / Sell Power Mode
The Charge and Sell strategies offer two power modes — set per strategy on the Settings tab:

- **Maximum power** — runs at the battery's full charge/discharge capacity for the fastest result.
- **Grid power limit** — uses the PID controller to charge or discharge at a controlled rate, useful for preventing grid overload or staying within an export cap. Per-battery limits can still be configured in the Settings tab.

## Peak Shaving
Peak Shaving helps reduce import and export peaks on your grid connection by intelligently using your battery capacity. This is particularly valuable for customers on capacity tariff contracts (CAPTAR, capaciteitstarief).

**How it works:**
- When grid power exceeds your configured limits, Peak Shaving activates automatically
- Your batteries discharge (during import peaks) or charge (during export peaks) to keep grid power within limits
- The controller subtracts measured battery power from measured grid power to estimate the underlying load. Bringing the meter below its limit by shaving does not make the required support disappear.
- Peak Shaving takes control across all strategies, allowing them to continue working while respecting power limits
- Required reductions take effect immediately, using the calculated nonzero charge allowance whenever available. A phase overload does not trigger blanket stopping of all batteries. If stopping the offending interaction lands inside the operating band, no direction reversal is needed; otherwise the controller requests the additional charging/discharging support required for peak shaving.
- Phase recovery holds inside the operating band and ramps only after a stable interval below it, rather than continuing toward the hard ceiling. Whole-house protection keeps its own import/export limits and recovery behavior. Signed power bounds also govern withdrawing discharge support, crossing zero, and resuming charging. Strategy changes do not reset these bounds.
- Missing required meter or battery-power readings pause the affected recovery restriction. Valid phases remain protected. When readings return, a new stable-headroom wait begins. An unavailable toggle retains its previous setting; explicitly switching a protection feature off removes its bounds.
- On deploy/restart or battery reassignment, affected bounds initialize conservatively from measured output and current headroom. Recovery cannot accumulate unused allowance: a single evaluation permits at most three seconds of the configured rate, and unobserved battery responses cannot repeatedly increase a pending command. Moving load between batteries also waits for measured reductions before spending that headroom on another battery.
- A known same-direction throttle updates only the power value, without a zero-power preamble, stop, or mode reset. Actual mode changes and uncertain startup clear both directional power setpoints before changing mode, then apply the new limited power. The command record tracks a pending direction handoff until the new direction is observed, so delayed old-direction telemetry does not repeatedly restart it. Service calls and battery command cohorts run in order. A failed service call unlocks the cohort and invalidates the uncertain command so the next evaluation retries from telemetry.

**Use cases:**
- **Capacity tariffs (CAPTAR):** Reduce billing costs by limiting maximum import power
- **Grid constraint management:** Prevent fuses from blowing when multiple high-power appliances (EV, heat pump) operate together
- **Smooth PV generation:** Reduce export spikes during rapid sunshine changes

**Configuration:**
- Set your **import limit** on the "Settings" tab (maximum power you want to draw from the grid)
  - Very low import limits can leave little control margin. The dashboard warns below 2500 W because large load steps can still cause temporary overshoot while the battery ramps down.
- Set your **export limit** on the "Settings" tab (maximum power you want to feed back to the grid)
  - Note: Most capacity tariff contracts only require import limiting
- Peak Shaving integrates seamlessly with Charge, Self-consumption, Sell, Dynamic, and Timed strategies
- Full Stop strategy takes precedence and will not be overridden by peak shaving

**Limitations to understand:**
- Peak Shaving is **not a safety mechanism** and should not replace proper overload protection or fuses
- Requires available battery capacity:
  - Import peak shaving requires the battery to have charge available (not empty)
  - Export peak shaving requires the battery to have room to charge (not full)
- Charge and Sell are protected while pursuing their goals, as well as after switching to another strategy.
- Unmet correction is reported in the controller node status and logs when battery capacity, SoC, availability, or conflicting limits prevent full correction.
- The reserve above the operating band must accommodate other controllers' recovery increments if they need guaranteed room to resume. With a 5750 W ceiling and 5500±100 W target band, only 150 W remains at the upper edge. An EV charger resuming in whole 1 A steps at 230 V needs about 230 W. The extended simulation settles without a sawtooth but can leave that charger below 16 A after it has throttled. A configurable **5400±100 W** band leaves 250 W at its upper edge and lets the simulated charger regain 16 A. These are simulation results, not a guarantee for a particular charger; adjust the target/band for its step size and telemetry latency.
- Recovery settings govern software commands. Physical grid peaks still depend on meter latency, battery response, other load controllers, and available capacity. HA service completion is not confirmation that the battery has reached its setpoint.
- Custom strategies must return `msg.solutions` through the start flow to receive shared command protection. Direct device writes bypass it. Calling a partial independently, without the start flow, retains its legacy timer behavior.

**Diagnostics and updates:**
- `msg.protection_recovery.settings` contains normalized `delay_s`, `rate_w_per_s`, `phase_target_w`, and `phase_hysteresis_w`. `phase_settings_status` reports whether the target/band was configured, retained, or supplied by the fallback. Each entry in `bounds` names its phase (or `total`) and direction, signed raw/effective bound, applied power, state, remaining delay, reason, and unmet watts. Phase entries also include non-battery load, permitted charge/discharge, the operating target and band, the hard ceiling, and unmet operating-target correction outside the allowed band. Import bounds are upper limits; export bounds are lower limits, with charging positive and discharging negative.
- Existing `msg.phase_protection.command_limit_by_phase` fields remain available for strategy allocation. The final shared controller enforces the additional signed recovery restrictions.
- Update the Home Assistant package and dashboard, plus both **01 start-flow** and **02 strategy-partials** (or the combined export). Missing recovery helpers fall back to 10 seconds and 100 W/s; missing target/band helpers retain a valid cached pair or use the ceiling-aware startup fallback described above. The rebuilt combined export now uses the individual flows' node IDs. If upgrading from the older combined export, replace its old tabs when importing rather than keeping both sets active.
- Before relying on hardware behavior, record phase power and battery commands during a staged repeat of the EV charging scenario. Start at reduced loads, verify immediate throttling and gradual recovery, then repeat at the intended load. The automated simulation uses a 5750 W limit (25 A at nominal 230 V), requests of 2500/2500/5000 W, and an independent 16 A three-phase charger; it cannot establish the physical peak current of a particular installation.
