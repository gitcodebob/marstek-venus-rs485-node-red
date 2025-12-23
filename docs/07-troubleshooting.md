# Troubleshooting

## Common Issues

### The controller barely responds and (dis)charges only with a few Watts
**Answer:** Check if the P1 input is in Watt and not in kW.

### I get an error `"HomeAssistantError: Invalid value for input_number.house_battery_control_pid_output: 16743 (range -15000.0 - 15000.0)"`
**Answer:** 
- Check battery max (dis)charge values. Are these correct?
- If your converter/batteries allows over 15kW of charging, adjust the limits in `home assistant\input_numbers\input_number_house_battery_control.yaml`

### Modbus error function code: 0x3 exception: 2 (or similar)
When connecting LilyGo or similar to Marstek Venus V3 
**Answer:** 
- Update the latest firmware on your battery