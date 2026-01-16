
# Home Battery Control via Home Assistant & Node-RED

Home Battery Control is an open-source solution for the community to control home batteries and electric vehicles using Home Assistant and Node-RED. Control your batteries exactly how you want, all in one place without vendor lock-ins.

This project is designed for hobbyists who want full control over their home battery systems. It provides ready-to-use flows and configuration examples, including a PID controller for advanced battery management. Use at your own discretion.

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Integration-3DDC84?logo=home-assistant&logoColor=#03A9F4)](https://www.home-assistant.io/) 
[![Node-RED](https://img.shields.io/badge/Node--RED-Flow-FF4A00?logo=node-red&logoColor=)](https://nodered.org/) 
[![Discord](https://img.shields.io/badge/Discord-Join%20server-5865F2?logo=discord&logoColor=white)](https://discord.gg/yeAGaE4kgy) 
![Stars](https://img.shields.io/github/stars/gitcodebob/marstek-venus-rs485-node-red)
[![Buy Us A Battery](https://img.shields.io/badge/Buy%20Us%20A%20Battery-Support-FFDD00?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/home.battery.control)

## Features
- **You don't need to be a programmer**
- **Node-RED Control Flows:** Easy to import and use control flows for battery charge/discharge ([node-red/](node-red/))
- **Home Assistant Integration:** Premade dashboard for onboarding and control. Example configuration files included. ([home assistant/](home%20assistant/))
- **Customizable:** Tweakers? Adapt the flows and configuration to your specific battery hardware and automation needs
- **Multiple Strategies:** [Self-consumption](docs/04-setup-self-consumption.md) (use your own energy), [Timed](node-red/02%20strategy-timed.json), [Dynamic](docs/05-setup-dynamic.md) (price-based), [Charge](node-red/02%20strategy-charge.json), [Sell](node-red/02%20strategy-sell.json), [Charge PV](node-red/02%20strategy-charge-pv.json) (solar-only), [Full Stop](node-red/02%20strategy-full-stop.json). Easily add your own. See [all strategies](docs/03-strategies.md).
- **Easy Updates:** Grab the latest control flow without losing your personal configurations

## What's New? ![Release](https://img.shields.io/github/v/release/gitcodebob/marstek-venus-rs485-node-red)
📃 **[Release Notes](RELEASE_NOTES.md)** and  📚 **[Documentation](https://gitcodebob.github.io/marstek-venus-rs485-node-red/)** (GitHub Pages)

## Quick Start
[![Home Battery via Home Assistant](https://img.youtube.com/vi/PQo_1QyyrGo/0.jpg)](https://www.youtube.com/watch?v=PQo_1QyyrGo)

[Video instructions (English text and subs, Dutch spoken)](https://youtu.be/PQo_1QyyrGo?si=wEI7CChgbtWXV8Ue)

### Installation Summary
1. **Connect your batteries to HA** - e.g. use ESPhome or LilyGo to connect batteries to Home Assistant (see [Modbus setup guide](docs/02-modbus-setup.md))
1. **Install Node-RED** - [Install in Home Assistant](https://zachowj.github.io/node-red-contrib-home-assistant-websocket/guide/installation.html)
1. **Clone this repository** - `git clone https://github.com/gitcodebob/marstek-venus-rs485-node-red.git`
1. **Configure Home Assistant** - Import YAML files from `home assistant/` folder
1. **Import Node-RED flows** - Import control flows from `node-red/` folder
1. **Set up strategies** - Choose and configure your preferred control strategy

📖 **[Complete Getting Started Guide](docs/01-getting-started.md)**

### Safety First
> **Disclaimer:** You are responsible for configuring and operating your system safely. Monitor carefully. Be prepared to switch off battery control or disengage physically.

- The P1 value is expected in Watt (W). If your meter supplies kW, multiply the P1 input × 1000
- **Test your first setup in 800W mode**
- Set appropriate Max. Charge and Max. Discharge values for each battery via the dashboard
- Always consult a professional electrician when going above 800W

## Documentation

📚 **[View Full Documentation](https://gitcodebob.github.io/marstek-venus-rs485-node-red/)** (GitHub Pages)

### Getting Started
- **[Installation Guide](docs/01-getting-started.md)** - Complete step-by-step installation
- **[Modbus Setup](docs/02-modbus-setup.md)** - Connect batteries to Home Assistant via Modbus

### Strategies
- **[All Strategies Overview](docs/03-strategies.md)** - When to use each strategy and how they work
- **[Self-Consumption Setup](docs/04-setup-self-consumption.md)** - PID controller configuration and tuning
- **[Dynamic Strategy Setup](docs/05-setup-dynamic.md)** - Automated price-based control

### Advanced
- **[Advanced Features](docs/06-advanced-features.md)** - EV trigger, multi-battery, 3-phase, performance optimizations
- **[Troubleshooting](docs/07-troubleshooting.md)** - Common issues and solutions

### Updating
Check the [release notes](RELEASE_NOTES.md) to see which files have changed. In most cases your `Battery Start` flow stays unchanged (contains your custom settings). Copy the other files and import Node-RED flows as per [installation guide](docs/01-getting-started.md).

## Credits
The Node-RED + HA control schema is based on the approach by Ruald Ordelman. And the easy to use Modbus to HA boards by Fonske. Many thanks for sharing your work and ideas with the community!

## Contributing
For major changes, please open an issue first to discuss what you would like to change.

For documentation improvements, build the docs locally via docker to preview the result
```powershell
docker run --rm -v "${PWD}/docs:/usr/src/app" -p 4000:4000 starefossen/github-pages
```

## License
![License](https://img.shields.io/github/license/gitcodebob/marstek-venus-rs485-node-red)

## Getting help
For questions or suggestions, open an issue on GitHub or join our [`Marstek RS485/Node-Red besturing` Discord](https://discord.gg/yeAGaE4kgy).

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?logo=github&logoColor=white)](https://github.com/gitcodebob/marstek-venus-rs485-node-red) [![Discord](https://img.shields.io/badge/Discord-Join%20server-5865F2?logo=discord&logoColor=white)](https://discord.gg/yeAGaE4kgy)

**Keywords:** Open Home Battery Control, Marstek Venus Home Assistant, Marstek Venus aansturen met Homeassistant, Thuisaccu besturen met Home Assistant, thuis batterij aansturen met Home Assistant, Marstek en Home Assistant, battery management, zonnepanelen energiebeheer, solar energy storage, dynamic pricing optimization, dynamisch energie tarief en Home Assistant, open source energy management, Marstek control, ESPHome battery, electric vehicle charging integration, modbus rs485