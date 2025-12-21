---
render_with_liquid: false
---

# Common Issues and Troubleshooting

Solutions to frequently encountered problems with Home Battery Control.

## Installation Issues

### Node-RED Flows Not Deploying

**Symptoms:** Deploy button doesn't work, errors in flow import

**Solutions:**
1. Check Node-RED is running: Settings → Add-ons → Node-RED
2. Verify no JSON syntax errors in imported file
3. Try importing one flow at a time
4. Restart Node-RED: Add-ons → Node-RED → Restart

### Home Assistant Entities Missing

**Symptoms:** Input entities don't appear after configuration

**Solutions:**
1. Check configuration.yaml includes packages: `packages: !include_dir_named packages`
2. Verify YAML syntax: Developer Tools → YAML → Check Configuration
3. Restart Home Assistant: Developer Tools → YAML → Restart
4. Check for entity naming conflicts
5. Review Home Assistant logs: Settings → System → Logs

### Battery Entities Not Found

**Symptoms:** Home Battery Control can't find battery sensors

**Solutions:**
1. Verify ESPHome device is online: Settings → ESPHome
2. Check entity naming matches expected format: `sensor.marstek_battery_X_*`
3. Create template sensors to map your entities: [Hardware Setup](../getting-started/hardware-setup.md#using-different-configurations)
4. Verify Modbus communication: ESPHome → Logs

## Hardware Issues

### No Modbus Communication

**Symptoms:** ESPHome shows Modbus errors, no battery data

**Solutions:**
1. **Check wiring:**
   - Verify A/B polarity (try swapping if unsure)
   - Ensure secure connections
   - Check power to ESPHome device
2. **Verify Modbus settings:**
   - Baud rate (typically 9600 or 19200)
   - Correct slave ID/address
   - Parity setting matches battery
3. **Test with multimeter:**
   - Verify voltage on RS485 lines
   - Check for shorts or breaks
4. **Check ESPHome logs:**
   - Settings → ESPHome → Device → Logs
   - Look for specific error codes

### Intermittent Connection

**Symptoms:** Battery data drops out occasionally

**Solutions:**
1. Check WiFi signal strength
2. Verify stable power supply to ESPHome
3. Use shielded RS485 cable
4. Add termination resistors (120Ω) if long cable runs
5. Check for electromagnetic interference sources

### Wrong Values Reported

**Symptoms:** Battery readings don't match display panel

**Solutions:**
1. Verify correct Modbus register addresses for your battery model
2. Check unit conversions (mA vs A, mV vs V)
3. Verify multipliers in ESPHome configuration
4. Consult battery Modbus documentation
5. Compare with battery manufacturer's app/display

## Control Issues

### System Not Responding

**Symptoms:** Master Switch enabled but nothing happens

**Check:**
1. **Master Switch is "Full Control"** (not just enabled)
2. **Strategy is selected** (not empty/none)
3. **Node-RED flows deployed** and running
4. **Battery limits configured** (not 0W)
5. **P1 sensor reporting values**

**Debug:**
1. Open Node-RED debug panel
2. Check for error messages
3. Verify P1 sensor entity in Developer Tools → States
4. Check battery entity states
5. Review Node-RED logs

### Batteries Not Charging/Discharging

**Symptoms:** Strategy active but no battery power change

**Possible causes:**
1. Battery limits set to 0W
2. Battery already at SoC limits (0% or 100%)
3. Battery in standby/off mode (check battery display)
4. Modbus write commands not working
5. Battery BMS protection engaged

**Solutions:**
1. Verify max charge/discharge settings >0W
2. Check battery SoC is in operable range (10-90%)
3. Ensure battery is in "auto" or "controlled" mode
4. Check ESPHome logs for Modbus write errors
5. Review battery BMS status for faults

### Wrong P1 Values

**Symptoms:** Grid power readings seem incorrect

**Solutions:**
1. **P1 sensor in kW instead of W:**
   {% raw %}
   ```yaml
   # Multiply by 1000
   template:
     - sensor:
         - name: "House Power Watts"
           state: "{{ states('sensor.p1_power_kw') | float * 1000 }}"
           unit_of_measurement: "W"
   ```
   {% endraw %}
2. Verify P1 meter is reporting net power (import - export)
3. Check sensor direction (positive = import, negative = export)
4. Verify entity_id is correct in configuration

## PID Issues

### Oscillations (Rapid Switching)

**Symptoms:** Grid power swings wildly, relay clicking, battery rapidly charging/discharging

**Immediate action:**
1. Reduce Kp by 50%
2. Set Kd = 0
3. Increase deadband to 30-50W
4. Add hysteresis (30W)

**Causes:**
- PID gains too high (especially Kp)
- Derivative term too aggressive
- No deadband configured
- System delays not accounted for

**Long-term solution:**
- Follow [PID Tuning Guide](../advanced/pid-tuning.md)
- Use "Very Safe" or "Safe" preset initially
- Gradually increase performance

### Poor Tracking (Far from 0W)

**Symptoms:** Grid power stays far from target despite battery capacity

**Causes:**
- Kp too low
- Battery limits too restrictive
- Consumption exceeds battery capability
- P1 sensor wrong units

**Solutions:**
1. Gradually increase Kp (0.5 → 1.0 → 1.5)
2. Verify battery max discharge setting is reasonable
3. Check if consumption is within battery capacity
4. Fix P1 sensor units (W not kW)
5. Verify battery is responding to commands

### Integral Windup

**Symptoms:** Large overshoot after disturbances, slow return to target

**Causes:**
- Ki too high
- No integral limits implemented
- Large sustained errors

**Solutions:**
1. Reduce Ki by 50%
2. Verify no stuck states (battery stuck in one mode)
3. Consider resetting integral term on large errors
4. See [Advanced PID Tuning](../advanced/pid-tuning.md#integral-windup)

### No Response to Load Changes

**Symptoms:** System doesn't react when appliances turn on/off

**Check:**
1. Deadband not too large (should be ≤50W)
2. RBE threshold reasonable (≤5%)
3. PID gains not zero
4. P1 sensor updating regularly

**Debug:**
1. Watch P1 sensor value in real-time
2. Check error signal is changing
3. Verify PID output is calculated
4. Check if battery receives commands

## Strategy Issues

### Dynamic Strategy Not Planning

**Symptoms:** No planning shown on dashboard, strategy not switching

**Check:**
1. Energy supplier selected in dropdown
2. Cheapest Hours integration installed and configured
3. Tariff data available from supplier integration
4. Sensors created: `sensor.battery_charge_hours`, `sensor.battery_discharge_hours`

**Debug:**
1. Developer Tools → States → Search "battery_charge_hours"
2. Verify sensor shows list of hours: `[2, 3]`
3. Check energy supplier integration for errors
4. Review Cheapest Hours configuration

**Solution:** [Dynamic Strategy Setup](../strategies/dynamic.md)

### Timed Strategy Not Activating

**Symptoms:** Time window reached but strategy doesn't activate

**Check:**
1. Start/end times configured correctly
2. Current time is within window
3. Master Switch enabled
4. Strategy selected is "Timed"

**Debug:**
1. Node-RED debug panel for strategy messages
2. Verify time comparison logic in timed flow
3. Check time zone settings in Home Assistant

### EV Stop Trigger Not Working

**Symptoms:** Batteries continue operating during EV charging

**Check:**
1. Trigger entity_id correct (no typos)
2. Entity state changes to "on" when EV charges
3. EV Stop Trigger configured in Advanced Settings
4. Flows deployed

**Debug:**
1. Developer Tools → States → Check trigger entity state
2. Manually toggle trigger entity
3. Watch Node-RED debug for trigger messages
4. Verify strategy changes to "Full Stop"

**Solution:** [EV Stop Trigger Setup](../advanced/ev-stop-trigger.md)

## Performance Issues

### High CPU Load

**Symptoms:** Home Assistant or Node-RED using excessive CPU

**Solutions:**
1. Increase deadband (20-50W)
2. Increase RBE threshold (3-5%)
3. Reduce PID calculation frequency
4. Check for infinite loops in custom code
5. Verify recorder excludes high-frequency entities

### Frequent Relay Cycling

**Symptoms:** Battery relay clicks frequently, excessive wear

**Solutions:**
1. Enable Minimum Idle Time (120s+)
2. Add Hysteresis (20-50W)
3. Increase deadband
4. Reduce PID gains (especially Kp)
5. Check for oscillations

**See:** [Battery Life Optimization](../advanced/battery-life-optimization.md)

### Slow Dashboard Response

**Symptoms:** Dashboard takes long to load or update

**Solutions:**
1. Reduce number of history graphs
2. Decrease history display period (24h instead of 7d)
3. Check Home Assistant recorder configuration
4. Verify database not corrupted
5. Consider database maintenance (purge old data)

## Update Issues

### Configuration Lost After Update

**Symptoms:** Settings reset after updating flows

**Prevention:**
1. Backup `house_battery_control_config.yaml` before updates
2. Don't overwrite config file with new version
3. Keep custom settings documented

**Recovery:**
1. Restore from backup
2. Re-enter settings via dashboard
3. Check git history if using version control

### New Flow Conflicts with Old

**Symptoms:** Errors after importing updated flow

**Solutions:**
1. Delete old flow version before importing new
2. Check for duplicate node IDs
3. Clear Node-RED cache: Settings → Node-RED → Restart
4. Fresh import of all required flows

## Error Messages

### "HomeAssistantError: Invalid value for input_number..."

**Full error:** `Invalid value for input_number.house_battery_control_pid_output: 16743 (range -15000.0 - 15000.0)`

**Cause:** PID output exceeds configured limits

**Solutions:**
1. Verify battery max charge/discharge values are correct
2. If your system allows >15kW, increase limits in `house_battery_control.yaml`:
   ```yaml
   input_number:
     house_battery_control_pid_output:
       min: -20000  # Adjust for your system
       max: 20000
   ```
3. Check PID is not producing unrealistic outputs

### "Entity not found: sensor.marstek_battery_X..."

**Cause:** Expected battery sensor doesn't exist

**Solutions:**
1. Verify ESPHome device is online
2. Check sensor naming matches expected format
3. Create template sensors to map your entities
4. Adjust number of batteries in configuration if you have fewer

### "Template error: UndefinedError..."

**Cause:** Template references non-existent entity

**Solutions:**
1. Check entity_id spelling
2. Verify entity exists: Developer Tools → States
3. Check template syntax
4. Ensure entity is available before template runs

## Still Having Issues?

### Get Help

1. **Check documentation:**
   - [Installation Guide](../getting-started/installation.md)
   - [Strategy Guides](../strategies/overview.md)
   - [Advanced Tuning](../advanced/pid-tuning.md)

2. **Community support:**
   - Discord: `Marstek RS485/Node-Red besturing`
   - GitHub Discussions: Ask questions
   - Share your configuration for feedback

3. **Report bugs:**
   - [GitHub Issues](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues)
   - Include: HA version, Node-RED version, error logs, configuration
   - Describe steps to reproduce

### Diagnostic Information to Collect

When asking for help, provide:
- **Home Assistant version**
- **Node-RED version**
- **Battery model and quantity**
- **ESPHome configuration (sanitized)**
- **Error messages** from logs
- **Screenshots** of dashboard or Node-RED flows
- **Configuration files** (remove sensitive data)
- **Steps to reproduce** the issue

### Reset to Defaults

If all else fails:

1. **Backup your configuration**
2. **Disable Master Switch**
3. **Remove all flows from Node-RED**
4. **Fresh import** of latest flows
5. **Clear browser cache**
6. **Restart Home Assistant**
7. **Reconfigure** from scratch following installation guide

---

**Need more help?** Join our community on Discord: `Marstek RS485/Node-Red besturing`

