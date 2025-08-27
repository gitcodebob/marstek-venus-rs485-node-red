# Home Battery Control with Home Assistant & Node-RED

This project is designed for hobbyists who want to control home battery systems using Home Assistant and Node-RED. It provides ready-to-use flows and configuration examples, including a PID controller for advanced battery management. Use at your own discretion.

## Features
- **Node-RED Control Flows:** Easy to import and use Node-RED control flows for battery charge/discharge control.
- **Home Assistant Integration:** Example configuration for seamless integration with your smart home setup.
- **Customizable:** Adapt the flows and configuration to your specific battery hardware and automation needs.
- **Strategies:** Self-consumption or trading? Supports multiple charge/discharge strategies. And you can easily add more.
- **Updating:** Grab the latest control flow, without losing your personal configurations.

## Whats new?
[Release notes](RELEASE_NOTES.md)

## Getting Started

1. **Install Node-RED in Home Assistant**
   - Follow the official guide: [How to install Node-RED in Home Assistant](https://zachowj.github.io/node-red-contrib-home-assistant-websocket/guide/installation.html)

2. **Clone this repository**
   ```sh
   git clone https://github.com/gitcodebob/marstek-venus-rs485-node-red.git
   ```

3. **Configure Home Assistant**
   - Use the provided YAML files in the `home assistant` folder as follows.
     - Configuration files are grouped by type in subfolders:
       - `input_numbers/` for all numeric controls (e.g., PID tuning, limits)
       - `input_selects/` for selectable options (e.g., battery mode)
       - `template_sensors/` for custom sensors
     - The main `configuration.yaml` automatically includes all files from these directories, so you can add or move your own configuration files into these folders aswell.
     - This structure makes it easier to maintain, extend, and share your configuration.
   - **Adjust safety limits** in `input_numbers/input_number_house_battery_control.yaml` for the `error signal` and `PID output`.
     - See instruction [good to know](#good-to-know) for tips on this.

4. **Import Node-RED Flows**
    - In Node-RED, go to the menu > Import > and select the relevant JSON files from the `node-red` folder:
       - `00 master-switch-flow.json` (enable/disable control)
       - `01 start-flow.json` (the main flow -> requires config)
   - Import charging strategies:
       - `02 strategy-custom.json` (custom strategy)
       - `02 strategy-full-stop.json` (full stop strategy)
       - `02 strategy-self-consumption.json` (self-consumption strategy)
       - `02 strategy-time-of-use.json` (time-of-use strategy)
       - `02 strategy-trading.json` (trading strategy)

   - Go to the flow `Home Battery Start` and add/adjust nodes as needed per instructions.
       - Double click the white comment balloons to get help.
       - There are 3 steps to configure the flow. Complete all of them.
   - Deploy all flows.

5. **Firing up**
   - In Home Assistant import `dashboard.yaml` to create a dashboard, if you have not done so already.
   - Continue reading **before** switching the master battery mode to `Full Control` to activate.


> Disclaimer 
>
> You are responsible for configuring and operating your system safely. Monitor carefully. Be prepared to switch off battery control or disengage physically. 

### Good to know
- The P1 value is expected in Watt (w). If your meter supplies kW, multiply the P1 input * 1000

## Advanced Features

### Battery Life Protection
- **Minimum Idle Time:** Configurable minimum time before allowing battery grid relay disengagement
  - Reduces relay wear and extends battery life
  - Eliminates clicking/clacking noises during frequent charge/discharge transitions around 0W
  - Configurable through Home Assistant dashboard
- **Controller Output Protection:** Automatic protection based on battery maximum charge/discharge values
  - Prevents system from exceeding individual battery safety limits
  - Dynamically adjusts control output to stay within configured battery capabilities

### Performance Optimizations
- **40W Deadband:** Control loop only activates when P1 changes by more than 40W since last calculation
  - Significantly reduces CPU load during stable operation
  - Maintains precision while improving system efficiency
- **Reporting by Exception:** Action nodes only trigger when values actually change
  - Reduces unnecessary Home Assistant calls and system load

### Multi-Battery Management
- **Easy Battery Addition/Removal:** only the `Home Battery Start` flow requires editing to add/remove batteries. Strategy execution should remain unaltered.
- **3-Phase self-consumption:** if you require 0 W grid consumption on a per phase basis, the setup changes slightly. 
      
      Note: most homes get billed for the net total of all phases. If that is the case for you as well, ignore these instructions.

   - Duplicate `Home Battery Start` to `Home Battery Start L1`, `Home Battery Start L2`, `Home Battery Start L3` (one for each phase).
   - Configure batteries as per normal instruction. Keeping an eye on which battery is on which phase and thus which flow.
   - Deploy as per normal instructions.

## Operation and tuning (minimal)
For the `self-consumption strategy` a PID controler is used. This keeps grid input/output close to 0 W (the target grid consumption). This PID controler needs to be tuned to your home.

### What is a PID Controller
A proportional–integral–derivative controller (PID controller or three-term controller) is a feedback-based control loop mechanism commonly used to manage machines and processes that require continuous control and automatic adjustment. See [Wikipedia - Fundamental operation](https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller#Fundamental_operation)

### PID Operation
Complete the [getting started](#getting-started) first.

Open Node-RED (in an extra browser tab): 
- Open the debug bar to monitor messages.

In Home Assistant:
   - Find the Kp, Ki, Kd controls on the dashboard.
      - Set Kp = 0.5
      - Ki = 0
      - Kd = 0
   - Double check min/max SoC of your batteries
   - Double check min/max (dis)charge power of your batteries.

Click `Full control` and select `self-consumption` as a strategy.
- Now the controller will start managing the batteries.

Tip, observe the HA history graph containing:
   - P1 sensor (positive = drawing power from grid, negative = delivering power back to grid)
   - PID output (positive = batteries are charging, negative = discharging)
   - P-term, I-term, D-term (P+I+D = PID Output)
   - Error signal (what error is observed in Watts)

### PID Tuning
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
1. I get an error `"HomeAssistantError: Invalid value for input_number.house_battery_control_pid_output: 16743 (range -15000.0 - 15000.0)"`
   - A: check battery max (dis)charge values. Are these correct?
   - A: If your converter/batteries allows over 15kW of charging, adjust the limits in `home assistant\input_numbers\input_number_house_battery_control.yaml`

## Updating
Check the release notes which files have changed. In most cases your `Battery Start` flow stays unchanged which contain your handmade changes. Copy the other files and import Node-RED flows as per instruction.

## Credits
This PID controller flow is based on the approach by Ruald Ordelman. Many thanks for sharing your work and ideas with the community!

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
Specify your license here (e.g., MIT, Apache 2.0, etc.)

---
For questions or suggestions, open an issue on GitHub.
 