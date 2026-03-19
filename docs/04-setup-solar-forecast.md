---
layout: default
title: Solar Forecast Setup
nav_order: 4.5
---

# Solar Forecast Setup

The **Charge** strategy supports a **solar forecast** goal. Instead of charging to a fixed energy level, it calculates how much grid charging is actually needed based on today's expected solar production.

## How It Works

When the charge goal is set to **solar forecast**, the system calculates a charge target:

```
solar_surplus  = max(forecast_today − reserved_for_house, 0)
charge_target  = max(max_battery_energy − solar_surplus, 0)
```

- If the forecast covers the full battery capacity, no grid charging is needed.
- If the forecast only partially covers it, only the remaining portion is charged from the grid.
- The dashboard distribution card shows the split between grid charge and expected solar charge.

This calculation updates automatically whenever any input changes (forecast value, threshold, or battery capacity).

## Prerequisites

You need a solar forecast integration installed in Home Assistant that provides a **daily kWh sensor**. Common options:

| Integration | Sensor example |
|-------------|---------------|
| [Solcast](https://github.com/BJReplay/ha-solcast-solar) | `sensor.solcast_pv_forecast_forecast_today` |
| [Forecast.Solar](https://www.home-assistant.io/integrations/forecast_solar/) | `sensor.energy_production_today` |
| [Open-Meteo Solar Forecast](https://www.home-assistant.io/integrations/open_meteo/) | Varies by configuration |

Any sensor that reports today's expected solar production in **kWh** will work.

## Configuration

1. On the dashboard, set the **Charge goal** to `solar forecast`.
2. Under **Configure your solar forecast**, enter your forecast sensor entity IDs:
   - **Solar forecast sensor (kWh today)** — e.g. `sensor.solcast_pv_forecast_forecast_today`
   - **Solar forecast sensor (kWh tomorrow)** — e.g. `sensor.solcast_pv_forecast_forecast_tomorrow`
3. Set **Solar reserved for house** (`house_battery_strategy_charge_sf_threshold_low`) to your estimated daily household consumption in kWh. Only solar production _above_ this value is considered available for battery charging.

## Dashboard Indicators

When the solar forecast goal is active, the dashboard shows:

| Card / Field | Description |
|-------------|-------------|
| **Charging until reserve is** | The calculated charge target in kWh |
| **Distribution card** | Visual split: available energy, grid charge portion, and solar charge portion |
| **Solar forecast today** | Raw forecast value from your sensor |
| **Solar surplus today** | Forecast minus household reservation |
| **Surplus covers capacity** | Whether solar alone can fill the battery |

All values update in real time when the forecast, threshold, or battery capacity changes.

## Entities Reference

| Entity | Type | Description |
|--------|------|-------------|
| `sensor.solar_forecast_today` | Template sensor | Solar forecast mirrored from your configured sensor |
| `sensor.solar_forecast_surplus_today` | Template sensor | Forecast minus household consumption threshold |
| `sensor.charge_target_energy` | Template sensor | Calculated charge target considering solar surplus |
| `sensor.charge_grid_energy_portion` | Template sensor | Energy that needs to come from the grid |
| `sensor.charge_solar_energy_portion` | Template sensor | Energy expected from solar |
| `input_number.house_battery_strategy_charge_sf_threshold_low` | Input number | Estimated daily household consumption |
| `input_number.house_battery_strategy_charge_target_energy` | Input number | Manual charge target (used by energy reserve goal) |

## Tips

- Start with a conservative **Solar reserved for house** value (e.g. your average daily consumption). You can fine-tune it over time.
- The forecast goal works well with the **Dynamic** strategy: during cheap hours it charges only what solar won't cover, saving grid costs.
- Check the **surplus covers capacity** indicator — if it reads `on` often, your solar array may produce enough to skip grid charging entirely on sunny days.
