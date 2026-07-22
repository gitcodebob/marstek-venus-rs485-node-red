# Anker SOLIX Solarbank → HBC (native Modbus TCP)

Fonske-style Home Assistant package for **Anker SOLIX Solarbank Max AC** and **Anker SOLIX Solarbank 4 E5000 Pro** over **Modbus TCP**. Both devices share the same third-party control register map.

Exposes the exact `marstek_m1_*` entities expected by [Home Battery Control](https://github.com/gitcodebob/marstek-venus-rs485-node-red).

No Anker cloud integration and no `ha-anker-solix-official` dependency.

## Supported devices

| Product | Official Modbus config |
| --- | --- |
| Solarbank Max AC | [8fcbb87c…yaml](https://github.com/anker-charging/ha-anker-solix-official/blob/main/custom_components/anker_solix_official/config/8fcbb87c685781b1d70d784a79eb923098955df2aaf199095ce7767bb70b913d.yaml) |
| Solarbank 4 E5000 Pro | [58f0132b…yaml](https://github.com/anker-charging/ha-anker-solix-official/blob/main/custom_components/anker_solix_official/config/58f0132b5f7979b2cfa43a0eb1fca770053288032386ff6a4da5ed2d72d4ea35.yaml) |

## Install

1. In the **Anker app**: device **Settings → Third-Party Control Setting → enable Modbus TCP**. Note the IP.
2. Edit [`anker_solarbank_m1_modbus_tcp.yaml`](anker_solarbank_m1_modbus_tcp.yaml): set `host:` to that IP (replace `[YOUR_IP_ADDRESS]`).
3. Copy the YAML into Home Assistant `/config/packages/` (same place as HBC’s `house_battery_control*.yaml`).
4. Do **not** also load a Marstek Venus m1 Modbus package — entity IDs collide.
5. Restart Home Assistant (or reload Modbus, Template, Input helpers, and Scripts).
6. Optionally set `input_text.marstek_m1_anker_solarbank_product_name` to e.g. `Anker Solarbank Max AC` or `Anker SOLIX Solarbank 4 E5000 Pro` (shown as M1 device name on the HBC dashboard).
7. Install / keep using HBC Node-RED flows and HA packages as documented upstream.

### Migrating from the older Max-AC-only package

If you previously used `Anker-Max-AC/anker_max_ac_m1_modbus_tcp.yaml`:

1. Replace it with this file (and remove the old package).
2. Re-set the device IP and product name helper.
3. Re-apply HBC max charge/discharge helpers if needed (entity IDs for helpers changed from `anker_max_ac` → `anker_solarbank`).
4. Restart HA / reload packages.

## How control works

| HBC action | Anker Modbus |
| --- | --- |
| `select.marstek_m1_rs485_control_mode` = `enable` | Holding `10064` = `3` (third_party_control) |
| `select.marstek_m1_rs485_control_mode` = `disable` | Holding `10064` = `0` (self_consumption), setpoint `0` |
| Charge / discharge / stop + power numbers | Holding `10071` signed INT32: charge `-P`, discharge `+P`, stop `0` |

Local helpers store optimistic HBC state; `script.anker_solarbank_m1_apply_control` writes the device (300 ms coalesce for rapid HBC updates). Setpoints are clamped to the lower of HBC max helpers and device max registers `10036` / `10038`.

`sensor.marstek_m1_battery_power` follows the **HBC/Marstek sign** (charge positive, discharge negative). Anker register `10008` is inverted for that sensor; raw Anker polarity remains on `sensor.marstek_m1_battery_power_anker_raw`.

Dashboard **M1 Power** uses `sensor.marstek_m1_ac_power`, which is mapped to that same Anker battery power (Anker sign: discharge +, charge −). House load stays on `sensor.marstek_m1_load_power` (register `10010`).

## Safety

- Helper / number **max** is **3500 W**. Device registers `10036` / `10038` still clamp writes.
- Defaults start at **800 W**; raise the HBC max helpers when ready.
- Only enable third-party Modbus on a trusted private network.
- You are responsible for safe operation; have a way to disable third-party control in the Anker app.

## Troubleshooting

- **Self-consumption enables third-party mode but never charge/discharge:** check HBC PID gains (`Kp` / `Ki` / `Kd`). If all are `0`, the controller is disabled and HBC keeps forcible mode at `stop` @ `0 W` even when P1 shows import/export. Pick a PID preset (e.g. **very safe**) on the HBC dashboard. (Older Anker Solarbank 3 cloud guides suggested forcing PID to 0 — that does **not** apply to local Modbus Max AC / Solarbank 4.)
- **Charge / Sell work but Self-consumption does not:** same PID check first; those strategies do not rely on the PID loop the same way.

## Hardware validation checklist

Use Developer Tools → States / Services before enabling full HBC strategies.

### Reads

- [ ] `sensor.marstek_m1_battery_state_of_charge` updates (register `10014`)
- [ ] `sensor.marstek_m1_battery_power` shows signed W (HBC sign: charge +, discharge −)
- [ ] `sensor.marstek_m1_ac_power` tracks battery charge/discharge (dashboard **M1 Power**)
- [ ] `sensor.marstek_m1_load_power` updates with house load when present (register `10010`)
- [ ] `sensor.marstek_m1_battery_total_energy` looks plausible (register `10250`, ×0.1 kWh)
- [ ] `sensor.marstek_m1_device_name` shows your product label helper
- [ ] `sensor.marstek_m1_inverter_state` maps standby / charge / discharge / sleep

### Writes (manual; start below device rating if preferred)

- [ ] Set `select.marstek_m1_rs485_control_mode` → `enable` → `sensor.marstek_m1_operating_mode_number` becomes `3`
- [ ] Set forcible mode `charge` + charge power e.g. `500` → battery charges; HBC power ≈ **+500 W**
- [ ] Set forcible mode `discharge` + discharge power e.g. `500` → battery discharges; HBC power ≈ **−500 W**
- [ ] Set forcible mode `stop` → setpoint `0`, idle/standby
- [ ] Set RS485 control → `disable` → operating mode `0` (self_consumption), setpoint cleared

### HBC strategies

- [ ] HBC **Charge** drives charge setpoint
- [ ] HBC **Sell** drives discharge setpoint
- [ ] HBC **Self-consumption** (PID) updates power without cloud lag
- [ ] Leaving Full Control / disabling RS485 returns the unit to self-consumption

## Upstream

Intended for a PR into [gitcodebob/marstek-venus-rs485-node-red](https://github.com/gitcodebob/marstek-venus-rs485-node-red), related to [issue #126](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues/126).

## Multi-battery

Duplicate this file for `m2` / `m3`: rename hub, helpers, scripts, and all `m1` entity/unique IDs (same pattern as Fonske’s m2/m3 packages).
