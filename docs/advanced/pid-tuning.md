# Advanced PID Tuning

Comprehensive guide to tuning the PID controller for optimal self-consumption performance.

## Overview

This guide covers advanced PID tuning techniques for users who want to optimize beyond the preset configurations. If you're new to PID control, start with the [Self-Consumption Strategy Guide](../strategies/self-consumption.md) and use presets first.

## When to Use Advanced Tuning

✅ **Consider advanced tuning if:**
- Presets don't provide satisfactory performance
- You want to minimize grid interaction further
- You have experience with control systems
- You're willing to invest time in optimization

❌ **Stick with presets if:**
- System is working acceptably
- You're new to PID control
- Time investment isn't worth marginal gains

## Understanding PID Components

### Proportional (P) Term

**What it does:** Responds proportionally to current error

```
P_output = Kp × error
```

**Effect of Kp:**
- **Higher Kp** → Faster response, more aggressive
- **Lower Kp** → Slower response, more stable

**Symptoms of incorrect Kp:**
- Too high: Oscillations, overshooting
- Too low: Slow response, poor tracking

### Integral (I) Term

**What it does:** Eliminates steady-state error over time

```
I_output = Ki × ∫(error × dt)
```

**Effect of Ki:**
- **Higher Ki** → Faster elimination of offset, risk of overshoot
- **Lower Ki** → Slower offset correction, more stable

**Symptoms of incorrect Ki:**
- Too high: Oscillations with increasing amplitude, "integral windup"
- Too low: Persistent offset (never reaches 0W)

### Derivative (D) Term

**What it does:** Responds to rate of change of error

```
D_output = Kd × (d(error)/dt)
```

**Effect of Kd:**
- **Higher Kd** → Dampens oscillations, reduces overshoot
- **Lower Kd** → Less damping, faster response

**Symptoms of incorrect Kd:**
- Too high: Sluggish response, sensitivity to noise
- Too low: Overshoot, oscillations

## Tuning Methods

### Method 1: Ziegler-Nichols (Systematic Approach)

Classical tuning method that provides a mathematical starting point.

#### Step 1: Find Ultimate Gain (Ku)

1. Set Ki = 0 and Kd = 0
2. Set Kp = 1.0
3. Enable Master Switch and monitor system
4. Gradually **increase Kp** until system oscillates with **constant amplitude**
   - If system runs away (increasing oscillations), reduce Kp immediately
   - If stable, increase Kp by 0.5 increments
5. When stable oscillation achieved:
   - Note Kp value → This is **Ku** (ultimate gain)
   - Record oscillation

#### Step 2: Measure Ultimate Period (Tu)

1. Export Home Assistant history graph data:
   - Include P1 power sensor or PID output
   - Export as CSV
   - 30-60 minutes of oscillating data
   
