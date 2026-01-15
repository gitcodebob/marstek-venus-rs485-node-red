---
layout: default
title: Dynamic Strategy Setup
---

# Dynamic Strategy Setup

The `dynamic` flow is provided for automated charging/discharging based on changing hourly rates. This is only relevant if you have a dynamic/hourly contract.

## How it works
The strategy will periodically check for new tarif data from your supplier.
It will use `charge` during the cheapest hours of this day. And charge using your charge settings.
It will use `self-consumption` during the most expensive hours of the day, if the price delta is big enough. 
Outside of these periods it will use `charge PV` to capture any surplus (cheap) solar power.

View the explanation videos of the general idea behind this strategy:
* How to SETUP dynamic: _English text and subtitles, NL spoken: [https://youtu.be/PR1XA5GUlAE](https://youtu.be/AdnXlbPMrTA)_
* How to USE dynamic: _English text and subtitles, NL spoken: [https://youtu.be/PR1XA5GUlAE](https://youtu.be/PR1XA5GUlAE)_


## SETUP - getting dynamic up and running
[![How to setup Dynamic](https://img.youtube.com/vi/AdnXlbPMrTA/hqdefault.jpg)](https://youtu.be/AdnXlbPMrTA)
1. Install [Cheapest Energy Hours](https://github.com/TheFes/cheapest-energy-hours?tab=readme-ov-file#how-to-install) if you have not done so already
1. Provide data from your Energy supplier to Home Assistant. [See this easy list](https://github.com/TheFes/cheapest-energy-hours/blob/main/documentation/1-source_data.md#data-provider-settings) with addons from TheFes.
   - Follow any instructions provided by the Data Provider addon.
1. Import the `02 strategy-dynamic.json` flow into Node-RED and *deploy*
1. Go to your Home Battery Control dashboard in HA
   - Select `Full control` and `Dynamic` to activate the strategy
1. Go to 2nd tab, this shows `timed` and `dynamic` planning
   - Select your energy supplier from the dropdown
   - The dashboard should (with a small delay) display when it will be charging/idle/discharing in the next 24 hrs.
1. Minimum price delta
   - Leave the price delta at €0,06/kWh or set it to your desired value
   - For a Marstek bought at ~ €1250, 6000 cycles at 88% DoD and an 80 RTE = delta at €0,06/kWh
   - If you charge largely using solar power, you can lower the price delta down to €0,00/kWh

Done.

## USE - the dynamic strategy
[![How to use Dynamic](https://img.youtube.com/vi/PR1XA5GUlAE/hqdefault.jpg)](https://youtu.be/PR1XA5GUlAE)

### Strategy behavior per period
- **Default**: Uses `Charge PV` to capture surplus solar power
- **Cheapest hours**: Uses `Charge` to charge from grid at lowest rates
- **Expensive hours**: Uses `Self-consumption` to discharge and reduce grid usage (only if `minimum price delta` threshold is met)

**Note** the dynamic and timed strategy share settings for charge / charge pv / self-consumption.

### Dashboard controls

#### Energy supplier / Data source
- Select your `energy supplier` from the dropdown to fetch hourly pricing data
- The system needs this to determine when to charge and discharge

#### Minimum price delta (€/kWh)
- The `minimum price delta` is required between cheap and expensive hours before the battery will discharge
- Set based on your battery's round-trip efficiency and cost per cycle
- Lower this value if you charge primarily with solar power

#### Cheapest hours (number)
- How many of the `cheapest hours` per day to use for charging from grid
- The system automatically finds the cheapest consecutive hours in your data source (often: the current and next day)

#### Expensive hours (number)
- How many of the most `expensive hours` per day to use for self-consumption (discharging)
- The system automatically finds the most expensive block of consecutive hours in your data source (often: the current and next day)

- **Only activates** if the [`minimum price delta`](#minimum-price-delta-kWh) threshold is met. Otherwise grid power is cheaper than the energie stored in your battery.
   - it will **remain in charge PV** mode during [`expensive hours`](#expensive-hours-number) if the threshold is not met. 

_FAQ_

- (Optional) guarantee self-consumption during [`expensive hours`](#expensive-hours-number)?
   - Set the [`minimum price delta`](#minimum-price-delta-kWh) to €0,00 if you always want to switch to self-consumption during expensive hours.
- (Optional) want self-consumption throughout the day? 
   - Set [`expensive hours`](#expensive-hours-number) to [24 - `cheapest hours`](#cheapest-hours-number). E.g. you charge during 2 cheapest hours? Set expensive to `24 hrs - 2 hrs = 22 hrs`
   - Set [`minimum price delta`](#minimum-price-delta-kWh) to €0,00 to make sure the strat activates.

#### Period start/end times (read-only)
- Shows when the [`cheapest`](#cheapest-hours-number) and [`expensive`](#expensive-hours-number) periods start and end
- Automatically calculated by the system based on your energy price data

#### Average tariffs display
- **Expensive period**: Shows the average price during discharge hours
- **Charged at**: Shows the average price during charging hours  
- **Price delta**: The difference between expensive and cheap periods

