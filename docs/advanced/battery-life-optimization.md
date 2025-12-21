---
render_with_liquid: false
---

# Battery Life Optimization

Techniques to extend battery lifespan (levensduur thuisaccu) and reduce wear through smart configuration.

## Overview

Home batteries have limited cycle life. These settings help maximize battery longevity without sacrificing too much performance.

## Key Settings

### 1. Minimum Idle Time

**Purpose:** Prevents excessive relay engagement/disengagement

**Default:** 120 seconds (2 minutes)

**How it works:**
- After battery relay engages, it must stay engaged for at least this duration
- Prevents rapid on/off cycling near 0W transitions
- Reduces mechanical relay wear
- Eliminates annoying clicking sounds

**Configuration:** Home Assistant dashboard → Advanced Settings → Minimum Idle Time

**Tuning:**
- **Increase (180-300s)** if:
  - You hear frequent relay clicking
  - Battery has mechanical relays (not solid-state)
  - Consumption frequently crosses 0W
- **Decrease (60-90s)** if:
  - You have solid-state switching
  - Fast response is critical
  - Rarely crosses 0W boundary

### 2. Hysteresis

**Purpose:** Creates deadzone around 0W to prevent mode switching (charge ↔ discharge)

**Default:** 0W (disabled)

**How it works:**
```
Without hysteresis:
+10W → Charging
 -5W → Discharging (switched!)
+10W → Charging (switched again!)

With hysteresis (30W):
+10W → Charging
-5W → Still charging (within 30W band)
-35W → Now discharging (exceeded threshold)
```

**Configuration:** Home Assistant dashboard → Advanced Settings → Hysteresis

**Tuning:**
- **Set 20-50W** for typical systems
- **Higher** (50-100W) if:
  - Consumption is very noisy (many appliances)
  - Relay wear is a concern
  - Precise 0W tracking is not critical
- **Lower** (10-20W) if:
  - Tight control is needed
  - Few appliances, stable consumption
  - Large battery capacity available

### 3. Battery Charge Order

**Purpose:** Distribute wear across multiple batteries

**For multi-battery systems only**

**How it works:**
- System charges batteries in order (1st battery first, then 2nd, etc.)
- By rotating which battery is first, you distribute charge/discharge cycles
- Especially important during partial solar days (first battery takes all the small cycles)

**Auto-Cycle Options:**
- **Daily (02:00)** - Changes order every night
- **Weekly (Sunday 02:00)** - Changes order weekly
- **Never** - Manual order control

**Configuration:** Home Assistant dashboard → Battery Priority settings → Auto Cycle

**Recommendation:**
- Use **Weekly** for balanced wear distribution
- Use **Daily** if one battery consistently gets more cycles
- Use **Never** if you want manual control

**[→ Battery Prioritization Guide](battery-prioritization.md)**

## Additional Protection Measures

### 4. Controller Output Protection

**Software limits built into the system:**
- PID output capped by battery max charge/discharge values
- Prevents overcurrent commands
- Adjusts automatically for available batteries

**Ensure proper configuration:**
1. Set accurate max charge/discharge for each battery
2. Verify limits match battery specifications
3. Consider inverter/circuit limits
4. Test with low values first (≤800W)

### 5. Depth of Discharge Management

**Not directly controllable** by this system, but important:
- Battery BMS manages DoD automatically
- Most systems prevent 0% and 100% extremes
- Marstek typically allows 10-90% usable range (80% DoD)

**What you can do:**
- Don't force charging to 100% constantly
- Allow natural discharge/charge cycles
- Avoid keeping battery at extreme SoC for extended periods

### 6. Temperature Management

**Monitor battery temperature** (if available):
- Optimal operating range: 15-25°C
- Performance degrades below 0°C and above 40°C
- Extreme temperatures accelerate degradation

**Actions:**
- Ensure adequate ventilation
- Consider battery location (avoid hot attics, cold garages)
- Reduce charge/discharge rates in extreme temperatures
- Monitor via `sensor.marstek_battery_X_temperature`

## Performance Settings

### Deadbands

**Purpose:** Reduce control loop activations

**Location:** `02 strategy-self-consumption.json` → Function node `Deadband(15W)`

**Default:** 15W

**Effect:**
- Control loop only runs when error exceeds deadband
- Reduces CPU load
- Prevents micro-adjustments that cause relay cycling
- Minimal impact on performance

