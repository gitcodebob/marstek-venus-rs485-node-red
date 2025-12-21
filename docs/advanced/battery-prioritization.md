---
render_with_liquid: false
---

# Battery Prioritization

Configure charge order and automatic cycling for multi-battery systems (meerdere batterijen).

## Overview

For systems with multiple home batteries, prioritization determines which battery gets charged first. This is important for:
- ✅ Distributing wear across batteries
- ✅ Optimizing battery lifespan
- ✅ Handling partial charge/discharge cycles during variable solar production

## How Charge Order Works

**Sequential charging:**
```
Priority order: Battery 1 → Battery 2 → Battery 3 → Battery 4

Charging process:
1. System charges Battery 1 first until target SoC reached
2. Then charges Battery 2 until target SoC reached
3. Then charges Battery 3 until target SoC reached
4. Finally charges Battery 4

Discharging process:
1. System discharges Battery 1 first
2. Then Battery 2, then 3, then 4
```

## Why Priority Matters

### Problem: Uneven Wear

**Without rotation:**
- Battery 1 gets charged/discharged on every small solar variation
- Batteries 2-4 only engage during larger cycles
- Battery 1 accumulates significantly more cycles
- Battery 1 degrades faster, reducing overall system capacity

**With rotation:**
- Different battery takes the "first position" each day/week
- Wear distributes evenly across all batteries
- All batteries age at similar rate
- System maintains full capacity longer

### Example Scenario

**Cloudy day with variable solar (without rotation):**
```
10:00 - Small solar surplus  → Battery 1 charges +200Wh
10:30 - Cloud passes         → Battery 1 discharges -200Wh
11:00 - Sun returns          → Battery 1 charges +300Wh
11:30 - Cloud passes         → Battery 1 discharges -300Wh
... repeat 10 times throughout day

Battery 1: 10 micro-cycles
Batteries 2-4: 0 cycles (never reached)
```

**With weekly rotation:**
```
Week 1: Battery 1 takes micro-cycles
Week 2: Battery 2 takes micro-cycles
Week 3: Battery 3 takes micro-cycles
Week 4: Battery 4 takes micro-cycles

After 4 weeks: All batteries have similar cycle counts
```

## Configuration

### Manual Priority Setting

**Via Home Assistant dashboard:**
1. Navigate to Home Battery Control dashboard
2. Find "Battery Priority" section
3. Tap on "Charge this battery first" glance card
4. Rearrange batteries by dragging
5. Order is automatically saved

**Priority order determines:**
- Which battery charges first
- Which battery discharges first
- Distribution of partial cycles

### Auto-Cycle Feature

**Automatic priority rotation:**
- System automatically changes battery order periodically
- Ensures even wear distribution
- No manual intervention needed

**Auto-cycle modes:**

| Mode | Timing | Best For |
|------|--------|----------|
| **Daily** | Every night at 02:00 | Variable weather with many micro-cycles |
| **Weekly** | Sunday morning at 02:00 | Most installations (recommended) |
| **Never** | Manual control | Specific use cases, testing |

**Configuration:** Home Assistant dashboard → Battery Priority → Auto Cycle dropdown

### Recommended Settings

**For most users:**
```yaml
Auto Cycle: Weekly
Cycle Day: Sunday
Cycle Time: 02:00

Reason: 
- Balances wear without excessive rotation
- Changes during low-consumption period
- Predictable pattern for monitoring
```

**For highly variable solar:**
```yaml
Auto Cycle: Daily
Cycle Time: 02:00

Reason:
- Frequent micro-cycles from weather variations
- Distributes wear more evenly
- Good for coastal/mountain climates
```

**For manual control:**
```yaml
Auto Cycle: Never

Use cases:
- Testing specific battery
- One battery has different capacity
- Troubleshooting battery issues
- Preparing battery for maintenance
```

## Advanced Scenarios

### Batteries with Different Capacities

**If you have mixed battery sizes:**

**Option 1: Rotate all batteries equally**
- Let auto-cycle rotate through all
- Larger battery will handle more energy but same number of cycles

**Option 2: Manual priority by capacity**
- Set Auto Cycle: Never
- Place largest capacity first permanently
- Smaller batteries act as overflow
- Less even wear distribution

**Recommendation:** Option 1 (rotation) is usually better for longevity

### New Battery Added to Existing System

**Scenario:** You add a new battery to system with older batteries

**Approach:**
1. Disable auto-cycle temporarily
2. Set new battery as **last priority** for first month
3. Older batteries continue their rotation
4. After one month, include new battery in rotation

**Reason:** Allows new battery to "catch up" in cycles without being subjected to all micro-cycles immediately

### Battery Maintenance Mode

**Preparing one battery for maintenance:**

1. Manually move target battery to **last position**
2. Set Auto Cycle: Never
3. Allow battery to naturally discharge through use
4. System relies on other batteries
5. Disconnect battery when sufficiently discharged
6. Re-enable auto-cycle after reconnecting

## Monitoring Priority

### Track Battery Statistics

**Create monitoring dashboard:**
- Daily cycles per battery
- Total energy cycled per battery
- SoC distribution across batteries
- Engagement frequency per battery

