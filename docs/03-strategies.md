# Battery Control Strategies

## Quick Reference

| Strategy | Use Case | Setup Required |
|----------|----------|----------------|
| **Self-Consumption** | Maximize solar usage, minimize grid power | [Setup guide](04-setup-self-consumption.md) ⚙️ |
| **Dynamic** | Optimize for hourly energy prices | [Setup guide](05-setup-dynamic.md) ⚙️ |
| **Timed** | Fixed schedule charging/discharging | Dashboard config only |
| **Charge** | Force charge from grid | Dashboard config only |
| **Charge PV** | Charge only from solar surplus | No setup needed |
| **Full Stop** | Disable all battery operations | No setup needed |

Switch strategies anytime via the Home Assistant dashboard.



## Strategy Details

### Self-Consumption (required)
Uses a PID controller to maintain ~0W grid power by continuously adjusting battery charge/discharge. When solar production exceeds consumption, the battery charges. When consumption exceeds production, the battery discharges to cover the difference.

**Note:** this is a core strategy employed by many other strategies and thus mandatory to configure.

**⚙️ Setup required:** PID tuning for optimal performance. See [Self-consumption Setup Guide](04-setup-self-consumption.md).

**Flow:** `02 strategy-self-consumption.json`

---

### Dynamic (Price-based)
Automatically charges during the cheapest hours, uses self-consumption during the most expensive hours (if price delta justifies battery wear), and uses Charge PV during other periods.

**Ideal for:** Dynamic/hourly energy contracts to maximize financial savings.

**⚙️ Setup required:** Cheapest Hours integration and energy supplier configuration. See [Dynamic Strategy Setup Guide](05-setup-dynamic.md).

*Active strategy by period:*

| Period | Active Strategy | Notes |
|--------|-----------------|-------|
| Cheapest hours | Charge | Charge from grid during low-price windows to store energy |
| Most expensive hours | Self-Consumption | Discharge to minimize grid import and save costs |
| Other periods | Charge PV | Only charge from solar surplus, avoid grid charging |

**Flow:** `02 strategy-dynamic.json`

---

### Timed Charging/Discharging
Charge or discharge based on a fixed schedule. Configure time windows through the dashboard (e.g., charge during cheap night rates, discharge during expensive evening rates).

**Ideal for:** Time-of-use tariffs and predictable daily routines.

**Flow:** `02 strategy-timed.json`

---

### Charge (from grid)
Forces charging from grid until batteries reach the capacity indicated by the user.

**Ideal for:** Preparing for power outages or charging before expensive rate periods.

**Flow:** `02 strategy-charge.json`

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
