# Battery Control Strategies

Home Battery Control supports multiple charging and discharging strategies to match different needs and energy scenarios. Each strategy has its own Node-RED flow that can be imported and activated through the Home Assistant dashboard.

## Available Strategies

### Self-Consumption (PID-based)
**When to use:** Maximize self-consumption of solar energy while keeping grid usage near zero

**How it works:** Uses an advanced PID controller to continuously adjust battery charge/discharge to maintain close to 0W grid power. When you produce more solar than you consume, excess energy charges the battery. When you consume more than you produce, the battery discharges to cover the difference.

**Best for:**
- Homes with solar panels
- Minimizing grid dependency
- Optimizing self-sufficiency
- Dynamic household consumption patterns

**Setup:** Requires PID tuning for optimal performance. See [Self-consumption Setup](04-setup-self-consumption.md) for detailed configuration.

**Node-RED Flow:** `02 strategy-self-consumption.json`

---

### Dynamic (Price-based)
**When to use:** You have a dynamic energy contract with hourly changing prices

**How it works:** Automatically charges batteries during the cheapest 2 hours of the day, uses self-consumption during the most expensive 4 hours (if price delta justifies battery wear), and uses Charge PV during other periods to capture surplus solar.

**Best for:**
- Dynamic/hourly energy contracts
- Maximizing financial savings
- Automated price-responsive control
- Users with variable energy rates

**Setup:** Requires Cheapest Hours integration and energy supplier data. See [Dynamic Strategy Setup](05-setup-dynamic.md) for details.

**Node-RED Flow:** `02 strategy-dynamic.json`

---

### Timed Charging/Discharging
**When to use:** Fixed schedule based on predictable patterns or time-of-use tariffs

**How it works:** Charge or discharge batteries according to a predefined schedule. Set specific times for charging (e.g., cheap night rates) and discharging (e.g., expensive evening rates).

**Best for:**
- Time-of-use energy tariffs
- Predictable daily routines
- Simple scheduled control
- Users who want set-and-forget operation

**Setup:** Configure charge and discharge time windows through the Home Assistant dashboard.

**Node-RED Flow:** `02 strategy-timed.json`

---

### Charge (Simple Charge Mode)
**When to use:** You want to actively charge batteries regardless of solar production

**How it works:** Forces batteries to charge from the grid at maximum configured charge power until they reach full capacity.

**Best for:**
- Preparing for expected power outages
- Charging before expensive rate periods
- Manual control scenarios
- Emergency preparation

**Setup:** Set max charge power via dashboard and activate the strategy.

**Node-RED Flow:** `02 strategy-charge.json`

---

### Charge PV (Solar-Only Charging)
**When to use:** You only want to charge batteries from solar surplus, never from grid

**How it works:** Batteries charge only when solar production exceeds household consumption. No grid power is used for charging.

**Best for:**
- Maximizing free solar energy use
- Avoiding grid charging costs
- Environmentally conscious operation
- Homes with sufficient solar capacity

**Setup:** No specific configuration needed. The controller automatically detects solar surplus.

**Node-RED Flow:** `02 strategy-charge-pv.json`

---

### Full Stop
**When to use:** Temporarily disable all battery operations

**How it works:** Completely stops all charging and discharging. Batteries remain idle and disconnected from control.

**Best for:**
- System maintenance
- Testing other equipment
- Emergency situations
- Debugging issues

**Setup:** Simply select this strategy to deactivate battery control.

**Node-RED Flow:** `02 strategy-full-stop.json`

---

## Custom Strategies

You can create your own strategies by:
1. Duplicating an existing strategy flow
2. Modifying the logic to suit your needs
3. Saving with a new name (e.g., `02 strategy-custom.json`)

See the `node-red/examples/` directory for advanced strategy patterns and examples.

## Switching Strategies

Strategies can be changed at any time through the Home Assistant dashboard:
1. Go to the Home Battery Control dashboard
2. Ensure Master Switch is in "Full Control" mode
3. Select your desired strategy from the dropdown
4. The system will immediately switch to the new strategy

> **Note:** Some strategies like Self-Consumption and Dynamic have additional setup requirements. Make sure to complete the setup documentation before activating these strategies.
