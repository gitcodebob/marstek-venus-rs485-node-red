---
layout: default
title: Self-Consumption Setup
nav_order: 4
---
# Self-consumption Strategy Setup

For the `self-consumption strategy` a PID controller is used. This keeps grid input/output close to 0 W (the target grid consumption). This PID controller needs to be tuned to your home. When your done, it outperforms the vendor's control algorithm in almost every scenario.

## What is a PID Controller
A proportional–integral–derivative controller (PID controller or three-term controller) is a feedback-based control loop mechanism commonly used to manage machines and processes that require continuous control and automatic adjustment. See [Wikipedia - Fundamental operation](https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller#Fundamental_operation)

## PID Operation
Complete the [getting started](01-getting-started.md) first.

Open Node-RED (in an extra browser tab): 
- Open the debug bar to monitor messages.

In Home Assistant:
   - Find the PID controls on the dashboard and select the `very safe` preset. Or set the Kp, Ki, Kd values manually to something like: 
      - Kp = 0.5
      - Ki = 0
      - Kd = 0
   - Double check min/max (dis)charge power of your batteries.

Click `Full control` and select `self-consumption` as a strategy.
- Now the controller will start managing the batteries.

Tip, observe the HA history graph containing:
   - P1 sensor (positive = drawing power from grid, negative = delivering power back to grid)
   - PID output (positive = batteries are charging, negative = discharging)
   - P-term, I-term, D-term (P+I+D = PID Output)
   - Error signal (what error is observed in Watts)

## PID Tuning
### PID Presets (Simplified Tuning)
For easier setup, use the **PID Presets** dropdown in the Home Assistant dashboard. Choose from predefined configurations:
- **Very safe**: Conservative settings, slower response
- **Safe**: Moderate settings, balanced performance  
- **Regular**: Faster settings, monitoring required
- **Custom**: Manual tuning using individual parameters

The system automatically applies the selected preset values on selection. After that, you can tune values to your liking.

> **IMPORTANT SAFETY** Carefully monitor for **system instability** and stand by to tune down Kp, Ki, Kd values or disengage batteries when large oscillations persist.

Every system is different and your home requires unique settings. What's marked as 'Regular' for one, can be unstable for others. Keep this in mind. This is also why this system can easily outperform Marstek software, as Marstek needs to put in a healthy safety margin to accommodate these differences between homes. 

> **ADVISE** Keep the max. charge/discharge settings low (< 800 W) until you have experience with how your system reacts to coffee machines, hair straighteners, old washing machines and other 'horrifically noisy devices'.   

### PID Tuning (Advanced)
Use the [Ziegler-Nichols method](https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller#Ziegler%E2%80%93Nichols_method) for a starting point. 

1. Set Kp to say 1.0, and be prepared to decrease it fast if needed.
1. If the system oscillates in a steady state -> export the HA History graph to CSV.
    - increase Kp when not resonating
    - decrease Kp if the system runs off. (stay alert, not to damage your system)
1. Determine the resonant frequency. E.g. by using [HA-history-graph-csv-export-analysis
](https://github.com/gitcodebob/HA-history-graph-csv-export-analysis). You need to download these CSV data first from the History dashboard, P1 Meter Power sensor. Only use a period there the battery management has actually been able to minimize P1 (i.e., not full stop, charge only, empty or full battery etc).
1. T<sub>u</sub> = 1 / `<resonant frequency>` and K<sub>u</sub> = your current K<sub>p</sub> during resonance
1. Use the table of the [Ziegler-Nichols method](https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller#Ziegler%E2%80%93Nichols_method) to get a baseline. 
    - This baseline can be a bit aggressive.

Note: every system is different and your home is unique. Tune in small increments from here.
