# Dynamic Strategy Setup

The `dynamic` flow is provided for automated charging/discharging based on changing hourly rates. This is only relevant if you have a dynamic/hourly contract.

## How it works
The strategy will periodically check for new tarif data from your supplier.
It will use `charge` during the cheapest hours of this day. And charge using your charge settings.
It will use `self-consumption` during the most expensive hours of the day, if the price delta is big enough. 
Outside of these periods it will use `charge PV` to capture any surplus (cheap) solar power.

View the explanation video of the general idea behind this strategy:

[![View op YouTube](https://img.youtube.com/vi/PR1XA5GUlAE/hqdefault.jpg)](https://youtu.be/PR1XA5GUlAE)

_English text and subititles, NL spoken: https://youtu.be/PR1XA5GUlAE_


## Getting dynamic up and running
1. Install [Cheapest Energy Hours](https://github.com/TheFes/cheapest-energy-hours?tab=readme-ov-file#how-to-install) if you have not done so already
1. Provide data from your Energy supplier to Home Assistant. [See this easy list](https://github.com/TheFes/cheapest-energy-hours/blob/main/documentation/1-source_data.md#data-provider-settings) with addons from TheFes.
   - Follow any instructions provided by the Data Provider addon.
1. Import the `02 strategy-dynamic.json` flow into Node-RED and *deploy*
1. Go to your Home Battery Control dashboard in HA
   - Select `Full control` and `Dynamic` to activate the strategy
1. Go to 2nd tab, this shows `timed` and `dynamic` planning
   - Select your energy supplier from the dropdown
   - The dashboard should (with a small delay) display when it will be charging/idle/discharing in the next 24 hrs.
1. Price delta
   - Leave the price delta at €0,06/kWh or set it to your desired value
   - For a Marstek bought at ~ €1250, 6000 cycles at 88% DoD and an 80 RTE = delta at €0,06/kWh

Done.
