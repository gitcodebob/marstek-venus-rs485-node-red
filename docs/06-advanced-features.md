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
   - Espescially during cloudy periods when the first battery takes the grunt of the charging and discharing.
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

## Charging/Discharging limits
- Marstek Venus E batteries with hardware versions prior to 3 allowed setting the discharging
  limit (minimum state of charge) and the charging limit (maximum state of charge).
  These limits are no longer exposed in the v3 batteries. 
  To overcome this, a number of `input_number` helpers are defined which are used for 
  all batteries instead of the device limits.
  They can be configured from the Power Limits tab in the dashboard.
- Using the `input_number`s also allows a higher discharging cutoff limit than the
  Marstek limits. This can therefore be used for example to implement something like
  the [Victron BatteryLife](https://www.victronenergy.com/media/pg/Energy_Storage_System/en/controlling-depth-of-discharge.html#UUID-af4a7478-4b75-68ac-cf3c-16c381335d1e)
  strategy to ensure the battery reaches 100% State of Charge regularly for 
  calibration purposes.