2. Analyze oscillation frequency:
   - Count peaks in data
   - Calculate period: Tu = total_time / number_of_cycles
   - Or use [HA History CSV Analysis Tool](https://github.com/gitcodebob/HA-history-graph-csv-export-analysis)

**Example:**
- 60 minutes of data
- 15 complete oscillation cycles
- Tu = 60 min / 15 = 4 minutes = 240 seconds

#### Step 3: Calculate PID Gains

Use Ziegler-Nichols tuning table:

| Control Type | Kp | Ki | Kd |
|--------------|----|----|-----|
| **P** | 0.5 × Ku | 0 | 0 |
| **PI** | 0.45 × Ku | 0.54 × Ku / Tu | 0 |
| **PID** | 0.6 × Ku | 1.2 × Ku / Tu | 0.075 × Ku × Tu |

**Example calculation:**
- Ku = 3.0
- Tu = 240 seconds

**For PID control:**
- Kp = 0.6 × 3.0 = 1.8
- Ki = 1.2 × 3.0 / 240 = 0.015
- Kd = 0.075 × 3.0 × 240 = 54

#### Step 4: Apply and Refine

1. Apply calculated gains
2. Monitor for 24 hours
3. Fine-tune:
   - If still oscillating: Reduce Kp by 20%
   - If too slow: Increase Kp by 10%
   - If steady offset: Increase Ki by 50%
   - If noisy: Reduce Kd by 50%

**Warning:** Ziegler-Nichols often produces aggressive settings. Start with 70% of calculated values for safety.

### Method 2: Manual Tuning (Trial and Error)

Systematic approach without inducing oscillations.

#### Step 1: Start with P-only Control

1. Set: Kp = 0.5, Ki = 0, Kd = 0
2. Enable control and monitor
3. Gradually increase Kp:
   - Double Kp if response is very slow
   - Increase by 50% if response is slow
   - Stop when response is acceptable or slight oscillation appears

#### Step 2: Add Integral

1. Start with Ki = Kp / 10
2. Monitor for offset elimination
3. If offset persists after 5+ minutes, increase Ki by 50%
4. If oscillations develop, reduce Ki by 50%

#### Step 3: Add Derivative (Optional)

1. Start with Kd = Kp / 10
2. Monitor for damping of oscillations
3. Increase if overshooting persists
4. Decrease if response becomes too slow or erratic

#### Step 4: Fine-tune All

Iteratively adjust all three parameters:
1. Make small changes (±10-20%)
2. Monitor for 2-4 hours after each change
3. Keep notes of all changes and results

### Method 3: Adaptive Tuning

Adjust tuning based on conditions.

**Create multiple PID gain sets for:**
- High solar production periods
- Night/no solar periods
- High consumption periods
- Low consumption periods

**Implementation:**
- Use Home Assistant automations to switch gains
- Based on solar production, time of day, or consumption level

**Example automation:**
```yaml
automation:
  - alias: "PID Gains for High Solar"
    trigger:
      - platform: numeric_state
        entity_id: sensor.solar_power
        above: 3000  # 3kW solar production
    action:
      - service: input_number.set_value
        target:
          entity_id: input_number.house_battery_control_pid_kp
        data:
          value: 2.5  # More aggressive during high solar
```

## Advanced Techniques

### Deadband Tuning

**Purpose:** Prevent unnecessary control action near target

**Configuration:**
- Located in `02 strategy-self-consumption.json`
- Node: `F:node Deadband(15W)`
- Default: 15W

**Tuning guidance:**
- **Increase** (20-50W) if:
  - Excessive relay cycling near 0W
  - CPU load is high
  - Small errors are acceptable
- **Decrease** (5-10W) if:
  - Very tight control needed
  - Large battery capacity available
  - CPU load is low

### Hysteresis Configuration

**Purpose:** Prevent mode switching (charge ↔ discharge) near 0W

**Configuration:**
- Home Assistant dashboard → Advanced Settings
- Default: 0W (disabled)

**Tuning guidance:**
- Set to 10-50W to reduce relay wear
- Higher values: More relay protection, less precise control
- Lower values: More precise control, more relay switching

**Example:** Hysteresis = 30W
- Charging at 20W → Stays charging (20W < 30W threshold)
- Discharging at -25W → Stays discharging (-25W > -30W threshold)
- Must exceed ±30W to switch modes

### RBE (Report by Exception) Tuning

**Purpose:** Reduce control loop triggers

**Configuration:**
- Located in `01 start-flow.json`
- Node: `RBE:node 'On change (2%)'`
- Default: 2% change threshold

**Tuning guidance:**
- **Increase** (3-5%) if:
  - System responds too frequently to small changes
  - CPU load is high
  - P1 sensor is noisy
- **Decrease** (0.5-1%) if:
  - System misses important changes
  - Response seems delayed
  - Very stable P1 readings

### Filter Configuration

Add smoothing to P1 input if sensor is noisy:

**Example moving average filter:**
```javascript
// Add to function node before PID controller
let history = context.get('history') || [];
history.push(msg.payload);
if (history.length > 5) history.shift();  // Keep last 5 values

msg.payload = history.reduce((a, b) => a + b) / history.length;
context.set('history', history);
return msg;
```

**Trade-off:** Smoothing reduces noise but adds delay

## Tuning for Different System Characteristics

### Large Inertia Systems

**Characteristics:**
- Slow to respond to changes
- Large thermal mass
- Heavy loads

**Tuning approach:**
- Lower Kp (reduce overshoot)
- Higher Ki (eliminate steady-state error)
- Higher Kd (dampen slow oscillations)

### Fast Response Systems

**Characteristics:**
- Rapid load changes
- Lightweight batteries
- Responsive inverters

**Tuning approach:**
- Higher Kp (keep up with changes)
- Lower Ki (prevent overshoot)
- Lower Kd (avoid amplifying noise)

### Noisy Systems

**Characteristics:**
- Highly variable loads (many appliances)
- Noisy P1 sensor
- Frequent small changes

**Tuning approach:**
- Moderate Kp
- Low Ki (prevent wind-up from noise)
- Very low or zero Kd (derivative amplifies noise)
- Increase deadband
- Add input filtering

## Measuring Performance

### Key Performance Indicators

**1. Mean Absolute Error (MAE)**
```
MAE = Average(|actual_grid_power - target|)
```
- Target: <50W for excellent performance
- <100W is good
- >150W needs improvement

**2. Standard Deviation**
```
StdDev = Standard deviation of grid power over time
```
- Lower is better
- <75W excellent
- <150W good

**3. Integral of Absolute Error (IAE)**
```
IAE = ∫|error| dt
```
- Accumulated error over time
- Lower is better
- Compare before/after tuning changes

**4. Oscillation Frequency**
- Count number of relay engagements per hour
- Target: <10 per hour
- >30 per hour indicates problems

### Performance Testing

**Standard test procedure:**

1. **Baseline measurement** (before changes):
   - Record 24-hour period
   - Calculate MAE, StdDev
   - Note oscillation frequency

2. **Make single parameter change**

3. **Re-measure** (after changes):
   - Same 24-hour period type (similar weather/usage)
   - Calculate same metrics
   - Compare to baseline

4. **Accept or reject change** based on metrics

## Troubleshooting Tuning Problems

### Persistent Oscillations

**Symptoms:**
- Regular swinging around target
- Relay clicking frequently
- Amplitude doesn't decrease

**Solutions:**
1. Reduce Kp by 30-50%
2. Set Kd = 0
3. Increase deadband to 30-50W
4. Add hysteresis (20-40W)
5. Check for mechanical delays (battery response time)

### Integral Windup

**Symptoms:**
- Large overshoot after load changes
- Slow return to target
- I-term grows very large

**Solutions:**
1. Reduce Ki by 50%
2. Implement anti-windup (limit I-term accumulation)
3. Reset I-term on large error changes

**Anti-windup implementation:**
```javascript
// In PID calculation function node
let iTerm = context.get('iTerm') || 0;
iTerm += error * Ki * dt;

// Limit iTerm accumulation
const maxI = 1000;  // Adjust based on your system
iTerm = Math.max(-maxI, Math.min(maxI, iTerm));

context.set('iTerm', iTerm);
```

### Derivative Kick

**Symptoms:**
- Sharp spikes when target changes
- Erratic behavior during transitions
- Excessive noise sensitivity

**Solutions:**
1. Reduce Kd by 50%
2. Implement derivative on measurement (not error)
3. Add derivative filtering

**Derivative on measurement:**
```javascript
// Instead of: D = Kd * d(error)/dt
// Use: D = -Kd * d(measurement)/dt
let lastMeasurement = context.get('lastMeasurement') || measurement;
let dMeasurement = (measurement - lastMeasurement) / dt;
let dTerm = -Kd * dMeasurement;
context.set('lastMeasurement', measurement);
```

### Non-Responsive System

**Symptoms:**
- No response to PID output changes
- Flat PID output
- Battery not engaging

**Check:**
1. Master Switch is "Full Control"
2. Battery limits are reasonable (not 0W)
3. Battery is online and responsive
4. Node-RED flows are deployed
5. No errors in Node-RED debug log

## Advanced Configurations

### Auto-Tuning

Implement automatic PID tuning based on system identification:

**Concept:**
1. Apply step change to system
2. Record response
3. Calculate system model parameters
4. Compute optimal PID gains

**Note:** Requires advanced programming in Node-RED function nodes

### Gain Scheduling

Automatically adjust PID gains based on operating conditions:

**Example scheduling:**
```javascript
// Adjust gains based on battery SoC
let soc = msg.batterySoC;
let Kp_base = 1.5;

if (soc < 20) {
    // Low SoC - less aggressive discharge
    msg.Kp = Kp_base * 0.7;
} else if (soc > 80) {
    // High SoC - less aggressive charge
    msg.Kp = Kp_base * 0.7;
} else {
    // Normal range
    msg.Kp = Kp_base;
}
```

### Feed-Forward Control

Add predictive component based on known disturbances:

**Example:**
```javascript
// Predict battery power needed based on historical consumption
let hourOfDay = new Date().getHours();
let typicalConsumption = getHistoricalAverage(hourOfDay);
let feedForward = typicalConsumption * 0.8;  // 80% compensation

msg.pidOutput = pidCalculation + feedForward;
```

## Documentation and Logging

### Keep Tuning Log

Record all changes systematically:

```
Date: 2025-12-21 14:30
Change: Kp 1.5 → 2.0
Reason: Response too slow during evening consumption
Weather: Cloudy, 5°C
Expected: Faster response, possible oscillations
Monitor: Check for 24h

Date: 2025-12-22 14:30
Result: Response improved, no oscillations observed
MAE: 85W → 62W (improvement)
Decision: Keep change, monitor for 48h more
```

### Export Configuration

Document your final tuned parameters:

```yaml
# My Optimized PID Configuration
# System: 2x Marstek Venus 5kWh
# Inverter: Marstek 3.6kW
# Solar: 6kWp
# Tuned: December 2025

PID_gains:
  Kp: 1.8
  Ki: 0.12
  Kd: 45
  
Performance:
  deadband: 20W
  hysteresis: 25W
  min_idle_time: 120s
  rbe_threshold: 2%
  
Results:
  MAE: 58W
  StdDev: 71W
  Oscillations_per_hour: 6
  Comments: Excellent response to loads, stable overnight
```

## Next Steps

- **Monitor long-term:** Track performance over weeks/months
- **Seasonal adjustment:** Re-tune for summer/winter differences
- **Share results:** Help the community with your tuning data
- **Explore other strategies:** Consider Dynamic for additional savings

## Resources

- **Discord:** `Marstek RS485/Node-Red besturing` - Share tuning results
- **GitHub:** [CSV Analysis Tool](https://github.com/gitcodebob/HA-history-graph-csv-export-analysis)
- **Documentation:** [PID Controller Theory](../reference/pid-controller.md)
- **Wikipedia:** [PID Controller](https://en.wikipedia.org/wiki/PID_controller)
