---
render_with_liquid: false
---

# Self-Consumption Strategy

The self-consumption strategy (zelfconsumptie strategie) uses a PID controller to automatically maintain near-zero grid power import/export, maximizing the use of your solar energy (zonne-energie) and minimizing grid interaction.

## Overview

This is the **most popular strategy** for users with solar panels who want to:
- Store excess solar energy in batteries
- Use stored energy when solar production is insufficient
- Minimize grid power usage
- Automatically respond to changing consumption

## How It Works

### PID Controller Basics

A **PID (Proportional-Integral-Derivative) controller** continuously adjusts battery charge/discharge power to keep grid power near your target (typically 0W).

The controller responds to the **error signal** (difference between actual and target grid power):
- **Positive error** (importing from grid) → Increase battery discharge or decrease charge
- **Negative error** (exporting to grid) → Increase battery charge or decrease discharge

**[Learn more about PID controllers →](../reference/pid-controller.md)**

### Control Loop

```
1. Read P1 meter (grid power in Watts)
2. Calculate error = Target (0W) - Actual grid power
3. PID controller calculates correction
4. Apply correction to battery charge/discharge
5. Wait for system to respond
6. Repeat
```

## Prerequisites

Before configuring self-consumption strategy:

- ✅ [Installation completed](../getting-started/installation.md)
- ✅ [Safety guidelines reviewed](../getting-started/safety.md)
- ✅ P1 sensor reports in Watts (not kW)
- ✅ Battery limits configured (start with ≤800W)
- ✅ Master Switch OFF (for initial configuration)

## Initial Setup

### Step 1: Import Node-RED Flow

Ensure you have imported:
- `02 strategy-self-consumption.json`

Deploy the flow in Node-RED.

### Step 2: Select Strategy

In Home Assistant dashboard:
1. Navigate to Home Battery Control dashboard
2. Find "Strategy Selection" dropdown
3. Select **"Self-Consumption"**

**Do NOT enable Master Switch yet** - PID tuning required first.

### Step 3: Choose PID Preset

The dashboard provides four PID presets for easy configuration:

| Preset | Description | Kp | Ki | Kd | Best For |
|--------|-------------|----|----|----|----|
| **Very Safe** | Slowest response, most stable | 0.5 | 0 | 0 | First-time setup, testing |
| **Safe** | Moderate response, good stability | 1.0 | 0.05 | 0 | General use, cautious approach |
| **Regular** | Fast response, requires monitoring | 2.0 | 0.1 | 0.5 | Experienced users, optimized setups |
| **Custom** | Manual tuning | - | - | - | Advanced tuning |

**For first-time setup: Choose "Very Safe"**

### Step 4: Verify Configuration

In Home Assistant dashboard, confirm:
- Master Switch: OFF
- Strategy: Self-Consumption
- PID Preset: Very Safe (or custom values: Kp=0.5, Ki=0, Kd=0)
- Battery Max Charge: ≤800W (per battery)
- Battery Max Discharge: ≤800W (per battery)

### Step 5: Enable Control

1. Open Node-RED debug panel to monitor messages
2. In Home Assistant, switch Master Switch to **"Full Control"**
3. Monitor system behavior

## What to Expect

### Initial Behavior (Very Safe Preset)

With Kp=0.5, Ki=0, Kd=0:
- **Slow response** to power changes (10-30 seconds)
- **Stable operation** - unlikely to oscillate
- **Imperfect tracking** - may not reach exactly 0W
- **Safe for testing** - allows observation without risk

### Monitoring Your System

Watch these values in Home Assistant:

**Key Entities:**
- `sensor.p1_power` - Grid power (goal: close to 0W)
- `sensor.house_battery_control_pid_output` - Controller output (positive = charging, negative = discharging)
- `sensor.house_battery_control_error` - Error signal in Watts

**History Graph Setup:**
Create a history graph with:
- P1 power sensor
- PID output
- Error signal
- P-term, I-term, D-term (optional, for advanced tuning)

### Common Observations

**Normal behavior:**
- ✅ Gradual adjustment to consumption changes
- ✅ Grid power oscillates slightly around 0W
- ✅ Battery responds within 10-60 seconds
- ✅ Different response to slow vs fast load changes

**Problematic behavior:**
- ⚠️ Large sustained oscillations (>100W amplitude)
- ⚠️ Rapid charge/discharge switching
- ⚠️ No response to consumption changes
- ⚠️ Continuous grid import/export despite battery capacity