**Example sensors:**
{% raw %}
```yaml
template:
  - sensor:
      - name: "Battery 1 Daily Cycles"
        state: >
          {% set charged = states('sensor.battery_1_charged_today') | float %}
          {{ (charged / 5.0) | round(2) }}  # 5.0 = battery capacity
        unit_of_measurement: "cycles"
        
      - name: "Battery 1 Total Energy Cycled"
        state: >
          {% set total = states('sensor.battery_1_lifetime_charged') | float %}
          {{ total | round(1) }}
        unit_of_measurement: "kWh"
```
{% endraw %}

**Review monthly:**
- Compare cycles across all batteries
- Verify rotation is working
- Adjust auto-cycle frequency if needed

### Priority Change Notifications

**Optional automation to track changes:**
{% raw %}
```yaml
automation:
  - alias: "Battery Priority Changed"
    trigger:
      - platform: state
        entity_id: input_text.house_battery_priority_order
    action:
      - service: notify.mobile_app
        data:
          title: "Battery Priority Rotated"
          message: "New order: {{ states('input_text.house_battery_priority_order') }}"
```
{% endraw %}

## 3-Phase Systems

**Special consideration for 3-phase configurations:**
- Each phase typically has dedicated battery
- Priority order less relevant (batteries don't share load)
- Each phase operates independently

**Configuration for 3-phase:**
- Assign one battery per phase permanently
- Disable auto-cycle (Not applicable)
- See [3-Phase Configuration Guide](../guides/3-phase-configuration.md)

## Troubleshooting

### Auto-Cycle Not Working

**Check:**
1. Auto Cycle setting is not "Never"
2. Current time matches cycle time (02:00 default)
3. Home Assistant automations are enabled
4. No errors in Home Assistant logs

**Debug:**
- Check automation: Settings → Automations → Search "battery cycle"
- Manually trigger automation for testing
- Verify priority order changes after trigger

### Uneven Battery Usage

**Symptoms:** One battery consistently has more cycles despite rotation

**Possible causes:**
1. Battery has lower capacity (reaches full sooner)
2. BMS thresholds differ between batteries
3. One battery responds slower (always "available" for small cycles)
4. Physical/electrical connection differences

**Solutions:**
1. Verify all batteries have same specifications
2. Check BMS settings across batteries
3. Test each battery individually
4. Contact manufacturer if persistent imbalance

### Battery Stuck in Priority

**Symptoms:** Same battery always first despite auto-cycle

**Check:**
1. Auto-cycle is enabled
2. Automation is running (check last triggered time)
3. Input entity is not manually overridden
4. No errors in automation

**Solution:**
- Manually change order via dashboard
- Re-enable auto-cycle
- Check automation runs successfully

## Performance Impact

### Does Priority Affect Performance?

**No significant impact:**
- Control loop operates normally regardless of priority
- Total system capacity unchanged
- Response time virtually identical

**Slight differences:**
- First battery may respond marginally faster (already engaged)
- Negligible effect on grid power tracking
- No noticeable difference in daily operation

## Integration with Other Features

### Combined with Self-Consumption

Priority order works seamlessly with self-consumption strategy:
- PID controller commands total battery power needed
- System distributes load according to priority
- First battery takes full load until limit, then next battery engages

### Combined with Dynamic Strategy

Dynamic strategy respects priority:
- During charge periods: Fills batteries in order
- During discharge periods: Depletes batteries in order
- Optimal for distributing wear during scheduled operations

### Combined with Battery Life Settings

Works together with:
- Minimum idle time (applied per battery)
- Hysteresis (applied to system total)
- Max charge/discharge (per battery individual limits)

**[→ Battery Life Optimization](battery-life-optimization.md)**

## Best Practices

✅ **Do:**
- Enable auto-cycle (weekly for most users)
- Monitor battery statistics monthly
- Verify rotation is occurring
- Keep batteries of same model/capacity when possible
- Document any manual changes

❌ **Don't:**
- Constantly change priority manually (defeats auto-cycle)
- Mix batteries of very different capacities without consideration
- Ignore persistent imbalances in usage
- Disable auto-cycle without specific reason

## Configuration Examples

### Standard 2-Battery System
```yaml
Number of batteries: 2
Auto Cycle: Weekly
Cycle Day: Sunday
Cycle Time: 02:00
Priority Order: Battery 1 → Battery 2 (rotates weekly)
```

### 4-Battery High-Solar System
```yaml
Number of batteries: 4
Auto Cycle: Daily  # Variable weather causes many micro-cycles
Cycle Time: 02:00
Priority Order: Rotates daily through all 4 batteries
```

### 3-Battery with Maintenance
```yaml
Number of batteries: 3
Auto Cycle: Never  # Temporarily disabled
Priority Order: Battery 2 → Battery 3 → Battery 1 (last)
# Battery 1 being prepared for maintenance
# Will re-enable weekly cycle after maintenance
```

## Next Steps

- **Configure your priority:** Set auto-cycle to weekly
- **Monitor for one month:** Verify rotation is occurring
- **Review battery statistics:** Check for even distribution
- **Optimize other settings:** [Battery Life Optimization](battery-life-optimization.md)

---

**Questions?** Discord: `Marstek RS485/Node-Red besturing`

