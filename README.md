# Home Battery Control for Home Assistant

![License](https://img.shields.io/github/license/gitcodebob/marstek-venus-rs485-node-red)
![Release](https://img.shields.io/github/v/release/gitcodebob/marstek-venus-rs485-node-red)
![Stars](https://img.shields.io/github/stars/gitcodebob/marstek-venus-rs485-node-red)

**Open-source Home Battery Control for Home Assistant and Node-RED**. 

Want full control of your Home Batteries and employ them exactly the way you want? E.g. self-consumption, dynamic pricing optimization, timed charging, peak shaving and customizable strategies. No proprietary software, no vendor lock-in — just complete control over your home battery system using **Home Assistant and Node-RED**.

Perfect for owners who want to maximize self-sufficiency, minimize grid dependence, and optimize energy costs.

*Dutch*

Voor iedereen die meer controle wil over zijn/haar thuis 


## ⚡ Why Home Battery Control?

### Open Source
- ✅ **No vendor lock-in** - Full control over your battery system
- ✅ **Community-driven** - Continuously improved from the community for the community
- ✅ **Transparent** - See exactly how your system works
- ✅ **Customizable** - Adapt to your specific needs

### Advanced Control Strategies
- **Self-Consumption (PID)** - Automatically maintain near-zero grid power with smart PID controller
- **Dynamic Pricing** - Optimize for hourly energy rates, charge cheap & discharge expensive
- **Timed Charging** - Simple time-based scheduling for fixed off-peak rates
- **Solar-Only** - Store excess solar energy, but don't charge from grid
- **Electric Vehicle Integration** - Automatically pause during electric vehicle charging

### Proven Performance
- 🎯 Grid power tracking: ±20-50W average (better than vendor)
- 💰 Daily savings: €0.50-4.00 (dynamic pricing)
- 🔋 Battery longevity: Smart wear distribution & relay protection
- 🌍 Active community: 500+ installations nd growing, Discord support

## 📊 Comparison: Open Source vs Proprietary

| Feature | Home Battery Control | Marstek Software | Other Proprietary |
|---------|---------------------|------------------|-------------------|
| **Cost** | Free & open-source | Free (limited features) | Varies |
| **Customization** | Unlimited | Limited | None |
| **Strategies** | 6+ (expandable) | 2-3 basic modes | Varies |
| **Tuning** | Full control | Fixed | Hidden |
| **Multi-battery** | Unlimited | Up to 9 | Varies |
| **Dynamic pricing** | Full support | Not available | Rarely |
| **Updates** | Community-driven | Vendor schedule | Vendor schedule |
| **Privacy** | Full control | Unknown | Unknown |
| **EV integration** | Yes | No | Rarely |

## 🚀 Quick Start

Get your system running in under an hour:

1. **[📖 Read Documentation](docs/index.md)** - Complete guide hub
2. **[⚙️ Installation Guide](docs/getting-started/installation.md)** - Step-by-step setup
3. **[🎬 Watch Video Tutorial](https://youtu.be/PQo_1QyyrGo)** - Visual walkthrough (NL with ENG subs)

### Video Overview

[![Home Battery via Home Assistant](https://img.youtube.com/vi/PQo_1QyyrGo/0.jpg)](https://www.youtube.com/watch?v=PQo_1QyyrGo)
English text and subtitles, Dutch voice-over.

## ✨ Key Features

### 🎛️ Multiple Control Strategies
- **Self-Consumption**: PID-based zero grid power optimization
- **Dynamic Pricing**: Hourly rate optimization for variable contracts
- **Timed**: Schedule charging during off-peak hours
- **Charge Modes**: Simple grid charging or solar-only
- **Full Stop**: Emergency shutdown and EV charging override

**[→ Compare Strategies](docs/strategies/overview.md)**

### 🔋 Battery Life Optimization
- Smart relay wear reduction
- Automatic charge order rotation
- Configurable idle times and hysteresis
- Multi-battery load distribution

**[→ Extend Battery Lifespan](docs/advanced/battery-life-optimization.md)**

### 🚗 EV Integration
- Automatic pause during EV charging
- Prevents grid overload
- Configurable triggers for heavy appliances
- Seamless resume after charging

**[→ Setup EV Stop Trigger](docs/advanced/ev-stop-trigger.md)**

### 📈 Advanced PID Control
- Professionally tuned presets (Very Safe, Safe, Regular)
- Full manual tuning capability
- Ziegler-Nichols methodology support
- Real-time performance monitoring

**[→ PID Tuning Guide](docs/advanced/pid-tuning.md)**

## 💬 What's New?

See **[Release Notes](RELEASE_NOTES.md)** for the latest features and improvements.

## 📚 Documentation

### For New Users
- **[Installation Guide](docs/getting-started/installation.md)** - Complete setup from scratch
- **[Safety Guidelines](docs/getting-started/safety.md)** - Essential safety information
- **[Hardware Setup](docs/getting-started/hardware-setup.md)** - Connect your battery via Modbus
- **[Strategy Overview](docs/strategies/overview.md)** - Choose the right control strategy

### Popular Guides
- **[Self-Consumption Strategy](docs/strategies/self-consumption.md)** - PID-based zero grid power (most popular)
- **[Dynamic Pricing](docs/strategies/dynamic.md)** - Optimize for hourly energy rates
- **[PID Tuning](docs/advanced/pid-tuning.md)** - Advanced optimization
- **[Battery Life Optimization](docs/advanced/battery-life-optimization.md)** - Extend battery lifespan
- **[Troubleshooting](docs/troubleshooting/common-issues.md)** - Common issues and solutions

### Complete Documentation
**[📖 Full Documentation Hub](docs/index.md)** - All guides, references, and advanced topics

## 🎯 Perfect For

- ✅ **You have solar panels** and want to maximize self-consumption
- ✅ **You want to minimize grid import/export** and reduce energy bills
- ✅ **You have a dynamic energy contract** with hourly variable rates
- ✅ **You want full control** without proprietary software limitations
- ✅ **You're technically inclined** and enjoy home automation
- ✅ **You have an EV** and need smart charging integration
- ✅ **You want to extend battery life** with smart wear management
- ✅ **You require peak shaving** because of captar

❌ **Not suitable if:**
- You prefer plug-and-play solutions without configuration
- You're not comfortable with Home Assistant and Node-RED
- You need official support contracts
- Your battery doesn't support Modbus control

## 🛠️ System Requirements

### Required
- **Home Assistant** (2023.1 or newer recommended)
- **Node-RED** add-on for Home Assistant
- **Home battery with Modbus support** (RS485)
- **ESPHome device** (LilyGo, M5Stack, etc.) for RS485 to WiFi
- **Smart meter (P1)** connected to Home Assistant

### Optional
- Solar panels (zonnepanelen) - Highly recommended
- Cheapest Hours (HACS) - For dynamic pricing strategy
- Energy supplier integration - For hourly rate data

### Tested Hardware
- **Battery:** Marstek Venus (all versions) - Primary focus
- **Modbus bridge:** LilyGo T-CAN485, T-POE Pro, M5Stack Atom S3
- **Compatible with:** Any Modbus-enabled battery system

**[Hardware Setup Guide →](docs/getting-started/hardware-setup.md)**

## 🌟 Community

### Get Support
- **💬 Discord:** [`Marstek RS485/Node-Red Home Battery Control`](https://discord.gg/yeAGaE4kgy)

### Contributing
**See [CONTRIBUTING](.github/copilot-instructions.md)** for guidelines

## 📖 Credits & Acknowledgments

Special thanks to:
- **Ruald Ordelman** - Initiative Node-RED + HA control schema
- **Fonske** - Marstek ESPHome configurations
- **Community contributors** - Testing, feedback, and improvements
- **TheFes** - Cheapest Hours integration

## 📄 License

MIT License - see [LICENSE](LICENSE) file

**Use at your own responsibility.** This project involves controlling electrical systems. Always consult a professional electrician for installations above 800W, follow safety guidelines, and monitor your system carefully.

---

## 🚀 Get Started Now

1. **[Read the Installation Guide](docs/getting-started/installation.md)**
2. **[Join our Discord](https://discord.gg/marstek-rs485)** - Get help from the community
3. **[Watch the Video Tutorial](https://youtu.be/PQo_1QyyrGo)**
4. **Star this repo** ⭐ if you find it useful!

---

**Questions?** Check the **[Documentation Hub](docs/index.md)** or join our **[Discord community](https://discord.gg/marstek-rs485)**

**Keywords:** home battery control, thuisaccu besturing, Home Assistant battery management, zonnepanelen energiebeheer, solar energy storage, dynamic pricing optimization, PID controller battery, open source energy management, Marstek control, ESPHome battery, electric vehicle charging integration, batterij beheer