**If you see problems:** [Troubleshooting PID Issues](../troubleshooting/common-issues.md#pid-oscillations)

## Optimizing Performance

After 24-48 hours of stable operation with "Very Safe", you may want to improve response time.

### Option 1: Use Preset Progression

Gradually increase responsiveness:
1. Start: **Very Safe** (Kp=0.5, Ki=0, Kd=0)
2. After 24h stable: Try **Safe** (Kp=1.0, Ki=0.05, Kd=0)
3. After 24h stable: Try **Regular** (Kp=2.0, Ki=0.1, Kd=0.5)

**Monitor for 24 hours after each change!**

### Option 2: Custom PID Tuning

For advanced users who want optimal performance:

**[→ Advanced PID Tuning Guide](../advanced/pid-tuning.md)**

This guide covers:
- Ziegler-Nichols tuning method
- Systematic tuning approach
- Frequency analysis
- Dealing with different system dynamics

### Performance Settings

Enable additional optimizations:

**Deadband (default: 15W):**
- Control loop only activates when error > deadband
- Reduces CPU load and relay wear
- Prevents hunting around 0W

**Hysteresis:**
- Prevents mode switching (charge ↔ discharge) near 0W
- Reduces relay wear
- Set to 10-50W depending on system stability

**Minimum Idle Time (default: 120s):**
- Minimum time before allowing relay disengagement
- Reduces relay clicking
- Extends battery life

**[→ Battery Life Optimization](../advanced/battery-life-optimization.md)**

## Advanced Configuration

### Target Grid Power (Non-Zero)

You can set a non-zero target if desired:
- Positive value: Maintain constant grid import (e.g., +500W)
- Negative value: Maintain constant grid export (e.g., -500W)

**Why use non-zero target?**
- Match solar inverter behavior
- Compensate for P1 meter inaccuracies
- Keep inverter active/producing

### Multi-Battery Systems

For systems with multiple batteries:
- Each battery has individual max charge/discharge limits
- System automatically distributes load across batteries
- Configure battery priority and auto-cycling

**[→ Multi-Battery Setup Guide](../guides/multi-battery-setup.md)**

### 3-Phase Configuration

For per-phase zero consumption:
- Requires duplicating main control flow
- One flow per phase
- Each flow controls specific battery

**[→ 3-Phase Configuration](../guides/3-phase-configuration.md)**

## Troubleshooting

### System Not Responding

**Check:**
1. Master Switch is "Full Control"
2. Strategy selected is "Self-Consumption"
3. Node-RED flows deployed and running
4. P1 sensor entity is reporting values
5. Battery entities are available

**Debug:**
- Open Node-RED debug panel
- Check for error messages
- Verify PID output value is changing

### Poor Tracking Performance

**Symptoms:** Grid power stays far from 0W

**Possible causes:**
1. PID gains too low (increase Kp)
2. Battery limits too restrictive
3. Consumption exceeds battery capacity
4. P1 sensor in wrong units (kW instead of W)

**Solutions:**
- Increase Kp gradually (0.5 → 1.0 → 1.5)
- Verify battery max discharge setting
- Check if consumption is within battery capability
- Fix P1 sensor units (multiply by 1000 if in kW)

### Oscillations

**Symptoms:** Grid power swings wildly, relay clicking

**Causes:**
- PID gains too high (especially Kp)
- Derivative term too aggressive (Kd)
- No deadband/hysteresis

**Solutions:**
1. Immediately reduce Kp (cut in half)
2. Set Kd = 0 temporarily
3. Increase deadband to 30-50W
4. Add hysteresis (20-50W)

**[→ Complete PID Troubleshooting Guide](../troubleshooting/common-issues.md#pid-issues)**

## Real-World Examples

### Example 1: Sunny Day with Variable Loads

**Morning (8:00-12:00):**
- Solar production increasing
- Batteries charging from excess solar
- Grid power near 0W
- Coffee machine: Short discharge burst, then back to 0W

**Afternoon (12:00-18:00):**
- Peak solar production
- Batteries fully charged
- Exporting to grid (if not limited)
- Washing machine: Barely impacts grid power

**Evening (18:00-23:00):**
- No solar production
- Batteries discharging
- Grid power near 0W
- Cooking dinner: Battery provides power boost

### Example 2: Cloudy Day

**All day:**
- Limited solar production
- Batteries alternating between small charge/discharge
- PID actively managing consumption
- Grid power close to 0W but with more variation

### Example 3: Night

**Night (23:00-6:00):**
- No solar production
- Batteries discharging to cover baseload
- Minimal consumption changes
- PID maintains stable output

## Performance Metrics

Track your system performance:

**Key metrics:**
- **Grid power average:** Aim for <50W average absolute value
- **Grid power standard deviation:** Lower is better (<100W is excellent)
- **Battery cycle depth:** Track via SoC changes
- **Self-consumption rate:** (Solar production - Grid export) / Solar production
- **Self-sufficiency rate:** (Consumption - Grid import) / Consumption

## Tips for Best Results

1. **Start conservative** - Use Very Safe preset, low battery limits
2. **Monitor for 48 hours** minimum before changes
3. **One change at a time** - Don't adjust multiple parameters simultaneously
4. **Document changes** - Note what you changed and when
5. **Weather matters** - Tune during typical weather, not extremes
6. **Appliance testing** - Test with coffee machine, washing machine, etc.
7. **Night testing** - Verify stable operation without solar input
8. **Export history** - Use history graphs to analyze performance

## When to Use Other Strategies

Self-consumption may not be optimal if:
- ❌ You have dynamic energy contract → Use [Dynamic Strategy](dynamic.md)
- ❌ No solar panels & fixed off-peak hours → Use [Timed Strategy](timed.md)
- ❌ You want to only store solar → Use [Charge PV](charge.md#charge-pv-solar-only)

## Next Steps

- **Tune PID:** [Advanced PID Tuning Guide](../advanced/pid-tuning.md)
- **Optimize battery life:** [Battery Life Settings](../advanced/battery-life-optimization.md)
- **Multi-battery setup:** [Multi-Battery Guide](../guides/multi-battery-setup.md)
- **Combine with EV:** [EV Stop Trigger](../advanced/ev-stop-trigger.md)

## Community Support

- **Discord:** `Marstek RS485/Node-Red besturing`
- **GitHub Discussions:** Share your PID settings and results
- **Report issues:** [GitHub Issues](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues)

