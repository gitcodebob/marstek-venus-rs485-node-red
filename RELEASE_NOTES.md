# Release Notes
All releases follow Semantic Versioning (SemVer).

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