**Tuning:** See [PID Tuning Guide](pid-tuning.md#deadband-tuning)

### Report by Exception (RBE)

**Purpose:** Reduce unnecessary Home Assistant calls

**Location:** `01 start-flow.json` → RBE node `'On change (2%)'`

**Default:** 2% change threshold

**Effect:**
- Blocks repeated identical values
- Reduces Home Assistant database load
- Prevents action nodes triggering without actual changes

**Important:** SET MODE action nodes don't use RBE for safety reasons

## Battery Cycle Tracking

### Monitor Your Battery Health

**Track these metrics:**
- Cycles per day
- Average depth of discharge (DoD)
- Total cycles accumulated
- Battery capacity degradation over time

**Create tracking sensors:**
```yaml
template:
  - sensor:
      - name: "Battery Daily Cycles"
        state: >
          {% set charged = states('sensor.battery_charged_today') | float %}
          {% set capacity = 5.0 %}  # Your battery capacity in kWh
          {{ (charged / capacity) | round(2) }}
        unit_of_measurement: "cycles"
        
      - name: "Battery Total Cycles Estimate"
        state: >
          {% set days_in_use = 365 %}  # Adjust to your installation date
          {% set avg_cycles_per_day = 0.8 %}  # Your measured average
          {{ (days_in_use * avg_cycles_per_day) | round(0) }}
        unit_of_measurement: "cycles"
```

## Longevity vs Performance Trade-offs

### Conservative Configuration (Maximum Longevity)

```yaml
Settings:
  min_idle_time: 180s
  hysteresis: 50W
  max_charge_power: 1500W  # Slower charging
  max_discharge_power: 1500W  # Slower discharging
  auto_cycle: weekly
  pid_preset: "Safe"  # Moderate response

Expected:
  relay_cycles_per_day: <10
  battery_cycles_per_day: 0.5-1.0
  grid_tracking: ±30-80W
  battery_lifespan: 20+ years
```

### Balanced Configuration (Good Balance)

```yaml
Settings:
  min_idle_time: 120s
  hysteresis: 30W
  max_charge_power: 2500W
  max_discharge_power: 2500W
  auto_cycle: weekly
  pid_preset: "Safe" or "Regular"

Expected:
  relay_cycles_per_day: 10-20
  battery_cycles_per_day: 0.8-1.5
  grid_tracking: ±20-50W
  battery_lifespan: 15-18 years
```

### Performance Configuration (Maximum Performance)

```yaml
Settings:
  min_idle_time: 60s
  hysteresis: 15W
  max_charge_power: 3600W  # At inverter limit
  max_discharge_power: 3600W
  auto_cycle: daily
  pid_preset: "Regular"  # Fast response

Expected:
  relay_cycles_per_day: 20-40
  battery_cycles_per_day: 1.0-2.0
  grid_tracking: ±10-30W
  battery_lifespan: 12-15 years
```

## Battery Warranty Considerations

**Check your warranty terms:**
- Some warranties specify maximum cycles
- Some specify maximum DoD
- Some warranties void with third-party control

**Common warranty terms:**
- 6000 cycles @ 80% DoD
- 10 years or 80% capacity retention
- Proper temperature range maintained

**Document your usage:**
- Keep logs of cycles and settings
- Monitor degradation
- May be needed for warranty claims

## Cost-Benefit Analysis

### Calculating Optimal Settings

**Example calculation:**

```
Battery cost: €1250
Warranty cycles: 6000 @ 80% DoD
Capacity: 5 kWh

Cost per cycle: €1250 / 6000 = €0.21/cycle
Cost per kWh cycled: €0.21 / (5 × 0.80) = €0.0525/kWh

Daily savings with aggressive use: €2.00
Daily cost at 1.5 cycles/day: €0.315
Net savings: €1.685/day

Payback period: €1250 / (€1.685 × 365) = 2.0 years
```

**Conclusion:** Even aggressive use pays back quickly and provides 10+ years of additional operation beyond payback.

**Conservative use:**
- Lower daily savings (€1.50)
- Much longer battery life (20+ years)
- Similar total lifetime value

## Monitoring Battery Health

### Warning Signs of Degradation

Monitor for:
- ⚠️ Reduced capacity (battery full at lower kWh than specification)
- ⚠️ Increased temperature during operation
- ⚠️ Longer charge times for same energy amount
- ⚠️ Voltage drops under load
- ⚠️ BMS errors or warnings

### Capacity Testing

**Perform quarterly capacity tests:**

1. Fully charge battery (100% SoC)
2. Note starting energy level (if available)
3. Discharge completely (to minimum allowed by BMS)
4. Note total energy discharged
5. Compare to original capacity

**Expected degradation:**
- 2-3% per year is normal
- >5% per year may indicate issues

### When to Be Concerned

**Contact manufacturer if:**
- Capacity drops >20% within warranty period
- Unusual temperature increases
- BMS errors occur
- Physical damage observed
- Performance degrades suddenly

## Best Practices Summary

✅ **Do:**
- Start with conservative settings
- Enable minimum idle time (120s+)
- Use hysteresis (20-50W)
- Enable auto-cycle for multi-battery systems
- Monitor temperature if available
- Track cycles and degradation
- Gradually increase performance if needed

❌ **Don't:**
- Constantly charge to 100% and discharge to 0%
- Ignore high temperature warnings
- Use maximum power limits unless necessary
- Change multiple settings simultaneously
- Forget to monitor after configuration changes
- Operate outside manufacturer specifications

## Related Guides

- **[Battery Prioritization](battery-prioritization.md)** - Multi-battery management
- **[PID Tuning](pid-tuning.md)** - Optimize control performance
- **[Performance Optimization](performance.md)** - System-wide optimizations
- **[Multi-Battery Setup](../guides/multi-battery-setup.md)** - Scaling to multiple batteries

## Next Steps

1. **Configure baseline settings** from "Balanced Configuration" above
2. **Monitor for 1-2 weeks** 
3. **Adjust based on observations**
4. **Document your configuration**
5. **Share results with community**

---

**Questions?** Join Discord: `Marstek RS485/Node-Red besturing`

