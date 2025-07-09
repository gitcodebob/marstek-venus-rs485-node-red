# Home Battery Control with Home Assistant & Node-RED

This project is designed for hobbyists who want to control home battery systems using Home Assistant and Node-RED. It provides ready-to-use flows and configuration examples, including a PID controller for advanced battery management.

## Features
- **Node-RED PID Controller Flow:** Easily import and use a PID controller for battery charge/discharge control.
- **Home Assistant Integration:** Example configuration for seamless integration with your smart home setup.
- **Customizable:** Adapt the flows and configuration to your specific battery hardware and automation needs.

## Getting Started

1. **Install Node-RED in Home Assistant**
   - Follow the official guide: [How to install Node-RED in Home Assistant](https://zachowj.github.io/node-red-contrib-home-assistant-websocket/guide/installation.html)

2. **Clone this repository**
   ```sh
   git clone https://github.com/gitcodebob/marstek-venus-rs485-node-red.git
   ```

3. **Import Node-RED Flows**
   - In Node-RED, go to the menu > Import > select the JSON files from the `node-red` folder (e.g., `pid-controller.json`).
   - Deploy the flows.

4. **Configure Home Assistant**
   - Use the provided YAML files in the `home assistant` folder as examples for your own configuration.

## Credits
This PID controller flow is based on the approach by Ruald Ordelman. Many thanks for sharing your work and ideas with the community!

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
Specify your license here (e.g., MIT, Apache 2.0, etc.)

---
For questions or suggestions, open an issue on GitHub.
