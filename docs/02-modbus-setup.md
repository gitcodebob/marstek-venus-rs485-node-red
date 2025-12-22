# Modbus to Home Assistant

Most home batteries allow control via a ModBus port. To connect your battery via Modbus with Home Assistant there are several ready-to-buy/Microcontroler diy/ESPHome based solutions available.

Examples and ready to use configurations for Marstek are found here:
* lilygo v1/2: https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1.yaml
* lilygo V3: https://github.com/fonske/MarstekVenus-LilygoRS485/blob/main/lilygo_mt1_v3.yaml
* lilygo poe: v3: https://github.com/Adam600david/Marstek-venus-V3-Lilygo-T-POE-pro/blob/main/MarstekVenus-Lilygo-T-POE-Pro%20MTforum.yaml  (not my work)
* M5stack rs485 Atom s3: v1/2:  https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485.yaml
* M5stack rs485 Atom s3: v3: https://github.com/fonske/MarstekVenus-M5stackRS485/blob/main/esphome/atom_s3_lite_rs485_v3.yaml

Adapt the above to your any project you have. 

> Home Battery Control assumes the sensor and entity names used in the `Fonske` projects above. 
>
> Using alternate naming or different code projects requires you to create HA helper entities to map values from your custom setup to the expected entities in the Home Battery Control (HBC) project. 
>
> Altering the mapping in the HBC flows is also possible, but less advised as this makes updating later on very cumbersome.
