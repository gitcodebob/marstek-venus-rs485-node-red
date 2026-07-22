# Anker SOLIX Solarbank Max AC → HBC (native Modbus TCP)

Fonske-style Home Assistant package that talks to an **Anker SOLIX Solarbank Max AC** over **Modbus TCP** and exposes the exact `marstek_m1_*` entities expected by [Home Battery Control](https://github.com/gitcodebob/marstek-venus-rs485-node-red).

No Anker cloud integration and no `ha-anker-solix-official` dependency.

## Install

1. In the **Anker app**: device **Settings → Third-Party Control Setting → enable Modbus TCP**. Note the IP.
2. Edit [`anker_max_ac_m1_modbus_tcp.yaml`](anker_max_ac_m1_modbus_tcp.yaml): set `host:` to that IP (replace `[YOUR_IP_ADDRESS]`).
3. Copy the YAML into Home Assistant `/config/packages/` (same place as HBC’s `house_battery_control*.yaml`).
4. Do **not** also load a Marstek Venus m1 Modbus package — entity IDs collide.
5. Restart Home Assistant (or reload Modbus, Template, Input helpers, and Scripts).
6. Install / keep using HBC Node-RED flows and HA packages as documented upstream.

## How control works

| HBC action | Anker Modbus |
| --- | --- |
| `select.marstek_m1_rs485_control_mode` = `enable` | Holding `10064` = `3` (third_party_control) |
| `select.marstek_m1_rs485_control_mode` = `disable` | Holding `10064` = `0` (self_consumption), setpoint `0` |
| Charge / discharge / stop + power numbers | Holding `10071` signed INT32: charge `-P`, discharge `+P`, stop `0` |

Local helpers store optimistic HBC state; `script.anker_max_ac_m1_apply_control` writes the device (300 ms coalesce for rapid HBC updates). Setpoints are clamped to the lower of HBC max helpers and device max registers `10036` / `10038`.

## Safety

- Device rating is **3500 W** charge / discharge (entity `max`).
- Defaults start at **800 W**; raise the HBC max helpers when ready.
- Only enable third-party Modbus on a trusted private network.
- You are responsible for safe operation; have a way to disable third-party control in the Anker app.

## Hardware validation checklist

Use Developer Tools → States / Services before enabling full HBC strategies.

### Reads

- [ ] `sensor.marstek_m1_battery_state_of_charge` updates (register `10014`)
- [ ] `sensor.marstek_m1_battery_power` shows signed W (register `10008`)
- [ ] `sensor.marstek_m1_ac_power` updates (register `10010`)
- [ ] `sensor.marstek_m1_battery_total_energy` looks plausible (register `10250`, ×0.1 kWh)
- [ ] `sensor.marstek_m1_device_name` = `Anker Solarbank Max AC`
- [ ] `sensor.marstek_m1_inverter_state` maps standby / charge / discharge / sleep

### Writes (manual; start below 3500 W if preferred)

- [ ] Set `select.marstek_m1_rs485_control_mode` → `enable` → `sensor.marstek_m1_operating_mode_number` becomes `3`
- [ ] Set forcible mode `charge` + charge power e.g. `500` → battery charges; power ≈ −500 W
- [ ] Set forcible mode `discharge` + discharge power e.g. `500` → battery discharges; power ≈ +500 W
- [ ] Set forcible mode `stop` → setpoint `0`, idle/standby
- [ ] Set RS485 control → `disable` → operating mode `0` (self_consumption), setpoint cleared

### HBC strategies

- [ ] HBC **Charge** drives charge setpoint
- [ ] HBC **Sell** drives discharge setpoint
- [ ] HBC **Self-consumption** (PID) updates power without cloud lag
- [ ] Leaving Full Control / disabling RS485 returns the unit to self-consumption

## Upstream

Intended for a PR into [gitcodebob/marstek-venus-rs485-node-red](https://github.com/gitcodebob/marstek-venus-rs485-node-red), related to [issue #126](https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues/126).

If this tree is only a local clone so far, create your GitHub fork once authenticated:

```bash
gh auth login
gh repo fork gitcodebob/marstek-venus-rs485-node-red --remote=true
git push -u origin feat/anker-solarbank-max-ac-modbus
```

## Multi-battery

Duplicate this file for `m2` / `m3`: rename hub, helpers, scripts, and all `m1` entity/unique IDs (same pattern as Fonske’s m2/m3 packages).
