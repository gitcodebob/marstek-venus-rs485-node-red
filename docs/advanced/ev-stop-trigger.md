---
render_with_liquid: false
---

# EV Stop Trigger

Automatically stop battery operations when electric vehicle (elektrische auto) or other heavy appliances start charging.

## Overview

The EV Stop Trigger overrides ALL active strategies and applies Full Stop when your EV (or configured appliance) is actively charging. This prevents:
- ❌ Grid overload from combined EV + battery charging
- ❌ Excessive power draw during EV charging sessions
- ❌ Battery discharge competing with EV charger demand

## How It Works

**Trigger flow:**
```
1. EV starts charging (sensor turns ON)
2. System detects trigger
3. Override: Apply Full Stop strategy
4. All battery operations cease
5. EV completes charging (sensor turns OFF)
6. System returns to previously selected strategy
```

**Priority:** EV Stop Trigger has **highest priority** and overrides:
- Self-Consumption strategy
- Dynamic strategy
- Timed strategy
- Any other active strategy

## Configuration

### Step 1: Create Trigger Sensor

You need an `input_boolean` or `binary_sensor` that indicates EV charging status.

**Option A: Manual toggle (for testing)**
```yaml
# configuration.yaml
input_boolean:
  ev_charging:
    name: "EV Charging Active"
    icon: mdi:car-electric
```

**Option B: Automatic detection based on power**
{% raw %}
```yaml
# configuration.yaml
template:
  - binary_sensor:
      - name: "EV Charging Active"
        state: >
          {{ states('sensor.ev_charger_power') | float > 1000 }}
        device_class: power
```
{% endraw %}

**Option C: From EV charger integration**
{% raw %}
```yaml
# Many EV charger integrations provide charging status
# Examples:
# - sensor.easee_charger_status
# - sensor.wallbox_charging_status
# - binary_sensor.tesla_charging

# Use directly or create template:
template:
  - binary_sensor:
      - name: "EV Charging Active"
        state: >
          {{ is_state('sensor.easee_charger_status', 'charging') }}
```
{% endraw %}

### Step 2: Configure in Home Assistant

1. Navigate to Home Battery Control dashboard
2. Go to **Advanced Settings** tab
3. Find "EV Stop Trigger" section
4. Enter your sensor's `entity_id` in the text field
   - Example: `input_boolean.ev_charging`
   - Example: `binary_sensor.ev_charging_active`
5. Save configuration

### Step 3: Test the Trigger

**Testing procedure:**
1. Select any strategy (e.g., Self-Consumption)
2. Enable Master Switch → "Full Control"
3. Verify batteries are operating normally
4. Activate trigger sensor:
   - Manual: Toggle input_boolean to ON
   - Automatic: Start EV charging
5. **Verify:** Battery operations stop (check Node-RED debug or HA states)
6. Deactivate trigger sensor
7. **Verify:** System returns to previous strategy

## Use Cases

### Electric Vehicle Charging

**Primary use case:**
- Prevents battery from competing with EV charger
- Avoids grid overload
- Allows full power for fast EV charging

**Typical EV charger power:**
- Level 1 (Standard outlet): 1.4-1.9 kW
- Level 2 (Home charger): 3.6-11 kW
- Level 3 (DC Fast): 50+ kW (not typically home installation)

### Other Heavy Appliances

**Additional applications:**
- Heat pump startup (high inrush current)
- Pool pump operation
- Workshop equipment (table saw, welder, etc.)
- Sauna heater
- Any appliance >3kW that shouldn't combine with battery operations

## Advanced Configuration

### Multiple Trigger Sensors

To trigger on multiple conditions:

```yaml
template:
  - binary_sensor:
      - name: "Battery Stop Trigger"
        state: >
          {{ is_state('input_boolean.ev_charging', 'on')
             or is_state('binary_sensor.heat_pump_defrost', 'on')
             or is_state('binary_sensor.sauna_active', 'on') }}
```

Use `sensor.battery_stop_trigger` as EV Stop Trigger entity.

### Delayed Trigger

Add delay to prevent false triggers:

{% raw %}
```yaml
template:
  - binary_sensor:
      - name: "EV Charging Active Delayed"
        state: >
          {{ is_state('binary_sensor.ev_charging_raw', 'on') }}
        delay_on: "00:00:30"  # 30 second delay before triggering
        delay_off: "00:01:00"  # 1 minute delay before releasing
```
{% endraw %}

**Why delay?**
- Prevents trigger from brief power spikes
- Allows EV charging to stabilize
- Reduces unnecessary strategy switching

### Power Threshold Trigger

Trigger based on total home consumption:

{% raw %}
```yaml
template:
  - binary_sensor:
      - name: "High Power Usage"
        state: >
          {{ states('sensor.house_power_consumption') | float > 5000 }}
        delay_on: "00:00:15"
```
{% endraw %}

**Use case:** Stop batteries when total home consumption exceeds safe limit

## Monitoring

### Create Status Display

**Add to dashboard:**
```yaml
type: entities
entities:
  - entity: binary_sensor.ev_charging_active
    name: "EV Charging"
  - entity: input_text.house_battery_ev_stop_trigger
    name: "Configured Trigger Entity"
  - entity: input_select.house_battery_strategy
    name: "Active Strategy"
  - entity: switch.house_battery_master_switch
    name: "Master Switch"
```

