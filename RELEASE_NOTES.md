# Release Notes
All releases follow Semantic Versioning (SemVer). Every release provides a fresh `home assistant/dashboard.yaml` to import.

## 2.5.2
- **Add: Node-RED examples directory with advanced strategy patterns**
  - Added `node-red/examples/` directory containing example flows for advanced users
  - Includes super-strategy example demonstrating how to create strategies that govern other sub-strategies
  - Updated README.md to reference the new examples directory
- **Fix: Updated README to remove references to deprecated strategy files**
  - Removed obsolete references to `02 strategy-time-of-use.json` and `02 strategy-trading.json` which were removed in v2.4.1

- **Files Changed:**
  - `node-red/examples/02 super-strategy.json` - New example flow showing advanced strategy pattern
  - `node-red/examples/EXAMPLES.md` - Documentation for example flows
  - `README.md` - Updated to mention examples directory and remove obsolete strategy references
  - `home assistant/dashboard.yaml` - Updated version to v2.5.2

## 2.5.1
- **Refactor: Replaced hardcoded 4-battery count in Master switch flow**
  - Dynamically supports 1 to many batteries
  - Removes Node-RED error messages when having less than the hardcoded amount of batteries

- **Files Changed:**
  - `node-red/00 master-switch-flow.json` - Refactored to use dynamic battery loop instead of hardcoded 4-battery limit

## 2.5.0
- **Feature: 4-battery support out of the box, and several minor bugfixes on dashboard**
  - Enhanced dashboard to properly display up to 4 batteries (M1-M4)
  - All Node-RED flows now fully support 4-battery configurations
  - Improved template sensors to include M4 battery data

- **Files Changed:**
  - `home assistant/dashboard.yaml` - Fixed M4 entity references and standardized sensor names
  - `home assistant/packages/house_battery_control.yaml` - Enhanced 4-battery template sensor support
  - `node-red/00 master-switch-flow.json` - Updated for full 4-battery support

## 2.4.1
- **Fix: Resolve full-stop strategy issues and remove deprecated strategies**
  - Fixed issues with the full-stop strategy functionality
  - Removed deprecated time-of-use and trading strategies to clean up codebase
  - Updated custom strategy configuration

- **Files Changed:**
  - `node-red/02 strategy-custom.json` - Updated custom strategy configuration
  - `node-red/02 strategy-full-stop.json` - Fixed full-stop strategy issues
  - `node-red/02 strategy-time-of-use.json` - Removed deprecated strategy
  - `node-red/02 strategy-trading.json` - Removed deprecated strategy

## 2.4.0
- **Fix: Timeout on Grid Charge or Wait Strategy**
  - Fixed timeout issues in grid charge or wait strategy flow
  - Moved calculation of some totals to the start flow for better performance and reliability

- **Files Changed:**
  - `node-red/01 start-flow.json` - Moved some summations to here, to help all strategies use consistent values.
  - `node-red/02 grid-charge-or-wait.json` - Fixed timeout issues in grid charge or wait strategy
  - `node-red/02 strategy-self-consumption.json` - Updated to use summation totals from start-flow

## 2.3.0
- **Feature: PID Preset System for Simplified Tuning**
  - Added PID presets dropdown with 4 preset options: Custom, Very safe, Safe, Regular
  - Simplified setup process for new users while maintaining advanced manual tuning options
  - Added safety warning display in dashboard for high PID values
  - Note: a new flow was added for presets to work

- **Files Changed:**
  - `README.md` - Added PID presets documentation with concise setup guidance
  - `home assistant/dashboard.yaml` - Added preset selector, safety warnings, and updated version to 2.3.0
  - `home assistant/packages/house_battery_control.yaml` - Added PID presets input select entity
  - `node-red/00 presets-switch-flow.json` - New flow for automatic preset-based PID parameter management

