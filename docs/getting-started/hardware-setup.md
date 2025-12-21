# Hardware Setup - Modbus Connection

Learn how to connect your home battery (thuisaccu) system to Home Assistant via Modbus RS485.

## Overview

Most home battery systems support Modbus RTU communication via an RS485 port. This guide covers hardware options and ready-to-use configurations for connecting your battery to Home Assistant.

## Connection Methods

### ESPHome-Based Solutions (Recommended)

ESPHome provides reliable, WiFi-based Modbus connectivity with automatic Home Assistant integration.

Popular hardware options:
- **LilyGo T-CAN485** - Affordable, compact RS485 to WiFi bridge
- **LilyGo T-POE Pro** - Power over Ethernet option
- **M5Stack Atom S3 Lite with RS485 module** - Modular approach

## Ready-to-Use Configurations

### For Marstek Venus Battery Systems

The community has created ready-to-deploy ESPHome configurations:

#### LilyGo V1/V2
```yaml
# Configuration by Fonske
https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1.yaml
```

#### LilyGo V3
```yaml
# Configuration by Fonske
https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1_v3.yaml
```

#### LilyGo T-POE Pro
```yaml
# Configuration by Adam600david
https://github.com/Adam600david/Marstek-venus-V3-Lilygo-T-POE-pro/blob/main/MarstekVenus-Lilygo-T-POE-Pro%20MTforum.yaml
```

#### M5Stack Atom S3 with RS485 (V1/V2)
```yaml
# Configuration by Fonske
https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485.yaml
```

#### M5Stack Atom S3 with RS485 (V3)
```yaml
# Configuration by Fonske
https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485_v3.yaml
```

## Installation Steps

### 1. Hardware Connection

1. **Locate RS485 port** on your battery system
2. **Connect wires** from ESPHome device to battery:
   - A/D+ to battery A/D+
   - B/D- to battery B/D-
   - GND to battery GND (if available)
3. **Power the ESPHome device** (USB or PoE depending on model)

### 2. Flash ESPHome Configuration

1. Download appropriate YAML configuration from links above
2. Customize WiFi credentials in YAML file
3. Flash device using ESPHome:
   - Via ESPHome Dashboard in Home Assistant
   - Or via [ESPHome Web Flasher](https://web.esphome.io/)

### 3. Verify Connection

After flashing:
1. Device appears in Home Assistant (ESPHome integration)
2. Battery entities become available (voltage, current, power, state of charge, etc.)
3. Check logs in ESPHome for Modbus communication

## Entity Naming Convention

**Important:** Home Battery Control expects specific entity names from the Fonske configurations.

### Expected Entity Names (per battery)

```yaml
sensor.marstek_battery_1_voltage
sensor.marstek_battery_1_current
sensor.marstek_battery_1_power
sensor.marstek_battery_1_soc
sensor.marstek_battery_1_temperature
# ... etc for battery_2, battery_3, battery_4
```

### Using Different Configurations

If you use different ESPHome configurations or battery brands with different entity names:

**Option 1: Create Helper Entities (Recommended)**
1. Go to Settings → Devices & Services → Helpers
2. Create template sensors that map your entities to expected names
3. Example:
```yaml
template:
  - sensor:
      - name: "Marstek Battery 1 Power"
        unique_id: marstek_battery_1_power_mapped
        state: "{{ states('sensor.your_battery_power') }}"
        unit_of_measurement: "W"
```

**Option 2: Modify Project Configuration**
- Edit `house_battery_control_config.yaml` to reference your entity names
- ⚠️ Makes updates more complex as you need to preserve your changes

## Multi-Battery Setup

For systems with multiple batteries:

1. Each battery needs its own ESPHome device (or Modbus channels if supported)
2. Entity names should follow pattern: `battery_1`, `battery_2`, etc.
3. Configure number of batteries in Home Assistant dashboard
4. See [Multi-Battery Guide](../guides/multi-battery-setup.md) for advanced configurations

## Troubleshooting Hardware

### No Communication with Battery

1. **Check wiring:**
   - Correct A/B polarity (swap if needed)
   - Secure connections
   - Proper termination resistors (120Ω) if required

2. **Verify Modbus settings:**
   - Baud rate (usually 9600 or 19200)
   - Parity (usually None or Even)
   - Slave ID/address

3. **Check ESPHome logs:**
   - Settings → ESPHome → Device → Logs
   - Look for Modbus errors or timeouts

### Intermittent Connection

- Check WiFi signal strength
- Verify power supply stability
- Look for electromagnetic interference near RS485 cables
- Use shielded RS485 cable for longer distances

### Wrong Values

- Verify Modbus register mappings match your battery model
- Check unit conversions (some registers provide mA instead of A)
- Consult battery manual for correct register addresses

## Other Battery Brands

This project primarily focuses on Marstek Venus systems, but the approach works for any Modbus-compatible battery:

1. Find Modbus register documentation for your battery
2. Create ESPHome configuration with appropriate register mappings
3. Map entities to expected names (Option 1 above)
4. Share your configuration with the community!

## Hardware Compatibility List

Community-tested hardware configurations:

| Battery Brand | Hardware | Configuration | Status |
|---------------|----------|---------------|--------|
| Marstek Venus V1/V2 | LilyGo T-CAN485 | [Link](https://github.com/fonske/MarstekVenus-LilygoRS485) | ✅ Verified |
| Marstek Venus V3 | LilyGo T-CAN485 | [Link](https://github.com/fonske/MarstekVenus-LilygoRS485) | ✅ Verified |
| Marstek Venus V3 | LilyGo T-POE Pro | [Link](https://github.com/Adam600david/Marstek-venus-V3-Lilygo-T-POE-pro) | ✅ Verified |
| Marstek Venus | M5Stack Atom S3 | [Link](https://github.com/fonske/MarstekVenus-M5stackRS485) | ✅ Verified |

Have you tested other hardware? [Contribute your configuration!](../community/contributing.md)

## Next Steps

Once hardware is connected and entities are available in Home Assistant:

1. Continue with [Installation Guide](installation.md) - Step 5
2. Configure battery limits and safety settings
3. Choose your control strategy

## Additional Resources

- [ESPHome Modbus Documentation](https://esphome.io/components/modbus.html)
- [RS485 Basics Tutorial](https://www.ti.com/lit/an/slyt324/slyt324.pdf)
- Community Discord: `Marstek RS485/Node-Red besturing`
