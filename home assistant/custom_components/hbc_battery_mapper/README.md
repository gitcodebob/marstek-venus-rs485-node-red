# Home Battery Control Battery Mapper

This custom integration maps entities from any Home Assistant battery integration onto the `marstek_m1_*` to `marstek_m6_*` contract used by Home Battery Control.

Copy the complete `hbc_battery_mapper` directory to `/config/custom_components/`, restart Home Assistant, then add **Home Battery Control Battery Mapper** under **Settings > Devices & services > Add integration**. Add one integration entry per battery.

Set `input_number.house_battery_count` to the number of mapper entries. The dashboard contract check refreshes within one minute. If Step 2 remains red, it lists the mapped entity that is missing or whose source is unavailable; reconfigure that battery's mapper entry.

For integrations that expose Marstek's raw option names, map HBC **AI** to `trade_mode` and HBC **Stop** to `standby` (or `None`, when that is the zero-power option).

Version 0.1.2 and later creates the exact entity IDs required by HBC even when Home Assistant is configured to prefix generated IDs with device names. Existing mapper entries are renamed automatically after Home Assistant restarts.

Removing an entry removes that battery's mapped entities. Remove the custom integration directory only after deleting all of its entries.

Do not configure a mapper entry for a slot that already exposes Fonske-compatible entities. The setup flow blocks known entity-ID collisions.
