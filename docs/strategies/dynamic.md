---
render_with_liquid: false
---

# Dynamic Pricing Strategy

The dynamic pricing strategy (dynamische prijzen strategie) automatically optimizes battery charging and discharging based on hourly energy prices from your dynamic energy contract.

## Overview

**Best for:** Users with dynamic/hourly variable energy contracts

The system automatically:
- ✅ Charges during the **cheapest 2 hours** of the day
- ✅ Discharges (self-consumption) during **most expensive 4 hours** if price delta is sufficient
- ✅ Uses solar-only charging (Charge PV) during remaining hours
- ✅ Updates daily with new price data

## How It Works

### Daily Planning

The strategy creates a 24-hour plan based on your energy supplier's hourly tariffs:

1. **Fetch tariff data** from your energy supplier (via Cheapest Hours integration)
2. **Identify cheapest hours** for charging
3. **Identify expensive hours** for self-consumption (if beneficial)
4. **Schedule operations** throughout the day
5. **Update automatically** when new tariff data becomes available

### Price Delta Threshold

The system only activates self-consumption during expensive hours if the **price difference** justifies battery cycling costs.

**Default threshold:** €0.06/kWh

**Example calculation:**
- Cheap hour price: €0.05/kWh
- Expensive hour price: €0.15/kWh
- Price delta: €0.10/kWh
- Threshold: €0.06/kWh
- **Result:** ✅ Delta sufficient, self-consumption active during expensive hours

**Why price delta matters:**
- Battery round-trip efficiency ~80% (energy lost in conversion)
- Battery wear/degradation costs
- Price delta must cover these costs to be profitable

**Calculating your threshold:**
```
Threshold = (Battery cost / Cycles / DoD / RTE) / Battery capacity

Example (Marstek):
- Battery cost: €1250
- Cycles: 6000
- DoD (Depth of Discharge): 88%
- RTE (Round-Trip Efficiency): 80%
- Capacity: 5 kWh

Threshold = (1250 / 6000 / 0.88 / 0.80) / 5 = €0.059/kWh ≈ €0.06/kWh
```

## Prerequisites

### Required Integrations

