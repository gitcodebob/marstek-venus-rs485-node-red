---
layout: default
title: Control Strategies
nav_order: 3
---

# Battery Control Strategies

## Quick Reference

| Strategy | Use Case | Setup Required |
|----------|----------|----------------|
| **Self-Consumption** | Maximize solar usage, minimize grid power | [Setup guide](04-setup-self-consumption.md) ⚙️ |
| **Dynamic** | Optimize for hourly energy prices | [Setup guide](05-setup-dynamic.md) ⚙️ |
| **Timed** | Fixed schedule charging/discharging | Dashboard config only |
| **Charge** | Force charge from grid | Dashboard config only |
| **Sell** | Discharge to grid for profit | Dashboard config only |
| **Charge PV** | Charge only from solar surplus | No setup needed |
| **Full Stop** | Disable all battery operations | No setup needed |

Switch strategies anytime via the Home Assistant dashboard.



## Strategy Details

### Self-Consumption (mandatory)
Uses a PID controller to maintain ~0W grid power by continuously adjusting battery charge/discharge. When solar production exceeds consumption, the battery charges. When consumption exceeds production, the battery discharges to cover the difference.

**Note:** This core strategy is used internally by other strategies but can also be selected directly. It is thus mandatory to configure. 

**⚙️ Setup required:** PID tuning for optimal performance. See [Self-consumption Setup Guide](04-setup-self-consumption.md).

**Flow:** `02 strategy-self-consumption.json`

---

### Dynamic (Price-based)
Automatically selects strategies based on energy prices throughout the day. You can configure which strategy to use during cheapest hours, expensive hours, and regular periods.

**Ideal for:** Dynamic/hourly energy contracts to maximize financial savings.

**⚙️ Setup required:** Cheapest Hours integration and energy supplier configuration. See [Dynamic Strategy Setup Guide](05-setup-dynamic.md).

*Configurable strategy by period:*

| Period | Available Strategies | Default |
|--------|---------------------|----------|
| Regular hours | Charge PV, Self-consumption, Full stop | Charge PV |
| Cheapest hours | Charge, Charge PV | Charge |
| Expensive hours | Self-consumption, Sell | Self-consumption |

**Smart activation:** Cheapest period only activates when tariff is below threshold. Expensive period only activates when price spread exceeds minimum delta.

**Flow:** `02 strategy-dynamic.json`

---

### Timed Charging/Discharging
Charge or discharge based on a fixed schedule. Configure time windows through the dashboard (e.g., charge during cheap night rates, discharge during expensive evening rates).

**Ideal for:** Time-of-use tariffs and predictable daily routines.

**Flow:** `02 strategy-timed.json`

---

### Charge (from grid)
Charges batteries from the grid. You can configure when to start and stop charging based on battery State of Charge (SoC) or Energy level (kWh).

**Power options:**
- **Maximum power:** Charges at full battery capacity for fastest charging
- **Regulated power:** Uses PID-controller to charge at a controlled rate, useful to prevent overloading your grid connection. Require battery specific charging limits? Review the settings tab.

**Ideal for:** Preparing for power outages or charging before expensive rate periods.

**🔧 Settings:** [video explainer charge settings](https://www.youtube.com/watch?v=UbeJaRjFK_o&t=193s) (on YouTube)
- This video is a bit dated, but gives an idea.

**Flow:** `02 strategy-charge.json`

---

### Sell (Discharge to grid)
Discharges batteries to the grid for profit during high electricity prices. You can configure when to start and stop based on battery State of Charge (SoC) or Energy levels (kWh).

**Power options:**
- **Maximum power:** Discharges at full battery capacity for maximum export
- **Regulated power:** Uses PID-controller to discharge at a controlled rate

**Ideal for:** Selling stored energy during peak price periods or when compensated for grid export.

**Dashboard settings:**
- Stop discharge when: all have reached their minimum state of charge (SoC)
- Stop discharge at: average SoC percentage over all batteries (per battery SoC limits are stil obeyed)
- Stop discharge at: Energy kWh (avoid depleting battery completely)
- Choose maximum or regulated power mode

**Flow:** `02 strategy-sell.json`

---

### Charge PV (Solar-Only)
Charges batteries only from solar surplus. Never draws from grid for charging. PV stands for Photo Voltaic aka 'solar panels'

**Ideal for:** Maximizing free solar energy without grid charging costs.

**Flow:** `02 strategy-charge-pv.json`

---

### Full Stop
Completely stops all battery operations.

**Ideal for:** Maintenance, testing, or emergency situations.

**Flow:** `02 strategy-full-stop.json`
