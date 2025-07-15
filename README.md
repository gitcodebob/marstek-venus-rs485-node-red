# Home Battery Control with Home Assistant & Node-RED

This project is designed for hobbyists who want to control home battery systems using Home Assistant and Node-RED. It provides ready-to-use flows and configuration examples, including a PID controller for advanced battery management. Use at your own discretion.

## Features
- **Node-RED PID Controller Flow:** Easily import and use a PID controller for battery charge/discharge control.
- **Home Assistant Integration:** Example configuration for seamless integration with your smart home setup.
- **Customizable:** Adapt the flows and configuration to your specific battery hardware and automation needs.
- **Updating:** Grab the latest control flow, without losing your personal configurations.

[Release notes](RELEASE_NOTES.md)

### What is a PID Controller
A proportional–integral–derivative controller (PID controller or three-term controller) is a feedback-based control loop mechanism commonly used to manage machines and processes that require continuous control and automatic adjustment. See [Wikipedia - Fundamental operation](https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller#Fundamental_operation)

## Getting Started

1. **Install Node-RED in Home Assistant**
   - Follow the official guide: [How to install Node-RED in Home Assistant](https://zachowj.github.io/node-red-contrib-home-assistant-websocket/guide/installation.html)

2. **Clone this repository**
   ```sh
   git clone https://github.com/gitcodebob/marstek-venus-rs485-node-red.git
   ```

3. **Configure Home Assistant**
   - Use the provided YAML files in the `home assistant` folder as examples for your own configuration.
   - Adjust safety limits in `input_numbers.yaml` for the `error signal` and `PID output`. 
      - See instruction [good to know](#good-to-know)  
   - Know issue: `input_select.marstek_master_battery_mode` is missing in this project.

4. **Import Node-RED Flows**
   - In Node-RED, go to the menu > Import > and select all three JSON files from the `node-red` folder:
     - `batteries-flow.json` 
     - `control-flow.json`
     - `master-switch-flow.json`
   - Go to tab `Home Battery IO` and add/adjust nodes per instruction
      - Don't forget to update the `mapping` node to match your added/adjusted nodes.
   - Deploy the flows.

5. **Firing up**
   - In Home Assistant import `dashboard.yaml` to create a dashboard, if you have not done so already.
   - Continue reading before switch the master battery mode to `Full Control` to activate.
   
   Disclaimer: You are responsible for configuring and operating your system safely. Monitor carefully. Be prepared to switch off battery control or disengage physically. 

### Good to know
- The P1 value is expected in Watt (w). If your meter supplies kW, multiply the P1 input * 1000
- The sensors have safety limits. Configured to 3600W: the maximum power any inhouse transmission line is allowed to carry.
   - These can be found in `home assistant\input_numbers.yaml`
   - If there are other devices on the fuse box group of your battery: set it to 800W
   - If you have each battery on its own fuse box group: set the value to 3600W x the number of batteries.

## Operation and tuning (minimal)
### Operation
In Home Assistant:
   - Find the Kp, Ki, Kd controls on the dashboard.
      - Set Kp = 0.5
      - Ki and Kd = 0
   - Configure batteries to RS485 enable
   - Double check min/max SoC and (dis)charge settings
   - Open Node-RED 
      - Goto `batteries` section, adjust/add sensor names to reflect your batteries sensor names.
      - If not using a `Master Control` input_select, then tie the P1 directly to the first node of the batteries section
   - Deploy the flow

Now the controller will start managing the batteries.

Tip, observe the HA history graph containing:
   - P1 sensor (positive = drawing power from grid, negative = delivering power back to grid)
   - PID output (positive = batteries are charging, negative = discharging)
   - P-term, I-term, D-term (P+I+D = PID Output)
   - Error signal

### Tuning
Use the [Ziegler-Nichols method]((https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller#Ziegler%E2%80%93Nichols_method)) for a starting point. 

1. Set Kp to say 1.0, and be prepared to decrease it fast if needed.
1. If the system oscillates in a steady state -> export the HA History graph to CSV.
    - increase Kp when not resonating
    - decrease Kp if the system runs off. (stay alert, not to damage your system)
1. Determine the resonant frequency. E.g. by using [HA-history-graph-csv-export-analysis
](https://github.com/gitcodebob/HA-history-graph-csv-export-analysis)
1. T<sub>u</sub> = 1 / `<resonant frequency>` and K<sub>u</sub> = your current K<sub>p</sub> during resonance
1. Use the table of the [Ziegler-Nichols method]((https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller#Ziegler%E2%80%93Nichols_method)) to get a baseline. 
    - This baseline can be a bit aggressive.

Note: every system is different and your home is unique. Tune in small increments from here. 

## Troubleshooting
1. The controller barely responds and (dis)charges only with a few Watts
   - A: check if the P1 input is in Watt and not in kW.
1. I get an error `"HomeAssistantError: Invalid value for input_number.house_battery_control_pid_output: 4249 (range -3600.0 - 3600.0)"`
   - A: read [good to know](#good-to-know) for instructions to set safety limits correctly.

## Updating
Import the `control-flow.json` into the `Home Batteries IO` flow. Done!

## Credits
This PID controller flow is based on the approach by Ruald Ordelman. Many thanks for sharing your work and ideas with the community!

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
Specify your license here (e.g., MIT, Apache 2.0, etc.)

---
For questions or suggestions, open an issue on GitHub.
 