## 2.2.0
- **Feature: Battery Prioritization and Auto-Cycling**
  - Added battery charge order rotation to optimize battery wear during multi-battery setups
  - Implemented automatic priority cycling with configurable intervals (daily, weekly, never)
  - Auto-cycling occurs at 02:00 hrs daily or Sunday morning depending on configuration

- **Dashboard Improvements**
  - Added new battery priority settings section with intuitive controls
  - Reorganized settings for better user experience

- **Files Changed:**
  - `README.md` - Enhanced battery life documentation with detailed feature explanations
  - `home assistant/dashboard.yaml` - Added battery priority controls and reorganized settings (v2.2.0)
  - `home assistant/packages/house_battery_control.yaml` - Added priority and auto-cycling input entities
  - `node-red/01 start-flow.json` - Implemented battery priority management functionality

## 2.1.0
- **Feature: Migrate to Package-Based Home Assistant Configuration**
  - Consolidated scattered configuration files into organized packages directory
  - Moved all input entities (booleans, datetimes, numbers, selects) and template sensors into structured package files
  - Improved configuration organization and maintainability using Home Assistant package system
  - Enhanced sharing and version control of configuration components
  - Removed individual configuration files from separate type-based directories

- **Files Changed:**
  - `README.md` - Updated documentation to reflect new package-based structure
  - `home assistant/configuration.yaml` - Modified to use package-based configuration loading
  - `home assistant/dashboard.yaml` - Updated version number to 2.1.0
  - `home assistant/packages/house_battery_control.yaml` - New package containing core battery control entities
  - `home assistant/packages/house_battery_control_config.yaml` - New package containing configuration and dashboard entities
  - `home assistant/input_booleans/input_boolean_house_battery_control.yaml` - Removed (migrated to packages)
  - `home assistant/input_datetimes/input_datetime_house_battery_control.yaml` - Removed (migrated to packages)
  - `home assistant/input_numbers/input_number_house_battery_control.yaml` - Removed (migrated to packages)
  - `home assistant/input_selects/input_select_house_battery_control.yaml` - Removed (migrated to packages)
  - `home assistant/template_sensors/template_sensor_house_battery_control.yaml` - Removed (migrated to packages)
  - `home assistant/template_sensors/template_sensor_house_battery_dashboard.yaml` - Removed (migrated to packages)

