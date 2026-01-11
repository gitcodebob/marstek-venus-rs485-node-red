# Modbus to Home Assistant

Most home batteries allow control via a ModBus port. To connect your battery via Modbus with Home Assistant there are several ready-to-buy/Microcontroler diy/ESPHome based solutions available.

Examples and ready to use configurations for Marstek are found here:
### Esphome based:
* lilygo: Venus E V1/2: [https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1.yaml](https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1.yaml)
* lilygo: Venus E V3: [https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1_v3.yaml](https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1_v3.yaml)
* lilygo poe: Venus E V3: [https://github.com/Adam600david/Marstek-venus-V3-Lilygo-T-POE-pro/blob/main/MarstekVenus-Lilygo-T-POE-Pro%20MTforum.yaml](https://github.com/Adam600david/Marstek-venus-V3-Lilygo-T-POE-pro/blob/main/MarstekVenus-Lilygo-T-POE-Pro%20MTforum.yaml) (not my work)
* M5stack rs485 Atom s3: Venus E V1/2: [https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485.yaml](https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485.yaml)
* M5stack rs485 Atom s3: Venus V3: [https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485_v3.yaml](https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485_v3.yaml)

### HA yaml based (copy to /config/packages):
#### Modbus tcp/ip to modbus RTU bridge:
* Elfin EW11: Venus V1/2: [https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/v12](https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/v12)
* Elfin EW11: Venus V3: [https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/main](https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/main)
  
#### Modbus TCP/IP directly through ethernet (Venus V3 and Venus A only! ):
* Ethernet port RJ45 (not modbus RTU RJ45 port) : [https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/main](https://github.com/fonske/MarstekVenusV3-modbus-TCP-IP/tree/main)


Adapt the above to your any project you have. 

> Home Battery Control assumes the sensor and entity names used in the `Fonske` projects above. 
>
> Using alternate naming or different code projects requires you to create HA helper entities to map values from your custom setup to the expected entities in the Home Battery Control (HBC) project. 
>
> Altering the mapping in the Node-RED flows is also possible, but less advised as this makes updating later on very cumbersome.
