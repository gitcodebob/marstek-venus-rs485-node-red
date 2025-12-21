# Home Battery Control Documentation

Complete documentation for open-source `Home Battery Control` with Home Assistant and Node-RED.

## 🚀 Quick Start

New to Home Battery Control? Start here:

1. **[Installation Guide](getting-started/installation.md)** - Step-by-step setup
2. **[Safety Guidelines](getting-started/safety.md)** - Safety tips
3. **[Hardware Setup](getting-started/hardware-setup.md)** - Connect your battery via Modbus
4. **[Choose Your Strategy](strategies/overview.md)** - Find the best control strategy for your needs

## 📖 Documentation Structure

### Getting Started

Essential guides for new users:

- **[Installation Guide](getting-started/installation.md)** - Complete installation from scratch
- **[Hardware Setup](getting-started/hardware-setup.md)** - Modbus connections and ESPHome configurations
- **[Safety Guidelines](getting-started/safety.md)** - Critical safety information and best practices

### Strategies

Control strategies for different use cases:

- **[Strategy Overview](strategies/overview.md)** - Compare all available strategies
- **[Self-Consumption](strategies/self-consumption.md)** - PID-based zero grid power (most popular)
- **[Dynamic Pricing](strategies/dynamic.md)** - Optimize for hourly energy rates
- **[Timed Charging](strategies/timed.md)** - Time-based charging/discharging (coming soon)
- **[Charge Modes](strategies/charge.md)** - Simple charge and solar-only modes (coming soon)

### Guides

Practical how-to guides:

- **[Multi-Battery Setup](guides/multi-battery-setup.md)** - Configure multiple batteries (coming soon)
- **[3-Phase Configuration](guides/3-phase-configuration.md)** - Per-phase control (coming soon)
- **[Updating Guide](guides/updating.md)** - Update to new versions (coming soon)
- **[Dashboard Configuration](guides/dashboard-configuration.md)** - Customize your dashboard (coming soon)

### Advanced Features

Optimize and extend your system:

- **[PID Tuning Guide](advanced/pid-tuning.md)** - Advanced PID controller optimization
- **[Battery Life Optimization](advanced/battery-life-optimization.md)** - Extend battery lifespan
- **[Battery Prioritization](advanced/battery-prioritization.md)** - Manage charge order and cycling
- **[EV Stop Trigger](advanced/ev-stop-trigger.md)** - Pause batteries during EV charging
- **[Performance Optimization](advanced/performance.md)** - System-wide optimizations (coming soon)

### Reference

Technical reference material:

- **[PID Controller Theory](reference/pid-controller.md)** - Understanding PID control (coming soon)
- **[Entity Reference](reference/entities.md)** - All Home Assistant entities (coming soon)
- **[Node-RED Flows](reference/node-red-flows.md)** - Flow documentation (coming soon)
- **[Hardware Compatibility](reference/hardware-compatibility.md)** - Compatible battery systems (coming soon)

### Troubleshooting

Solutions to common problems:

