# Getting Started

[![Home Battery via Home Assistant](https://img.youtube.com/vi/PQo_1QyyrGo/0.jpg)](https://www.youtube.com/watch?v=PQo_1QyyrGo)

[Video instructions (Dutch spoken with English text and subs)](https://youtu.be/PQo_1QyyrGo?si=wEI7CChgbtWXV8Ue)

## Step by step
1. **Connect batteries to Home Assistant**
   - The project assumes you have connected your batteries to Home Assistant
   - Have a look at these [modbus examples and ready to use configurations](02-modbus-setup.md)
   
1. **Install Node-RED in Home Assistant**
   - *Node-RED as a Home Assistant Add-on (popular)*
      - Follow the official guide: [How to install Node-RED in Home Assistant](https://github.com/hassio-addons/addon-node-red/blob/main/node-red/DOCS.md)
   - *Node-RED in a Docker container*
     - The default Node-RED Docker installation is missing several nodes required by this project. Install them via Node-RED's Manage palette:
       - `node-red-contrib-moment`
       - `node-red-contrib-time-range-switch`
       - `node-red-node-smooth`
     - For the Home Assistant WebSocket connection, you'll need to manually configure:
       - Home Assistant URL (e.g., `http://homeassistant.local:8123` or your specific IP address)
       - Access token (generate one in Home Assistant: Profile > Long-Lived Access Tokens)
       - Update the connection settings in each Home Assistant server configuration node

1. **Clone this repository**
   ```sh
   git clone https://github.com/gitcodebob/marstek-venus-rs485-node-red.git
   ```
   
1. **Home Assistant Add-ons**
   - Go to settings > Add-ons and confirm [`File editor`](https://github.com/home-assistant/addons/tree/master/configurator) or `Visual Studio Server` are installed
   - Confirm `Node-RED` is running
   - (Optional) install [`B2500 Meter`](https://github.com/tomquist/b2500-meter) to enable the `Marstek control` option.
      - This sends grid power usage via the ESPHome boards to Martek's own control algorithms.
   - (Optional) install [Cheapest Hours](https://github.com/TheFes/cheapest-energy-hours?tab=readme-ov-file#how-to-install) to enable support for `Dynamic` contracts with hourly changing rates.

1. **Configure Home Assistant**
   - Use the provided YAML files in the `home assistant` folder as follows.
     - Configuration files are organized using the package-based structure:
       - `packages/house_battery_control.yaml` contains all input entities (booleans, datetimes, numbers, selects) and template sensors for battery control. This file is what you usually update.
       - `packages/house_battery_control_config.yaml` contains configuration-related entities specific for your install. Customize it. Don't overwrite at each update.
       - `packages/house_battery_control_charge_limits.yaml` contains optional inputs to configure charging and discharging limits, for example for Marstek Venus E v3 batteries which no longer expose them on the modbus.
     - The main `configuration.yaml` automatically loads all package files from the `packages/` directory
       - Tip: you can add your own package files to the `packages/` folder as well. They will be loaded automatically.
       - Tip: the `house_battery_control.yaml` includes `recorder:` configuration to reduce logbook clutter by excluding high-frequency technical entities (PID control signals, calculated averages) while preserving user-relevant changes (Master Switch, Strategy selection, configuration changes). History graphs and statistics remain fully functional.
     - This package-based structure provides better organization, easier maintenance, and improved configuration sharing.
     - See instruction [Good to know / Safety](#good-to-know--safety) for safety tips.

1. **Home Assistant DASHBOARD - continue installation with guidance**
   - In Home Assistant import `dashboard.yaml` to create a dashboard.
   - Follow the **additional guidance** on this interactive dashboard.
      1. Set your desired number of batteries (the system can handle any number of batteries, but the dash is designed for max. 4)
      1. Set your P1 sensor (`/packages/house_battery_control_config.yaml`)
      1. Import NR flows, see instructions below.

1. **Import Node-RED Flows**
    - In Node-RED, go to the menu > Import > and select the relevant JSON files from the `node-red` folder:
       - `00 master-switch-flow.json` (enable/disable control)
       - `00 presets-switch-flow.json` (pid control presets)
       - `01 start-flow.json` (the main flow)
   - Import charging strategies:
       - `02 strategy-self-consumption.json` (PID-based self-consumption strategy)
       - `02 strategy-timed.json` (time-based charging/discharging strategy)
       - `02 strategy-charge.json` (simple charge strategy)
       - `02 strategy-full-stop.json` (full stop strategy)
   - Optional: Explore additional examples in the `node-red/examples/` directory for advanced strategy patterns
   - Deprecated flows are available in `node-red/deprecated/` folder for reference
   - Deploy all flows. No edits required.

5. **Firing up**
   - Check the dashboard if all checks are green, if you have not done so already.
   - Continue reading **before** switching the master battery mode to `Full Control` to activate.


> Disclaimer 
>
> You are responsible for configuring and operating your system safely. Monitor carefully. 
> Be prepared to switch off battery control or disengage the battery physically. 

## Good to know / Safety
- The P1 value is expected in Watt (w). If your meter supplies kW, multiply the P1 input * 1000
- Test your first time setup in 800W mode
- Manufacturers advise to consult a professional electrician when going above 800W.
- Set the appropriate Max. Charge and Max. Discharge values for each battery via the dashboard, by clicking on the glance charts on the dashboard.
- Don't solely rely on Home Assistant / Node-RED to disengage the batteries when running into trouble during first flights. Staying near the physical battery controls or your circuit breakers is a good extra safety measure. 
