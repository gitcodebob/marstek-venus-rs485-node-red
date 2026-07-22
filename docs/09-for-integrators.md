---
layout: default
title: For Integrators & Developers
nav_order: 9
---

# For Integrators & Developers

This page is for those who want to connect a battery brand that is **not** Marstek, build a custom bridge, or otherwise integrate their own hardware with Home Battery Control (HBC).

HBC is brand-agnostic at its core: the strategy flows and dashboards don't talk to your battery directly — they read from and write to a fixed set of **Home Assistant entities**. As long as your setup exposes those entities with the expected names and behaviour, HBC works out of the box.

> The reference naming follows the [`Fonske`](https://github.com/fonske) projects for the Marstek Venus (the `m1` device). To integrate another brand, map your hardware's values onto these same entity names — see the [Anker SOLIX section](/02-modbus-setup#anker-solix).
>
> **Local Modbus reference:** [Anker Solarbank Max AC native package](../home%20assistant/other-batteries/Anker-Max-AC/anker_max_ac_m1_modbus_tcp.yaml) — Fonske-style Modbus TCP that invents the `marstek_m1_*` contract directly (no vendor HA integration required).
>
> **Cloud / entity-bridge reference:** [Anker SolarBank 3 Pro → M1 (Jos)](https://github.com/Jos1958/marstek-venus-rs485-node-red/blob/main/home%20assistant/packages/anker_to_m1_marstek.yaml).

---

## Entities HBC expects from a battery

The table below lists every entity HBC reads or writes for a single battery (`m1`). For additional batteries the prefix increments (`m2`, `m3`, …).

### Sensors (read by HBC)

| Entity | Purpose | Notes |
| --- | --- | --- |
| `sensor.marstek_m1_device_name` | Friendly device name | Used for labelling/identification |
| `sensor.marstek_m1_battery_state_of_charge` | Battery SoC (%) | Core control input |
| `sensor.marstek_m1_battery_voltage` | Battery voltage (V) | Can be a fixed `0` if unavailable |
| `sensor.marstek_m1_battery_total_energy` | Total battery capacity (energy) | |
| `sensor.marstek_m1_ac_power` | AC power | |
| `sensor.marstek_m1_battery_power` | Battery (DC) power | |
| `sensor.marstek_m1_inverter_state_number` | Inverter state as a number | Used **indirectly** by HBC via the derived state |
| `sensor.marstek_m1_inverter_state` | Inverter state (text) | Derived from the state number |
| `sensor.marstek_m1_battery_remaining_capacity` | Remaining usable capacity | |

### Numbers (read & written by HBC)

| Entity | Purpose | Notes |
| --- | --- | --- |
| `number.marstek_m1_max_charge_power` | Max charge power setpoint | |
| `number.marstek_m1_max_discharge_power` | Max discharge power setpoint | |
| `number.marstek_m1_forcible_charge_power` | Forced charge power | |
| `number.marstek_m1_forcible_discharge_power` | Forced discharge power | |
| `number.marstek_m1_charge_to_soc` | Target SoC for charging | **Not used by HBC** |

### Selects (read & written by HBC)

| Entity | Purpose | Notes |
| --- | --- | --- |
| `select.marstek_m1_rs485_control_mode` | RS485 control mode | States: `enable` / `disable`. Must be `enable` for Marstek |
| `select.marstek_m1_user_work_mode` | Battery work mode | **Must be `manual`** for Marstek batteries |
| `select.marstek_m1_forcible_charge_discharge` | Forced charge/discharge selector | |
| `select.marstek_m1_backup_function` | Backup function | **Not used by HBC** |

---

## Mapping another brand

If your battery is exposed under different entity names, you have two options:

1. **Native Modbus package** (preferred when the battery has a documented local Modbus map): expose `marstek_m1_*` entities from HA `modbus:` + templates, like the [Anker Max AC package](../home%20assistant/other-batteries/Anker-Max-AC/anker_max_ac_m1_modbus_tcp.yaml).
2. **Helper/template bridge** onto entities from an existing HA integration: see the [Anker to M1 Marstek package](https://github.com/Jos1958/marstek-venus-rs485-node-red/blob/main/home%20assistant/packages/anker_to_m1_marstek.yaml) by Jos.
3. **Alter the mapping inside the Node-RED flows.** Possible, but **less advised** — it makes updating HBC later cumbersome.

For the bigger picture of how data flows from your meter and battery through Home Assistant into the HBC strategy flows and dashboard, see the [connection schema overview](/02-modbus-setup#an-overview-of-available-connection-schemas).

---

## Contributing

Adding support for a new brand? Share it with the community:

- **Discord** — [join the community](https://homebatterycontrol.com/community/) and find the channel for your brand
- **GitHub** — open or follow an issue, e.g. the [Anker SOLIX tracking issue](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues/126)