1. **Cheapest Hours (HACS)**
   - Install from HACS (Home Assistant Community Store)
   - [Installation guide](https://github.com/TheFes/cheapest-energy-hours#how-to-install)

2. **Energy Supplier Data Provider**
   - Provides hourly tariff data to Home Assistant
   - See [Data Provider Setup](#data-provider-setup) below

3. **Home Battery Control**
   - [Installation completed](../getting-started/installation.md)
   - [Safety guidelines reviewed](../getting-started/safety.md)

## Setup Guide

### Step 1: Install Cheapest Hours

1. Open HACS in Home Assistant
2. Search for "Cheapest Energy Hours"
3. Install integration
4. Restart Home Assistant

**Official guide:** [TheFes/cheapest-energy-hours](https://github.com/TheFes/cheapest-energy-hours#how-to-install)

### Step 2: Configure Energy Supplier Data

Choose your energy supplier and install the appropriate integration:

#### Popular Dutch Energy Suppliers

| Supplier | Integration | Installation |
|----------|-------------|--------------|
| **ANWB Energie** | ANWB Energie | [HACS](https://github.com/TimSoethout/anwb_energie) |
| **Tibber** | Tibber | [Built-in HA](https://www.home-assistant.io/integrations/tibber/) |
| **Zonneplan** | Zonneplan ONE | [HACS](https://github.com/fsaris/home-assistant-zonneplan-one) |
| **Energie Zero** | Energie Zero | [HACS](https://github.com/twin1/energyzero) |
| **ENTSOE** | ENTSOE | [Built-in HA](https://www.home-assistant.io/integrations/entsoe/) |
| **Frank Energie** | Frank Energie | [HACS](https://github.com/hmmbob/HomeAssistantFrankEnergie) |
| **EasyEnergy** | EasyEnergy | [HACS](https://github.com/TheRikke/Home_Assistant_EasyEnergy) |

**Complete list:** [Cheapest Hours - Data Providers](https://github.com/TheFes/cheapest-energy-hours/blob/main/documentation/1-source_data.md#data-provider-settings)

#### Configuration Example (Zonneplan)

1. Install Zonneplan ONE from HACS
2. Configure integration with your credentials
3. Wait for tariff data to populate
4. Verify sensor exists: `sensor.zonneplan_current_electricity_tariff`

### Step 3: Configure Cheapest Hours

Create Cheapest Hours sensors for:
- **Cheapest 2 hours** (for charging)
- **Most expensive 4 hours** (for self-consumption)

**Example configuration:**

```yaml
# configuration.yaml or packages/house_battery_dynamic.yaml
cheapest_energy_hours:
  - name: "Battery Charge Hours"
    unique_id: battery_charge_hours
    source_entity: sensor.zonneplan_current_electricity_tariff
    mode: cheapest
    number_of_hours: 2
    
  - name: "Battery Discharge Hours"
    unique_id: battery_discharge_hours
    source_entity: sensor.zonneplan_current_electricity_tariff
    mode: most_expensive
    number_of_hours: 4
```

Restart Home Assistant after adding configuration.

### Step 4: Import Dynamic Strategy Flow

In Node-RED:
1. Import `02 strategy-dynamic.json`
2. Deploy flow

### Step 5: Configure in Home Assistant Dashboard

1. Navigate to Home Battery Control dashboard
2. Go to **"Timed & Dynamic"** tab
3. Select your **Energy Supplier** from dropdown
4. Set **Price Delta** threshold (default: €0.06/kWh)
5. Verify planning appears on dashboard showing:
   - Charge periods (blue)
   - Discharge periods (orange/red)
   - Solar-only periods (yellow/green)

### Step 6: Activate Strategy

1. Main dashboard tab
2. Set Strategy to **"Dynamic"**
3. Enable **Master Switch** → "Full Control"

## Understanding the Dashboard

### Planning Display

The dashboard shows a 24-hour view of planned operations:

**Color coding:**
- 🔵 **Blue bars:** Charging from grid (cheapest hours)
- 🔴 **Red bars:** Discharging to grid (most expensive hours, if delta sufficient)
- 🟢 **Green bars:** Solar-only charging (Charge PV)
- ⚪ **Gray bars:** No operation

**Information shown:**
- Current time marker
- Hourly electricity prices
- Active strategy per hour
- Price delta indicator

### Price Delta Indicator

Shows if self-consumption will be active:
- ✅ **"Delta sufficient":** Will discharge during expensive hours
- ❌ **"Delta insufficient":** Will use Charge PV instead during expensive hours

## Operation Details

### Typical Daily Schedule

**Example (summer day with sufficient price delta):**

| Time | Price | Strategy | Reason |
|------|-------|----------|--------|
| 00:00-01:00 | €0.08 | Charge PV | Remaining hours |
| 01:00-02:00 | €0.07 | Charge PV | Remaining hours |
| 02:00-03:00 | €0.04 | **Charge** | Cheapest hour #1 |
| 03:00-04:00 | €0.05 | **Charge** | Cheapest hour #2 |
| 04:00-08:00 | €0.08 | Charge PV | Remaining hours |
| 08:00-12:00 | €0.12 | Charge PV | Solar production |
| 12:00-16:00 | €0.14 | Charge PV | Solar production |
| 16:00-17:00 | €0.22 | **Self-consumption** | Expensive #1 |
| 17:00-18:00 | €0.28 | **Self-consumption** | Expensive #2 |
| 18:00-19:00 | €0.32 | **Self-consumption** | Expensive #3 |
| 19:00-20:00 | €0.26 | **Self-consumption** | Expensive #4 |
| 20:00-00:00 | €0.15 | Charge PV | Remaining hours |

### Strategy Switching

The system automatically switches between strategies:
- **At the start of each hour:** Re-evaluates plan
- **When tariff data updates:** Recalculates schedule
- **Manual override:** Can switch strategy manually if needed

### Backup Behavior

If tariff data becomes unavailable:
- Continues with last known schedule
- Falls back to Charge PV if no schedule available
- Check Node-RED debug log for warnings

## Optimization Tips

### Adjust Price Delta

Fine-tune based on your situation:

**Increase delta (more conservative):**
- If battery degradation is a concern
- For older batteries
- If energy savings are marginal
- Example: €0.08/kWh

**Decrease delta (more aggressive):**
- For new batteries with many cycles remaining
- If price variations are typically large
- To maximize savings
- Example: €0.04/kWh

**Set via dashboard:** Timed & Dynamic tab → Price Delta

### Adjust Charge Window

Default: 2 cheapest hours
- **Increase** if battery is large and needs more time
- **Decrease** if battery is small or prices are very volatile

Requires modifying Cheapest Hours sensor configuration.

### Adjust Discharge Window

Default: 4 most expensive hours
- **Increase** to discharge more often (if beneficial)
- **Decrease** to preserve battery for peak prices only

Requires modifying Cheapest Hours sensor configuration.

### Combine with Solar Forecasting

Advanced users can integrate solar production forecasts to optimize planning further.

## Troubleshooting

### No Planning Shown on Dashboard

**Check:**
1. Energy supplier selected in dropdown
2. Cheapest Hours sensors created and populated
3. Node-RED dynamic flow deployed
4. Tariff data available from supplier integration

**Debug:**
- Check Home Assistant → Developer Tools → States
- Search for `sensor.battery_charge_hours` and `sensor.battery_discharge_hours`
- Verify they show hour lists (e.g., `[2, 3]`)

### Wrong Supplier Data

**Symptoms:** Prices don't match your actual tariff

**Solutions:**
1. Verify supplier integration credentials
2. Check if you're on correct tariff (some suppliers have multiple)
3. Ensure integration is up to date
4. Check supplier integration documentation

### Strategy Not Switching

**Check:**
1. Master Switch is "Full Control"
2. Strategy is set to "Dynamic"
3. Current time is within planned period
4. Node-RED flows are running (check Node-RED dashboard)

**Debug:**
- Open Node-RED debug panel
- Look for strategy change messages
- Verify time comparisons are working

### Price Delta Always Insufficient

**Possible causes:**
1. Threshold set too high
2. Energy prices not varying much
3. Fixed-rate contract (not dynamic!)

**Solutions:**
1. Lower price delta threshold
2. Verify you have a dynamic contract
3. Check if supplier provides correct hourly data

## Advanced Configuration

### Per-Battery Settings

The dynamic strategy respects all battery settings:
- Max charge/discharge limits
- Battery prioritization
- Minimum idle time
- Hysteresis

**[→ Battery Life Optimization](../advanced/battery-life-optimization.md)**

### Multi-Battery Systems

Works seamlessly with multiple batteries:
- All batteries follow same schedule
- Load distributed according to battery priority
- Individual battery limits respected

**[→ Multi-Battery Setup](../guides/multi-battery-setup.md)**

### EV Integration

Combine with EV Stop Trigger:
- EV charging overrides dynamic strategy
- Prevents discharge during EV charging
- Resumes normal schedule after EV disconnects

**[→ EV Stop Trigger](../advanced/ev-stop-trigger.md)**

## Data Provider Setup

### Detailed Configuration Examples

#### Zonneplan ONE

```yaml
# Install: HACS → Zonneplan ONE
# Configuration in UI after installation

# Cheapest Hours config:
cheapest_energy_hours:
  - name: "Battery Charge Hours"
    source_entity: sensor.zonneplan_current_electricity_tariff
    mode: cheapest
    number_of_hours: 2
```

#### ENTSOE (Day-ahead Prices)

```yaml
# Built-in Home Assistant integration
# Configuration → Integrations → ENTSOE

# Cheapest Hours config:
cheapest_energy_hours:
  - name: "Battery Charge Hours"
    source_entity: sensor.entsoe_average_electricity_price_today
    mode: cheapest
    number_of_hours: 2
```

#### Frank Energie

```yaml
# Install: HACS → Frank Energie
# Configuration in UI after installation

# Cheapest Hours config:
cheapest_energy_hours:
  - name: "Battery Charge Hours"
    source_entity: sensor.frank_energie_current_hour_price
    mode: cheapest
    number_of_hours: 2
```

**For complete data provider documentation:**
[Cheapest Hours - Data Provider Settings](https://github.com/TheFes/cheapest-energy-hours/blob/main/documentation/1-source_data.md#data-provider-settings)

## Performance Expectations

### Financial Savings

Typical savings with dynamic strategy:
- **No solar:** €0.50-2.00 per day (depending on price volatility and battery size)
- **With solar:** €1.00-4.00 per day (stores cheap grid + solar, discharges during peaks)

**Factors affecting savings:**
- Battery capacity (larger = more savings potential)
- Price volatility (higher volatility = more opportunities)
- Consumption patterns (peak usage during expensive hours = more savings)
- Solar production (more solar = more cheap energy to store)

### Battery Cycles

Typical cycling with dynamic strategy:
- **High volatility:** 1-2 full cycles per day
- **Low volatility:** 0.5-1 cycles per day (when delta insufficient)

**Battery longevity:**
- 6000 cycles @ 80% DoD = 16+ years at 1 cycle/day
- Savings typically cover battery cost in 3-5 years

## Monitoring Performance

Track your optimization results:

**Create monitoring dashboard with:**
- Daily energy cost (€)
- Daily savings vs baseline
- Battery cycles per day
- Price delta occurrences
- Strategy distribution (% time in each mode)

**Useful sensors:**
{% raw %}
```yaml
template:
  - sensor:
      - name: "Daily Energy Savings"
        unit_of_measurement: "€"
        state: >
          {% set charged = states('sensor.battery_charged_today') | float %}
          {% set discharged = states('sensor.battery_discharged_today') | float %}
          {% set avg_charge_price = states('sensor.average_charge_hour_price') | float %}
          {% set avg_discharge_price = states('sensor.average_discharge_hour_price') | float %}
          {{ ((discharged * avg_discharge_price) - (charged * avg_charge_price)) | round(2) }}
```
{% endraw %}

## Comparison with Other Strategies

### vs Self-Consumption

| Aspect | Dynamic | Self-Consumption |
|--------|---------|------------------|
| **Savings potential** | Higher | Lower |
| **Setup complexity** | Higher | Medium |
| **Requirements** | Dynamic contract + integrations | P1 meter |
| **Best for** | Maximizing financial savings | Maximizing self-sufficiency |

### vs Timed

| Aspect | Dynamic | Timed |
|--------|---------|-------|
| **Automation** | Fully automatic | Manual scheduling |
| **Adaptability** | Daily updates | Fixed schedule |
| **Optimization** | Price-based | Time-based |
| **Best for** | Variable prices | Fixed off-peak rates |

## When to Use Dynamic Strategy

✅ **Use Dynamic if:**
- You have a dynamic/hourly energy contract
- Energy prices vary significantly (>€0.10/kWh range)
- You want automated cost optimization
- You can install required integrations

❌ **Don't use Dynamic if:**
- You have a fixed-rate contract
- Prices vary minimally
- You prioritize simplicity over savings
- Required integrations unavailable for your supplier

**Alternative strategies:**
- Fixed contract with off-peak hours → [Timed Strategy](timed.md)
- Maximize solar use → [Self-Consumption](self-consumption.md)
- Only store solar → [Charge PV](charge.md#charge-pv-solar-only)

## Next Steps

- **Monitor results:** Track savings and battery cycles
- **Fine-tune delta:** Adjust price threshold based on results
- **Combine strategies:** Add EV Stop Trigger for EV charging
- **Share results:** Help the community by sharing your experience

## Community Resources

- **Discord:** `Marstek RS485/Node-Red besturing` - Share your dynamic strategy results
- **GitHub Discussions:** Compare price delta settings
- **Report issues:** [GitHub Issues](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues)

