# Installation Guide

Complete step-by-step installation instructions for Home Battery Control with Home Assistant and Node-RED.

## Prerequisites

Before starting the installation, ensure you have:
- **Home Assistant** installed and running
- **Battery system** connected to Home Assistant via Modbus (see [Hardware Setup](hardware-setup.md))
- **Smart meter** with P1 port connected to Home Assistant

## Video Guide

[![Home Battery via Home Assistant](https://img.youtube.com/vi/PQo_1QyyrGo/0.jpg)](https://www.youtube.com/watch?v=PQo_1QyyrGo)

[Video instructions (NL with ENG subs)](https://youtu.be/PQo_1QyyrGo?si=wEI7CChgbtWXV8Ue)

## Installation Steps

### Step 1: Connect Batteries to Home Assistant

The project assumes you have connected your home battery system (thuisaccu) to Home Assistant via Modbus.

For detailed hardware connection instructions, see:
- [Hardware Setup Guide](hardware-setup.md) - Modbus connections and ESPHome configurations
- Ready-to-use configurations for popular hardware (LilyGo, M5Stack)

### Step 2: Install Node-RED in Home Assistant

Node-RED is required for the battery control flows.

1. Follow the official guide: [How to install Node-RED in Home Assistant](https://zachowj.github.io/node-red-contrib-home-assistant-websocket/guide/installation.html)
2. Confirm Node-RED is running in Settings → Add-ons

### Step 3: Clone Repository

Clone this repository to access the configuration files:

```bash
git clone https://github.com/gitcodebob/marstek-venus-rs485-node-red.git
```

### Step 4: Install Required Home Assistant Add-ons

Go to Settings → Add-ons and install:

**Required:**
- [`File editor`](https://github.com/home-assistant/addons/tree/master/configurator) or `Visual Studio Server` - for editing configuration files
- `Node-RED` - should already be installed from Step 2

**Optional but Recommended:**
- [`B2500 Meter`](https://github.com/tomquist/b2500-meter) - enables Marstek's built-in control algorithms via ESPHome
- [Cheapest Hours](https://github.com/TheFes/cheapest-energy-hours) - required for Dynamic strategy with hourly energy pricing

### Step 5: Configure Home Assistant

The project uses a package-based configuration structure for better organization:

#### Configuration Structure

```
home assistant/
├── configuration.yaml          # Main config (loads packages automatically)
└── packages/
    ├── house_battery_control.yaml        # Main entities and sensors
    └── house_battery_control_config.yaml # Your personal configuration
```

#### What Each File Contains

- **`house_battery_control.yaml`** - Core entities (input booleans, numbers, selects, template sensors)
  - This file gets updated with new releases
  - Contains recorder configuration to reduce logbook clutter
- **`house_battery_control_config.yaml`** - Installation-specific settings
  - **Customize this file** for your setup
  - Don't overwrite during updates

#### Installation Steps

1. Copy the package files to your Home Assistant configuration:
   ```
   config/packages/house_battery_control.yaml
   config/packages/house_battery_control_config.yaml
   ```

2. Ensure your main `configuration.yaml` includes the packages directory:
   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```

3. Check Configuration in Home Assistant:
   - Developer Tools → YAML → Check Configuration
   - If valid, restart Home Assistant

**Important:** See [Safety Guidelines](safety.md) before proceeding.

### Step 6: Import Home Assistant Dashboard

The dashboard provides guided setup and control interface:

1. In Home Assistant, go to Dashboard view
2. Click the three dots (⋮) → Edit Dashboard
3. Click three dots again → Raw configuration editor
4. Copy content from `home assistant/dashboard.yaml`
5. Paste and save

The dashboard includes:
- Interactive setup checklist
- Battery configuration and monitoring
- Strategy selection and settings
- PID tuning controls

**Follow the guidance on the dashboard** to complete configuration:
1. Set your number of batteries (system supports any number, dashboard shows max 4)
2. Configure your P1 sensor entity
3. Set battery limits (max charge/discharge power)

### Step 7: Import Node-RED Flows

Import the control flows into Node-RED:

#### Core Flows (Required)

1. Open Node-RED (usually at `http://homeassistant.local:1880`)
2. Click menu (≡) → Import
3. Import these files from the `node-red/` folder:
   - `00 master-switch-flow.json` - Enable/disable battery control
   - `00 presets-switch-flow.json` - PID control presets
   - `01 start-flow.json` - Main control loop

#### Strategy Flows

Import the strategies you want to use:
- `02 strategy-self-consumption.json` - PID-based self-consumption (most popular)
- `02 strategy-timed.json` - Time-based charging/discharging
- `02 strategy-charge.json` - Simple charge modes
- `02 strategy-charge-pv.json` - Solar-only charging
- `02 strategy-full-stop.json` - Stop all battery operations
- `02 strategy-dynamic.json` - Dynamic pricing optimization (requires Cheapest Hours)

**Optional:** Explore `node-red/examples/` for advanced strategy patterns

4. Click **Deploy** to activate all flows
   - No configuration changes needed in flows
   - All settings are controlled via Home Assistant dashboard

## Next Steps

✅ **Installation complete!** Before activating full control:

1. **Review [Safety Guidelines](safety.md)** - Essential safety information
2. **Configure battery limits** - Set appropriate max charge/discharge values
3. **Test in 800W mode first** - Start with conservative settings
4. **Choose your strategy:**
   - [Self-Consumption](../strategies/self-consumption.md) - Most popular, requires PID tuning
   - [Dynamic Pricing](../strategies/dynamic.md) - Optimize for hourly rates
   - [Timed Charging](../strategies/timed.md) - Simple time-based control
   - [Other Strategies](../strategies/overview.md) - Overview of all options

5. **Enable Master Switch** - Switch battery mode to `Full Control` when ready

## Troubleshooting

If you encounter issues during installation:
- [Common Installation Issues](../troubleshooting/common-issues.md)
- [Hardware Connection Problems](../troubleshooting/common-issues.md#hardware-issues)

## Need Help?

- Open an issue on [GitHub](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues)
- Join our Discord: `Marstek RS485/Node-Red besturing`
