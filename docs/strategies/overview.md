# Strategy Overview

Home Battery Control supports multiple charging and discharging strategies (thuisaccu strategieën) to optimize your energy usage based on your specific needs and energy contract.

## Available Strategies

### 1. Self-Consumption (PID-Based)
**Most Popular** | Best for: Net metering, maximizing self-sufficiency

Automatically maintains near-zero grid import/export using a PID controller. The system continuously adjusts battery charge/discharge to match your home's power consumption.

- ✅ Maximizes self-consumption of solar energy (zonne-energie)
- ✅ Minimizes grid interaction
- ✅ Highly responsive to consumption changes
- ⚠️ Requires PID tuning for optimal performance

**[→ Self-Consumption Setup Guide](self-consumption.md)**

**When to use:**
- You want to minimize grid power usage
- You have solar panels (zonnepanelen) and want to store excess energy
- Your energy contract charges high rates for grid consumption
- You want the system to respond automatically to power changes

---

### 2. Dynamic Pricing Optimization
**Best for:** Hourly variable energy contracts (dynamic tariffs)

Automatically charges during the cheapest hours and discharges during expensive hours based on your energy supplier's hourly rates.

- ✅ Optimizes for maximum financial savings
- ✅ Automated daily planning
- ✅ Combines with solar charging when beneficial
- ⚠️ Requires Cheapest Hours integration

**[→ Dynamic Strategy Setup Guide](dynamic.md)**

**When to use:**
- You have a dynamic energy contract with hourly rates
- Energy prices vary significantly throughout the day
- You want automated cost optimization
- You want to leverage both cheap grid power and solar energy

---

### 3. Timed Charging/Discharging
**Best for:** Predictable routines, fixed off-peak rates

Charge or discharge batteries at specific times based on your schedule or energy contract time-of-use rates.

- ✅ Simple to configure
- ✅ Predictable behavior
- ✅ No tuning required
- ✅ Perfect for fixed off-peak tariffs

**[→ Timed Strategy Setup Guide](timed.md)**

**When to use:**
- You have fixed off-peak hours (e.g., night rates)
- You want predictable charging times
- Your consumption patterns are consistent
- You want simple time-based automation

---

### 4. Charge (Grid + Solar)
**Best for:** Quickly charging batteries from any source

Simple charging mode that charges batteries from grid and/or solar power at specified power level.

- ✅ Very simple - just set power level
- ✅ Fastest charging option
- ✅ Combines grid and solar power
- ⚠️ May draw significant power from grid

**[→ Charge Mode Guide](charge.md)**

**When to use:**
- You want to quickly charge batteries before expected usage
- Preparing for a known power outage
- Before a period without solar generation
- For testing battery and system functionality

---

### 5. Charge PV (Solar Only)
**Best for:** Storing only solar energy, avoiding grid charging costs

Charges batteries only from solar panel excess power. Will not draw power from the grid.

- ✅ Zero grid charging costs
- ✅ 100% renewable energy storage
- ✅ Automatically adjusts to available solar power
- ⚠️ Slower charging (depends on solar production)

**[→ Charge PV Guide](charge.md#charge-pv-solar-only)**

**When to use:**
- You want to store only solar energy
- Grid electricity is expensive
- You have sufficient solar capacity
- Summer months with high solar production

---

### 6. Full Stop
**Best for:** Disabling battery operations, maintenance

Completely stops all battery charging and discharging operations.

- ✅ Immediate shutdown
- ✅ Safe for maintenance
- ✅ Override for all other strategies
- ✅ Used automatically by EV Stop Trigger

**When to use:**
- Maintenance or troubleshooting
- EV charging (automatic with EV Stop Trigger)
- System testing
- Emergency situations

---

## Strategy Selection Guide

### Decision Tree

```
Do you have a dynamic energy contract with hourly rates?
├─ Yes → Use Dynamic Strategy
└─ No  → Continue...

Do you have solar panels?
├─ Yes → Do you want to minimize ALL grid usage?
│   ├─ Yes → Use Self-Consumption Strategy
│   └─ No  → Do you have off-peak hours?
│       ├─ Yes → Use Timed Strategy (charge during off-peak)
│       └─ No  → Use Self-Consumption Strategy
└─ No  → Do you have off-peak hours?
    ├─ Yes → Use Timed Strategy
    └─ No  → Self-Consumption may still be beneficial
```

### Comparison Table

| Strategy | Automation | Complexity | Solar Required | Dynamic Contract | Cost Savings |
|----------|------------|------------|----------------|------------------|--------------|
| **Self-Consumption** | High | Medium (PID tuning) | Recommended | No | Medium-High |
| **Dynamic** | Very High | Low | Optional | Yes | High |
| **Timed** | Medium | Very Low | No | No | Low-Medium |
| **Charge** | Low | Very Low | No | No | Low |
| **Charge PV** | Medium | Very Low | Yes | No | Medium |
| **Full Stop** | N/A | Very Low | No | No | N/A |

## Combining Strategies

### EV Stop Trigger
Configure EV Stop Trigger to automatically override any active strategy and apply Full Stop when your electric vehicle (elektrische auto) is charging.

**[→ EV Stop Trigger Setup](../advanced/ev-stop-trigger.md)**

### Dynamic Strategy Already Combines Others
The Dynamic strategy automatically uses:
- **Timed charging** during cheapest hours
- **Self-consumption** during expensive hours (if price delta is sufficient)
- **Charge PV** during remaining hours

### Custom Strategy Combinations
Advanced users can create custom strategies that combine multiple approaches.

**[→ Custom Strategy Guide](custom-strategy.md)** (coming soon)

## Strategy-Specific Configuration

Each strategy has its own settings accessible via the Home Assistant dashboard:

### Self-Consumption
- PID gains (Kp, Ki, Kd)
- PID presets (Very Safe, Safe, Regular, Custom)
- Deadband settings
- Hysteresis

### Dynamic
- Energy supplier selection
- Price delta threshold
- Charge/discharge window configuration

### Timed
- Charge start/end times
- Discharge start/end times
- Power levels

### Charge Modes
- Charge power level
- Maximum SoC (State of Charge)

## Performance Optimization

All strategies benefit from:
- **[Battery Life Optimization](../advanced/battery-life-optimization.md)** - Reduce relay wear
- **[Battery Prioritization](../advanced/battery-prioritization.md)** - Multi-battery management
- **[Performance Settings](../advanced/performance.md)** - CPU load optimization

## Getting Started

1. **Install the system:** [Installation Guide](../getting-started/installation.md)
2. **Review safety:** [Safety Guidelines](../getting-started/safety.md)
3. **Choose your strategy** (see decision tree above)
4. **Follow strategy-specific setup guide**
5. **Monitor and optimize**

## Need Help Choosing?

Not sure which strategy fits your situation?

- **Ask the community:** Discord `Marstek RS485/Node-Red besturing`
- **Check examples:** See real-world setups in [Community Showcase](../community/showcase.md)
- **Experiment:** All strategies can be switched easily - try different approaches!

---

**Next Steps:**
- [Self-Consumption Strategy →](self-consumption.md)
- [Dynamic Strategy →](dynamic.md)
- [Timed Strategy →](timed.md)
- [All Charge Modes →](charge.md)