- **[Common Issues](troubleshooting/common-issues.md)** - Frequently encountered problems and solutions
- **[PID Tuning Issues](troubleshooting/common-issues.md#pid-issues)** - Oscillations, poor tracking, etc.
- **[Hardware Problems](troubleshooting/common-issues.md#hardware-issues)** - Modbus and connection issues

## 🎯 Find What You Need

### By Use Case

**I want to maximize solar self-consumption:**
→ [Self-Consumption Strategy](strategies/self-consumption.md)

**I have a dynamic energy contract with hourly rates:**
→ [Dynamic Pricing Strategy](strategies/dynamic.md)

**I have fixed off-peak hours (night rate):**
→ [Timed Strategy](strategies/timed.md) (coming soon)

**I want to store only solar energy:**
→ [Charge PV Mode](strategies/charge.md) (coming soon)

**My battery control is unstable/oscillating:**
→ [PID Troubleshooting](troubleshooting/common-issues.md#oscillations-rapid-switching)

**I want to reduce battery wear:**
→ [Battery Life Optimization](advanced/battery-life-optimization.md)

**I'm charging an electric vehicle:**
→ [EV Stop Trigger](advanced/ev-stop-trigger.md)

**I have multiple batteries:**
→ [Battery Prioritization](advanced/battery-prioritization.md) + [Multi-Battery Setup](guides/multi-battery-setup.md)

### By Experience Level

**Beginner:**
1. [Installation Guide](getting-started/installation.md)
2. [Safety Guidelines](getting-started/safety.md)
3. [Strategy Overview](strategies/overview.md)
4. Start with "Very Safe" PID preset

**Intermediate:**
1. [Self-Consumption Strategy](strategies/self-consumption.md)
2. [Dynamic Strategy](strategies/dynamic.md)
3. [Battery Life Optimization](advanced/battery-life-optimization.md)
4. [EV Stop Trigger](advanced/ev-stop-trigger.md)

**Advanced:**
1. [PID Tuning Guide](advanced/pid-tuning.md)
2. [Custom Strategies](strategies/overview.md#combining-strategies)
3. [Multi-Battery Setup](guides/multi-battery-setup.md)
4. [3-Phase Configuration](guides/3-phase-configuration.md)

## 🔧 Key Concepts

### PID Controller
The self-consumption strategy uses a PID (Proportional-Integral-Derivative) controller to automatically maintain near-zero grid power. Think of it as a smart thermostat for your energy flow.

**Learn more:** [PID Controller Theory](reference/pid-controller.md) | [Self-Consumption Strategy](strategies/self-consumption.md)

### Strategies
Different control algorithms optimized for different use cases (self-consumption, dynamic pricing, timed charging, etc.).

**Learn more:** [Strategy Overview](strategies/overview.md)

### Battery Prioritization
For multi-battery systems, determines which battery charges/discharges first, with automatic rotation to distribute wear evenly.

**Learn more:** [Battery Prioritization](advanced/battery-prioritization.md)

### Modbus RS485
Communication protocol used to control batteries. Requires hardware bridge (ESPHome device) between battery and Home Assistant.

**Learn more:** [Hardware Setup](getting-started/hardware-setup.md)

## 📊 Performance Expectations

### Self-Consumption Strategy
- **Grid power tracking:** ±20-50W average (with proper tuning)
- **Response time:** 10-60 seconds to load changes
- **Battery cycles:** 0.5-1.5 per day (depending on solar/consumption)

### Dynamic Pricing Strategy
- **Savings:** €0.50-4.00 per day (depending on price volatility and battery size)
- **Battery cycles:** 0.5-2.0 per day
- **Automation:** Fully automatic daily planning

## 🛠️ System Requirements

### Required
- Home Assistant (2023.1 or newer recommended)
- Node-RED add-on installed
- Home battery with Modbus support
- ESPHome device for Modbus connection
- P1 smart meter connection

### Optional
- Cheapest Hours integration (for Dynamic strategy)
- Energy supplier integration (for Dynamic strategy)
- Solar panels (recommended for all strategies)

## 🌐 Supported Hardware

### Battery Systems
- Marstek Venus (all versions) - Primary focus
- Other Modbus-compatible batteries (community supported)

### Modbus Bridges
- LilyGo T-CAN485 (recommended)
- LilyGo T-POE Pro
- M5Stack Atom S3 + RS485 module
- Other ESPHome-compatible RS485 devices

**Full list:** [Hardware Compatibility](reference/hardware-compatibility.md) (coming soon)

## 💬 Community & Support

### Get Help
- **Discord:** `Marstek RS485/Node-Red besturing` - Active community, quick responses
- **GitHub Discussions:** Ask questions, share configurations
- **GitHub Issues:** Report bugs and feature requests

### Contribute
- Share your PID tuning results
- Document your battery system configuration
- Submit improvements to documentation
- Report issues and bugs

## 🔄 Recent Updates

See **[Release Notes](../RELEASE_NOTES.md)** for version history and changes.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](../LICENSE) file for details.

---

**Ready to get started?** → [Installation Guide](getting-started/installation.md)

**Have questions?** → [Common Issues](troubleshooting/common-issues.md) | Discord: `Marstek RS485/Node-Red besturing`