## 2.0.1
- **Bugfixes and Battery Monitoring Improvements**
  - Fixed dashboard node-red deployment status after Home Assistant restart (Issue #8)
  - Battery energy remaining sensor now supports 1 to 3 batteries without requiring Home Assistant YAML editing
  - Time display format improved to consistent HH:MM format
  
- **Files Changed:**
  - `home assistant/input_booleans/input_boolean_house_battery_control.yaml` - Removed initial state from Node Red Ready boolean
  - `home assistant/template_sensors/template_sensor_house_battery_dashboard.yaml` - Enhanced battery monitoring sensors
  - `home assistant/dashboard.yaml` - version number

## 2.0.0
- **BREAKING CHANGES: New Interactive Dashboard and Improved Installation Experience**
  - Complete dashboard redesign with guided installation steps and configuration validation
  - Dashboard now guides users through install steps and ensures correct configuration
  - Unlimited battery count support - add/remove batteries with one click
  - **IMPORTANT**: Existing users need to reconfigure their P1 sensor using the new dashboard guidance
  - Import the new dashboard and follow the install instructions to configure the P1 sensor properly

- **Files Changed:**
  - `.github/copilot-instructions.md` - Updated GitHub Copilot instructions
  - `.gitignore` - Updated ignore patterns
  - `README.md` - Updated documentation and installation instructions
  - `home assistant/configuration.yaml` - Enhanced configuration structure
  - `home assistant/dashboard.yaml` - Complete dashboard redesign with guided setup
  - `home assistant/input_booleans/input_boolean_house_battery_control.yaml` - Updated boolean controls
  - `home assistant/input_numbers/input_number_house_battery_control.yaml` - Enhanced numeric controls
  - `home assistant/template_sensors/template_sensor_house_battery_control.yaml` - Improved control sensors
  - `home assistant/template_sensors/template_sensor_house_battery_dashboard.yaml` - New dashboard template sensor
  - `node-red/01 start-flow.json` - Enhanced main flow logic
  - `node-red/02 grid-charge-or-wait.json` - Improved grid charging strategy
  - `node-red/02 strategy-self-consumption.json` - Enhanced self-consumption strategy

## 1.2.0
- **Feature: Added Grid-Charge-or-Wait Strategy**
  - Introduced new battery control strategy for _Timed grid charging_ management

- **Files Changed:**
  - `node-red/02 grid-charge-or-wait.json` - New grid-charge-or-wait strategy flow
  - `node-red/01 start-flow.json` - Updated server configuration and enhanced compatibility
  - `home assistant/configuration.yaml` - Configuration updates for new strategy support
  - `home assistant/dashboard.yaml` - Dashboard enhancements for improved user interface

## 1.1.0
- **Feature: Refactor to 'msg' based flows to prevent race conditions**
  - Eliminated race conditions when using flow-level variables by moving to message-based architecture
  - Enhanced start flow with strategy execution time monitoring and rate limiter functionality
  - Improved reliability and performance across all battery control strategies
  - Better flow state management and reduced potential for timing conflicts

- **Files Changed:**
  - `node-red/01 start-flow.json` - Added execution time monitoring and rate limiter
  - `node-red/02 strategy-custom.json` - Refactored to use msg object instead of flow variables
  - `node-red/02 strategy-full-stop.json` - Refactored to use msg object instead of flow variables
  - `node-red/02 strategy-self-consumption.json` - Refactored to use msg object instead of flow variables
  - `node-red/02 strategy-time-of-use.json` - Refactored to use msg object instead of flow variables
  - `node-red/02 strategy-trading.json` - Refactored to use msg object instead of flow variables

## 1.0.1
- **Bugfix: Timeout messages of self-consumption strategy in start flow**
  - Fixed timeout message handling in the initialization flow for self-consumption strategy
  - Improved error messaging and flow reliability

- **Files Changed:**
  - `node-red/01 start-flow.json` - Fixed timeout message handling
  - `node-red/02 strategy-self-consumption.json` - Updated self-consumption strategy

## 1.0.0 - Strategy-Based Architecture
- **Major Feature: Multi-Strategy Battery Control System**
  - Complete restructure to strategy-based architecture for enhanced flexibility
  - Added multiple battery control strategies: custom, full-stop, self-consumption, time-of-use, and trading
  - Improved flow organization with numbered prefixes for logical ordering and better maintainability
  - Enhanced Home Assistant configuration and dashboard with new strategy controls

- **Breaking Changes:**
  - Node-RED flow file structure completely reorganized
  - Flow naming convention changed to numbered strategy-based system
  - Enhanced configuration structure may require adjustment of existing setups

- **Files Changed:**
  - `home assistant/dashboard.yaml` - Enhanced dashboard with new controls
  - `home assistant/input_numbers/input_number_house_battery_control.yaml` - Updated configuration
  - `home assistant/input_selects/input_select_house_battery_control.yaml` - Enhanced selects
  - `node-red/00 master-switch-flow.json` - Renamed from 03 master-switch-flow.json
  - `node-red/01 start-flow.json` - Updated initialization flow
  - `node-red/02 strategy-custom.json` - New custom strategy flow
  - `node-red/02 strategy-full-stop.json` - New full-stop strategy flow
  - `node-red/02 strategy-self-consumption.json` - Renamed from 02 control-flow.json
  - `node-red/02 strategy-time-of-use.json` - New time-of-use strategy flow
  - `node-red/02 strategy-trading.json` - New trading strategy flow

## 0.3.0
- **New Feature: Minimum Idle Time for Battery Grid Relay Disengagement**
  - Introduced minimum idle time before allowing a battery to disengage its grid relay
  - Improves battery life by reducing wear and tear on relay components
  - Enables seamless operation around the 0W regime - Marstek batteries now switch from charge/discharge without clacking noises
  - Home Assistant dashboard now displays idle time and other advanced features

- **New Feature: Controller Output Protection**
  - Added controller output protection based on maximum charge/discharge values of the batteries
  - Shows status at NodeRED node and debug log
  - Automatically adjusts control output to stay within configured battery capabilities

- **Improved: Node-RED Layout for Multi-Battery Setup**
  - Enhanced Node-RED layouts to quickly add/remove 3rd battery
  - Node-RED flow `Home Battery Start > Set Batteries` now always outputs in alphabetical order of battery.id (e.g., "M1", "M2", "M3") regardless of solution_array order

- **Performance Optimizations**
  - Reduced CPU load and action calls by adding Reporting by Exception on Action Nodes
  - Introduced 40W deadband to reduce CPU load - control loop only triggers if P1 changes by more than 40W since last successful calculation
  - Significantly decreases control loop frequency during stable usage situations

- **User Experience Improvements**
  - Renamed Node-RED flows with numbered filenames (01, 02, 03) for more intuitive use

## 0.2.4
- Patch: Improve derivative term and bumpless operation logic in control flow
    - The derivative term now takes the derivative of the (input) smoothed error.
        - This allows for more aggressive D-term tuning at higher input smoothing levels.
        - This combats oscillations and overshoot, without causing runaways because of noise amplification (which is smoothed out at 50% and higher levels).
    - Implementation result: changed the "Bumpless operation - changing target grid consumption" group:
        - Added logic to distinguish between setpoint changes and steady-state, using a new switch node.
        - Added a function to calculate the derivative of the error when the setpoint changes, and another for the process variable otherwise.
    - Changed files: node-red/control-flow.json, RELEASE_NOTES.md


## 0.2.3
- Refactor: Modularize Home Assistant configuration using directory-based includes for input numbers, input selects, and template sensors.
- Split configuration into separate files for easier management and extension.
- Update Node-RED batteries flow with new group, node positions, and linking instructions.
- Clarify and expand Copilot instructions for commit workflow.

## 0.2.2
- Feat: Add gain scheduling and stability monitoring to control flow.
    - Implement gain scheduling logic for PID controller, including master gain switching based on standard deviation and disturbance detection.
    - Add stability monitoring nodes and debug outputs for rapid loss/regaining of control.
    - Refine battery charge limiting thresholds and update function logic.
    - Rename and reorganize groups and nodes for clarity.
    - Changed file: node-red/control-flow.json

## 0.2.1
- Node-RED control flow: Added output filtering, error signal dampening, and deviation analytics nodes.
- Home Assistant: Updated dashboard and expanded input_numbers.yaml with PID tuning, dampening, and analytics controls for improved battery management.

## 0.2.0
- Major improvement: Split the all-in-one Node-RED flow into three separate flows (`batteries-flow.json`, `control-flow.json`, `master-switch-flow.json`).
- This allows the PID-control flow to be updated independently, without affecting user battery configurations.

## 0.1.11
- Important bugfix: Fix configuration issue causing PID control values to reset after Home Assistant restart
- See: [input_number docs](https://www.home-assistant.io/integrations/input_number/#restore-state)

## 0.1.10
- bugfix: solutions for full/empty battery added

## 0.1.9
- Add option to prioritize discharging/charging the same battery; update output structure docs

## 0.1.8
- Enable bumpless Ki tuning and add example Home Assistant dashboard

## 0.1.7
- Add safety limit configuration instructions and charge limiting debug info

## 0.1.6
- Update README with detailed tuning and operation instructions

## 0.1.5
- Update README with project overview and getting started; add PID controller flow; remove old flows.json

## 0.1.4
- Update project files: add Home Assistant config, Node-RED, and README

## 0.1.3
- Merge branch 'master'

## 0.1.2
- Simplify flows configuration with gain scheduling comment

## 0.1.1
- Initial commit: Add Node-RED flows for Marstek Home Batteries RS485 control

## 0.1.0
- Initial commit
