# Troubleshooting

## Debug Dashboard (Insights)

The debug dashboard provides real-time insight into your battery control system's decision-making process, without having to scroll through Home Assistant and Node-RED. Use it to understand why your system behaves a certain way or to diagnose issues. 

### Note: more an insights tool than a debug tool
It shows *known issues*, but is not a full debug tool. Unforseen crashes still require inspection via Node-RED. Also de Node-RED logs can be useful, e.g. `http://homeassistant.local:8123/hassio/addon/******_nodered/logs`

### How to Use Debug Mode

1. **Activate:** Navigate to the Debug tab in your Home Assistant dashboard and toggle **Debug Mode** on via the chip in the top
1. **Monitor:** The system will immediately start logging detailed information about:
   - Which strategy flows are executing and in what order
   - How long each flow takes to complete (in seconds)
   - Why batteries are being charged, discharged, skipped, or stopped
   - Price comparisons for dynamic strategies
   - PID controller calculations and decisions
1. **Disable:** when done or to review the state in calm and quiet.
1. **Auto-disable:** Debug mode automatically turns off after 5 minutes to prevent performance degradation.

### What You'll See

**Flow Trace (Execution Timeline)**
- Shows which Node-RED flows executed, in order, with timestamps (HH:MM:SS.mmm)
- Displays total execution time at the bottom
- Use this to verify your strategy is executing as expected

**Log Messages (Detailed Explanations)**
- Color-coded by severity: 🔧 Log (green), ℹ️ Info (teal), ⚠️ Warning (orange), ❌ Error (red)
- Shows up to 100 recent log entries
- Each entry includes: timestamp, flow name, node name, and explanation

### Common Troubleshooting Scenarios

**"Why isn't my battery charging/discharging?"**
- Enable debug mode and wait for one execution cycle
- Check the log for messages about your specific battery (e.g., "Battery M1")
- Look for skip reasons: SoC limits reached, RS485 not enabled, or strategy conditions not met

**"Why did the strategy switch?"**
- Check the log for strategy switching messages
- For dynamic strategy: look for price delta comparisons showing whether the threshold was met
- For timed strategy: verify current time falls within configured periods

**"System seems slow or unresponsive"**
- Check the Flow Trace total execution time
- Normal execution: < 0.5 seconds
- Slow execution: 0.5 - 1.0 seconds (review system load)
- Very slow: > 1.0 seconds (check Node-RED CPU usage and network connectivity)
    - Or lower the rate limit on the `Home Battery Start` flow using the `msg/s` nodes in the Rate Limit group

**"PID controller acting erratically"**
- Enable debug mode during active control
- Review PID-related log entries showing input error, P-term, I-term, D-term values
- Check for messages about deadband or hysteresis affecting behavior
- Verify grid power sensor is updating correctly (check timestamps, the interval should be regular steps of > 0.5 sec.)

## Other Common Issues

### The controller barely responds and (dis)charges only with a few Watts
**Answer:** Check if the P1 input is in Watt and not in kW.

### I get an error `"HomeAssistantError: Invalid value for input_number.house_battery_control_pid_output: 16743 (range -15000.0 - 15000.0)"`
**Answer:** 
- Check battery max (dis)charge values. Are these correct?
- If your converter/batteries allows over 15kW of charging, adjust the limits in `home assistant\input_numbers\input_number_house_battery_control.yaml`

### Modbus error function code: 0x3 exception: 2 (or similar)
When connecting LilyGo or similar to Marstek Venus V3 
**Answer:** 
- Update the latest firmware on your battery