### Notification on Trigger

**Optional automation:**
```yaml
automation:
  - alias: "EV Stop Trigger Activated"
    trigger:
      - platform: state
        entity_id: binary_sensor.ev_charging_active
        to: "on"
    action:
      - service: notify.mobile_app
        data:
          title: "Battery Control Paused"
          message: "EV charging started - batteries in Full Stop mode"
```

## Troubleshooting

### Trigger Not Working

**Check:**
1. Trigger entity exists and is correct entity_id
2. Entity state changes to "on" when expected
3. Master Switch is enabled
4. Node-RED flows deployed
5. No errors in Node-RED debug log

**Debug steps:**
1. Check entity state: Developer Tools → States → Search for your trigger entity
2. Manually toggle trigger entity
3. Watch Node-RED debug panel for trigger messages
4. Verify strategy changes to "Full Stop"

### Batteries Still Operating During Trigger

**Possible causes:**
1. Entity_id incorrectly configured (typo)
2. Entity state is not "on" (check exact state value)
3. Flow not imported or deployed
4. Strategy override not working

**Solutions:**
1. Verify exact entity_id in Advanced Settings
2. Check entity state is boolean "on"/"off" or "true"/"false"
3. Re-import and deploy flows
4. Manually test by setting strategy to Full Stop

### False Triggers

**Symptoms:** Batteries stop unexpectedly

**Causes:**
- Sensor is too sensitive (threshold too low)
- No delay configured
- Sensor includes other appliances

**Solutions:**
- Add delay (30-60 seconds)
- Increase power threshold
- Use more specific sensor (dedicated EV charger status)

### Batteries Don't Resume After EV

**Symptoms:** Trigger releases but batteries stay stopped

**Check:**
1. Master Switch still enabled
2. Previous strategy is still selected
3. No other errors preventing operation

**Solution:**
- Manually verify Master Switch is "Full Control"
- Re-select your desired strategy
- Check Node-RED debug for errors

## Integration with Strategies

### With Self-Consumption

**Behavior:**
- Normal operation: PID maintains near-zero grid power
- EV starts: Full Stop override, grid provides all power
- EV stops: PID resumes control

**Advantage:** Smooth transition, no PID tuning conflicts

### With Dynamic Strategy

**Behavior:**
- Following hourly schedule normally
- EV starts: Override schedule, Full Stop
- EV stops: Resume schedule for current hour

**Advantage:** Doesn't interfere with planned charging/discharging

### With Timed Strategy

**Behavior:**
- Following timed schedule
- EV starts: Pause timed operations
- EV stops: Resume if still within scheduled window

**Advantage:** EV gets priority over scheduled operations

## Best Practices

✅ **Do:**
- Use dedicated EV charger status sensor when available
- Add 30-60 second delay to prevent false triggers
- Test trigger before first real EV charging session
- Monitor first few EV charging sessions
- Create notification automation for visibility

❌ **Don't:**
- Use overly sensitive power thresholds
- Trigger on brief power spikes
- Forget to configure after installation
- Assume it works without testing
- Use manual toggle for automatic operation

## Example Configurations

### Configuration 1: Wallbox Pulsar Plus
```yaml
# Wallbox integration provides status
# No additional template needed
EV Stop Trigger Entity: sensor.wallbox_pulsar_plus_status_description

{% raw %}
# Alternative with binary sensor:
template:
  - binary_sensor:
      - name: "EV Charging Active"
        state: >
          {{ is_state('sensor.wallbox_pulsar_plus_status_description', 'Charging') }}
        delay_on: "00:00:30"
```
{% endraw %}

### Configuration 2: Power-based Detection
{% raw %}
```yaml
template:
  - binary_sensor:
      - name: "EV Charging Active"
        state: >
          {{ states('sensor.ev_charger_power') | float > 2000 }}
        delay_on: "00:00:30"
        delay_off: "00:02:00"
```
{% endraw %}

### Configuration 3: Multiple Appliances
{% raw %}
```yaml
template:
  - binary_sensor:
      - name: "Heavy Load Active"
        state: >
          {{ is_state('binary_sensor.ev_charging', 'on')
             or is_state('binary_sensor.sauna_on', 'on')
             or (states('sensor.house_power') | float > 6000) }}
        delay_on: "00:00:15"
```
{% endraw %}

## Performance Impact

**System behavior during EV charging:**
- Battery draws 0W (stopped)
- Grid provides all power (EV + house consumption)
- No PID oscillations or hunting
- Instant resume when trigger releases

**No negative effects:**
- Battery health unaffected
- Control system stability maintained
- No impact on other Home Assistant operations

## Related Features

- **[Battery Life Optimization](battery-life-optimization.md)** - Reduce wear
- **[Dynamic Strategy](../strategies/dynamic.md)** - Combine with price optimization
- **[Self-Consumption](../strategies/self-consumption.md)** - Standard operation mode

## Next Steps

1. **Create trigger sensor** appropriate for your setup
2. **Configure in Advanced Settings**
3. **Test thoroughly** before first real use
4. **Monitor first sessions**
5. **Adjust delays/thresholds** if needed

---

**Questions?** Discord: `Marstek RS485/Node-Red besturing`

