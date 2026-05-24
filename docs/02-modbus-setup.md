---
layout: default
title: Battery connection
nav_order: 2
---

# Battery to Home Assistant

Home Assistant speaks "ModBus language" to communicate with your Battery and vise versa. 
Use the configurations on this page and HomeBatteryControl will work out of the box.

### Review the available connectors on your battery: 
- **B**) RJ45 *Ethernet* port 
  - Use a **regular network cable**, no extras needed.
- **A**) Four string ModBus wire 
  - Use an **EspHome** or **RTU bridge device** - communicates via Wifi to HA.
- **C**) RJ45 *ModBus* port 
  - Confusingly looks like an Ethernet port, but isn't. Use **Elfin EW11** to communicate via Wifi. 

Decide wether you go WiFi or cable.

![Connector options](https://cdn.homebatterycontrol.com/img/modbus-connectors.jpg)

Reading tip | this [Marstek topic on Tweakers.net](https://gathering.tweakers.net/forum/list_messages/2282240/0) (NL/BE) for detailed info curated by SuperDuper1969

**Brands**
* [Marstek](#marstek)
* [Anker](#anker-solix)
* [Other](#an-overview-of-available-connection-schemas)

## Marstek
![Marstek](https://cdn.homebatterycontrol.com/img/banner-marstek.jpg)

Ready to use config for Marstek are found here

### Ethernet cable (Venus V3 and Venus A/D only):
* Ethernet port RJ45 (not modbus RTU RJ45 port) : [https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/main](https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/main)

    > Copy the YAML to `/config/packages/` in Home Assistant folder

### Esphome based - Modbus 4-string
* lilygo: Venus E V1/2: [https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1.yaml](https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1.yaml)
* lilygo: Venus E V3: [https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1_v3.yaml](https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1_v3.yaml)
* lilygo poe: Venus E V3: [https://github.com/Adam600david/Marstek-venus-V3-Lilygo-T-POE-pro/blob/main/MarstekVenus-Lilygo-T-POE-Pro%20MTforum.yaml](https://github.com/Adam600david/Marstek-venus-V3-Lilygo-T-POE-pro/blob/main/MarstekVenus-Lilygo-T-POE-Pro%20MTforum.yaml) (by Adam David)
* M5stack rs485 Atom s3: Venus E V1/2: [https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485.yaml](https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485.yaml)
* M5stack rs485 Atom s3: Venus V3: [https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485_v3.yaml](https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485_v3.yaml)

### Modbus RTU bridge to Modbus tcp/ip:
* Elfin EW11: Venus V1/2: [https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/v12](https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/v12)
* Elfin EW11: Venus V3: [https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/main](https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/main)

    > Copy the YAML to `/config/packages/` in Home Assistant folder

## Important notice
> Home Battery Control assumes the sensor and entity names used in the `Fonske` projects above. 
>
> Using alternate naming or different code projects requires you to create HA helper entities to map values from your custom setup to the expected entities in the Home Battery Control (HBC) project. 
>
> Altering the mapping in the Node-RED flows is also possible, but less advised as this makes updating later on very cumbersome.

Special thanks to [Fonske](https://github.com/fonske) for his work and efforts to the project.


## Anker SOLIX
![Anker SOLIX](https://cdn.homebatterycontrol.com/img/banner-anker-solix.jpg)

Several HBC-tweakers have started support for the Anker SolarBank 3 Pro in addition to the: 
- Anker SOLIX SolarBank 4 Pro
- Anker SOLIX SolarBank Max AC 
- Anker SOLIX Smartplug Gen 2

You can find the progress in the this issue started and maintained by @exuberant_maypole_48572 
* GitHub issue: https://github.com/gitcodebob/marstek-venus-rs485-node-red/issues/126
* Or join our discord and search for the Anker channel for more info: [community](https://homebatterycontrol.com/community/)

The official HA integration by Anker SOLIX 
* HA integration: https://github.com/anker-charging/ha-anker-solix-official
* This will make HA entities available. To let HBC use them, follow the example below.

Review the documentation in this Anker to *Anker to HBC example* made by jos
* https://github.com/Jos1958/marstek-venus-rs485-node-red/blob/main/home%20assistant/packages/anker_to_m1_marstek.yaml

### Anker SolarBank 3 PRO configs
* Anker SolarBank 3 PRO: [read the documentation in this yaml](https://github.com/Jos1958/marstek-venus-rs485-node-red/blob/main/home%20assistant/packages/anker_to_m1_marstek.yaml)
  * 3 PRO is not supported in the official HA integration
  * Thanks to Jos1958
  
## An overview of available connection schemas
![Marstek](https://cdn.homebatterycontrol.com/img/hbc-with-other-battery.jpg)

### Table

<table>
  <thead>
    <tr>
      <th>Asset</th>
      <th>Connection</th>
      <th>Communication</th>
      <th>HA integrations</th>
      <th>HA config</th>
      <th>HBC interface</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>P1 Meter</td>
      <td>Direct USB or LAN</td>
      <td>USB or local (TCP-IP)</td>
      <td>HomeWizard Integration / Other P1 Integrations</td>
      <td>—</td>
      <td rowspan="6">
        <strong>Fonske entity naming schema</strong><br>
        ↓<br>
        <strong>Home Assistant</strong><br>
        • HA Add-Ons (Node-RED)<br>
        • HA HBC Package (YAML) — Home Battery Control + Config<br>
        • HA HBC Dashboard (YAML)<br>
        ↓<br>
        <strong>HBC Strategy Flows (Bob)</strong><br>
        ↓<br>
        <strong>HBC Dashboard (Bob)</strong><br>
      </td>
    </tr>
    <tr>
      <td>Marstek Venus V3</td>
      <td>Direct LAN / Wifi</td>
      <td>modbus (TCP-IP)</td>
      <td>—</td>
      <td>Marstek Package (YAML) — MarstekVenusV3-modbus-TCP-IP (Fonske)</td>
    </tr>
    <tr>
      <td>Marstek Venus V1/2/3</td>
      <td>via LilyGo, M5stack, Elfin</td>
      <td>modbus (RS485)</td>
      <td>—</td>
      <td>Marstek Package (YAML) — MarstekVenus-ESPHome (Fonske)</td>
    </tr>
    <tr>
      <td>Anker SolarBank 3</td>
      <td>via Anker Cloud</td>
      <td>Anker Cloud (TCP-IP)</td>
      <td>HA-Anker-Solix (thomluther)</td>
      <td>Cloud Anker to Marstek Package (YAML) — Anker to M1 Marstek (Jos)</td>
    </tr>
    <tr>
      <td>Anker SolarBank 4 &amp; Max AC</td>
      <td>Direct LAN</td>
      <td>modbus (TCP-IP)</td>
      <td>HA-Anker-Solix-Official (anker) <em>[support](https://github.com/anker-charging/ha-anker-solix-official#supported-devices)</em></td>
      <td>Local Anker to Marstek Package (YAML) — Anker to M1 Marstek <em>(Future)</em> (*)</td>
    </tr>
    <tr>
      <td>Other Battery</td>
      <td>Any</td>
      <td>Any</td>
      <td>Other Battery Integration</td>
      <td>Other Battery to Marstek Package (YAML) — Other to M1 Marstek <em>(Future)</em> (*)</td>
    </tr>
  </tbody>
</table>

<sub>(*) Use the Anker to M1 Marstek as a template for the other Batteries.</sub>

