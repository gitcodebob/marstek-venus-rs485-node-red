---
layout: default
title: Modbus Setup
nav_order: 2
---

# Battery to Home Assistant

Home Assistant speaks "ModBus language" to communicate with your Battery and vise versa. 
Use the configurations on this page and HomeBatteryControl will work out of the box.

### Review the available connectors on your battery: 
- **A**) Four string ModBus wire 
  - Use an **EspHome** or **RTU bridge device** - communicates via Wifi to HA.
- **B**) RJ45 *Ethernet* port 
  - Use a **regular network cable**, no extras needed.
- **C**) RJ45 *ModBus* port 
  - Confusingly looks like an Ethernet port, but isn't. Use **Elfin EW11** to communicate via Wifi. 

Decide wether you go WiFi or cable.

![Connector options](https://cdn.homebatterycontrol.com/img/modbus-connectors.jpg)

Reading tip | this [Marstek topic on Tweakers.net](https://gathering.tweakers.net/forum/list_messages/2282240/0) (NL/BE) for detailed info curated by SuperDuper1969

## Ready to use config for Marstek are found here

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