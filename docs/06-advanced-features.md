---
layout: default
title: Advanced Features
nav_order: 6
---

# Advanced Features

## EV Stop Trigger
- **Electric Vehicle Charging Override:** Automatically stops all battery operations when your EV or other heavy appliance starts charging
  - Overrules ALL active strategies to prevent power spikes and grid overload
  - Configure by entering the `entity_id` of an `input_boolean` or `on/off` template sensor
  - The trigger sensor should indicate when your EV or heavy appliance is actively charging
  - When triggered, the system applies a Full Stop strategy until the sensor state returns to off
  - Useful for preventing home battery discharge during high-power EV charging sessions
  - Configurable through the Advanced Settings dashboard

## Battery Life
- **Minimum Idle Time:** Configurable minimum time before allowing battery grid relay disengagement
  - Reduces relay wear and extends battery life
  - Eliminates clicking/clacking noises during frequent charge/discharge transitions around 0W
  - Configurable through Home Assistant dashboard
- **Hysteresis:** Prevents excessive switching between charge and discharge mode around the 0 Watt line. 
   - If the PID output level lies within hysteresis, it will not switch from charge to discharge or vise versa. 
   - 0 = apply no hysteresis
- **Battery charge order:** determines which battery gets charged first (Multi-battery only)
   - Batteries gets charged in order. By changing which battery is first in order, you can optimize battery wear.
   - Especially during cloudy periods when the first battery takes the grunt of the charging and discharging.
   - The **Auto Cycle** feature changes the order of the batteries automatically each night or each week
      - Auto Cycling occurs at 02:00 hrs daily, or 02:00 hrs Sunday morning.
      - Don't want auto cycling? Select Cycle priority "Never". 
- **Controller Output Protection:** Software protection based on battery maximum charge/discharge values
  - Adjusts control output to stay within configured battery capabilities

## Performance Optimizations
- **Rate Limiter:** Dynamically adjusts processing rate based on grid power changes to reduce CPU load
  - *Power saving mode:* Processes 0.333 messages/second (every 3 seconds) during stable operation
  - *Responsive mode:* Increases to 1 message/second when significant changes detected (>20W AND >2%)
  - Automatically switches between modes based on power fluctuations
  - Change thresholds in `Home Battery Start` → `Rate limiter` → `F:node P1 change (20W or 2%)`
- **Deadband:** Control loop only activates when _P1 error_ is outside the deadband threshold
  - Further reduces unnecessary battery adjustments during stable operation
  - Change the deadband in `Strategy Self-consumption` → `F:node Deadband(15W)` 
- **Reporting by Exception:** Action nodes only trigger when values actually change
  - Reduces unnecessary Home Assistant calls and system load
  - Note: the SET MODE action nodes have proven unreliable, for _safety reasons_ the `On Change` RBE has been left out.

## Multi-Battery Management
- **More than 4 batteries:** Override or change `input_number.house_battery_count` and you are good to go.
  - The dashboard supports 4 batteries out of the box, duplicate and edit these or create your own dashboard.
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
- **Configuration:** Adjust from the "Settings" tab in the Home Assistant dashboard

## Peak Shaving
Peak Shaving helps reduce import and export peaks on your grid connection by intelligently using your battery capacity. This is particularly valuable for customers on capacity tariff contracts (CAPTAR, capaciteitstarief).

**How it works:**
- When grid power exceeds your configured limits, Peak Shaving activates automatically
- Your batteries discharge (during import peaks) or charge (during export peaks) to keep grid power within limits
- Peak Shaving takes control across all strategies, allowing them to continue working while respecting power limits
- Peak Shaving releases automatically once grid power returns to normal for a short duration (timeout period)

**Use cases:**
- **Capacity tariffs (CAPTAR):** Reduce billing costs by limiting maximum import power
- **Grid constraint management:** Prevent fuses from blowing when multiple high-power appliances (EV, heat pump) operate together
- **Smooth PV generation:** Reduce export spikes during rapid sunshine changes

**Configuration:**
- Set your **import limit** on the "Settings" tab (maximum power you want to draw from the grid)
- Set your **export limit** on the "Settings" tab (maximum power you want to feed back to the grid)
  - Note: Most capacity tariff contracts only require import limiting
- Peak Shaving integrates seamlessly with Charge, Self-consumption, Sell, Dynamic, and Timed strategies
- Full Stop strategy takes precedence and will not be overridden by peak shaving

**Limitations to understand:**
- Peak Shaving is **not a safety mechanism** and should not replace proper overload protection or fuses
- Requires available battery capacity:
  - Import peak shaving requires the battery to have charge available (not empty)
  - Export peak shaving requires the battery to have room to charge (not full)
- Charge and Sell strategies will peak shave AFTER reaching their primary goals (desired SoC or sell target)
- Lack of available capacity isn't explicitly shown to the user (must be inferred from battery state)
