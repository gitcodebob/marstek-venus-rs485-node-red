---
render_with_liquid: false
---

# Safety Guidelines

**Essential safety information for home battery control (thuisaccu besturing)**

## ⚠️ Important Disclaimer

You are responsible for configuring and operating your system safely. Monitor carefully. Be prepared to switch off battery control or physically disconnect batteries at any time.

## Before Activating Control

### 1. Verify P1 Sensor Units

**Critical:** The P1 power sensor must report in Watts (W), not kilowatts (kW).

```yaml
# ✅ Correct - sensor reports in Watts
sensor.house_power: 1234 W

# ❌ Incorrect - sensor reports in kilowatts
sensor.house_power: 1.234 kW
```

If your meter provides kW, multiply by 1000:
```yaml
template:
  - sensor:
      - name: "House Power Watts"
        state: "{{ states('sensor.house_power_kw') | float * 1000 }}"
        unit_of_measurement: "W"
```

### 2. Start with Conservative Settings

**First-time setup:**
- ✅ Test in **800W mode** (max charge/discharge)
- ✅ Use "Very Safe" PID preset
- ✅ Monitor for at least 24 hours
- ❌ Do NOT start with maximum battery power limits

**Why 800W?**
- Safe for standard household circuits
- Allows monitoring system behavior without risk
- Easy to physically disconnect if needed

### 3. Set Battery Limits Correctly

Configure maximum charge and discharge power for each battery:

1. Check your battery specifications
2. Set limits via Home Assistant dashboard (click battery glance cards)
3. **Never exceed manufacturer specifications**
4. Consider electrical installation limits (circuits, fuses, breakers)

Example limits:
- Small system (2-3 kWh): 800-1500W
- Medium system (5-10 kWh): 2000-3000W
- Large system (10+ kWh): 3000-5000W

### 4. Consult Professional Electrician

**Always consult a licensed electrician when:**
- Going above 800W continuous power
- Installing 3-phase systems
- Connecting multiple batteries
- Modifying electrical installations
- Uncertain about safety margins

## During Operation

### Monitor Your System

**First week:**
- Check system behavior daily
- Monitor PID response to appliances (coffee machine, washing machine, dryer)
- Watch for oscillations or instability
- Verify battery relay engagement/disengagement

**Warning signs:**
- Rapid charge/discharge switching
- Excessive relay clicking
- Battery temperature increases
- Unexplained grid power spikes

### Emergency Shutdown

**Be prepared to:**
1. Switch Master Switch to "OFF" in Home Assistant dashboard
2. Manually switch battery to "standby" or "off" mode
3. Physically disconnect battery if necessary

**Emergency procedure:**
1. Home Assistant → Dashboard → Master Switch → OFF
2. Battery display panel → Set to Standby/Off
3. If unresponsive: Circuit breaker → OFF

## Common Hazards

### 1. High-Power Appliances

Devices that can cause rapid power changes:
- ☕ Coffee machines (1500-2400W)
- 🔥 Induction cooktops (2000-3500W)
- 🧺 Washing machines, dryers (2000-3000W)
- 💇 Hair dryers, straighteners (1500-2200W)
- 🔌 Electric heaters (1000-3000W)
- 🚗 EV chargers (3600W+)

**Recommendation:**
- Start with low PID gains when testing with these appliances
- Use [EV Stop Trigger](../advanced/ev-stop-trigger.md) for EV charging
- Monitor first cycles of high-power appliances

### 2. System Instability (Oscillations)

PID controller oscillations can cause:
- Excessive relay wear
- Battery stress
- Grid connection instability

**If system oscillates:**
1. Immediately reduce Kp gain
2. Set Ki and Kd to 0 temporarily
3. See [PID Tuning Guide](../advanced/pid-tuning.md) for proper tuning

### 3. Relay Wear

Frequent charge/discharge switching wears battery relays:

**Protection measures:**
- Enable Minimum Idle Time (default 120 seconds)
- Configure Hysteresis deadband (default 15W)
- Use appropriate PID gains to prevent oscillation

See [Battery Life Optimization](../advanced/battery-life-optimization.md)

### 4. Over-Current Protection

**Software protections:**
- Controller output capped by battery max charge/discharge settings
- Flow validation checks battery limits before sending commands

**Hardware protections (verify these exist):**
- Battery BMS (Battery Management System)
- Circuit breakers
- Fuses rated for maximum power

## Multi-Battery Systems

Additional safety considerations:
- Each battery should have individual over-current protection
- Verify all batteries are same model/specifications
- Configure each battery's limits individually
- See [Multi-Battery Setup Guide](../guides/multi-battery-setup.md)

## 3-Phase Systems

**Extra precautions:**
- Professional electrician **required**
- Verify phase balance
- Ensure proper grounding
- Individual protection per phase

See [3-Phase Configuration Guide](../guides/3-phase-configuration.md)

## Grid Connection Safety

### Net Metering

Most residential installations allow bidirectional power flow (import/export from grid).

**Verify with your utility provider:**
- Maximum export power allowed
- Grid connection agreement terms
- Required safety equipment
- Notification requirements

### Grid Disconnection

**System behavior during grid outage:**
- Standard setup: Battery system disconnects (per regulations)
- Off-grid mode: Requires additional equipment and configuration
- **This project does NOT provide off-grid control**

## Data Privacy

The system logs:
- Power consumption patterns
- Battery charge/discharge cycles
- Home Assistant entity states

**Recommendations:**
- Keep Home Assistant instance secure (HTTPS, authentication)
- Regular backups of configurations
- Be aware of data retention in Home Assistant recorder

## Maintenance Safety

### Regular Checks

**Monthly:**
- Verify battery connection integrity
- Check for unusual heat or noise
- Review error logs in Node-RED and Home Assistant

**Quarterly:**
- Test emergency shutdown procedure
- Verify battery firmware is up to date
- Check electrical connections (power off first!)

**Annually:**
- Professional inspection recommended
- Review and update safety procedures
- Test backup power scenarios

### Updates and Changes

**Before updating:**
1. Review [Release Notes](../../RELEASE_NOTES.md)
2. Backup current configuration
3. Test updates in limited mode first
4. Monitor for 24-48 hours after update

See [Updating Guide](../guides/updating.md)

## Legal and Warranty

- ⚠️ Modifying battery control may void warranties
- Check manufacturer terms before implementing
- Verify compliance with local electrical codes
- Maintain documentation of all changes

## When in Doubt

**Stop and ask:**
- Discord community: `Marstek RS485/Node-Red besturing`
- GitHub Issues: [Report concerns](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues)
- Licensed electrician for electrical questions
- Battery manufacturer for hardware questions

## Summary Checklist

Before activating Full Control:

- [ ] P1 sensor verified in Watts (not kW)
- [ ] Battery limits set correctly (start ≤800W)
- [ ] Emergency shutdown procedure understood
- [ ] PID preset set to "Very Safe"
- [ ] Monitoring plan in place (first 24-48 hours)
- [ ] Professional electrician consulted (if >800W)
- [ ] Manufacturer warranty implications understood
- [ ] Grid connection requirements verified

**Remember:** Safety first. Start conservative. Monitor carefully. Scale gradually.

---

**Next:** [Choose Your Strategy](../strategies/overview.md) | [Return to Installation](installation.md)

