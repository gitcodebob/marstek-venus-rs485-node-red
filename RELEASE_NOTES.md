# Release Notes
All releases follow Semantic Versioning (SemVer). Every release provides a fresh `home assistant/dashboard.yaml` to import.

## 4.5.0
- **Feature: Peak Shaving & grid limits**
  * When Peak Shaving you utilize your batteries (when able) to reduce import/export peaks on your grid connections
  * Ideal for 'capacity tariff' contracts (aka CAPTAR, capaciteitstarief)
  * Or to reduce risk of blowing fuses when using multiple heavy appliances (EV, heat-pumps) under changing PV conditions
  * Note: all strategies seamlessly allow peak shaving to take control. Excl. Full Stop, which takes precedence.
  * Note: configurable grid power limits for both import and export thresholds
  * Note: captar usually only requires _import_ limiting
  * Disclaimer: peak shaving is not a safeguard or replacement for peak protection, overload protection or fuses.

- **Improvements: Power limit configuration**
  * Refactored power limit settings from strategy-specific to global configuration
  * Charge and Sell strategies now use centralized grid power limits
  * The limits can now be found on the settings tab
  * Onboarding now contains a step to review battery and grid limits 

- **Fix: Removed deprecated Zonneplan workaround**
  * Removed "Zonneplan (one)" data source option - no longer needed after sensor naming was fixed

- **Fix: Missing icons**
  * Added missing icons to various UI elements

- **Discussion points**
  * Charge / Sell perform power limiting, but do not peak shave until they reach their charge/sell goal. 
    * E.g. Charge does not discharge to help peak shave unless it's desired SoC/reserve has been reached.
  * A lack of available capacity or charge to perform the peak shaving is not communicated to the user.
    * E.g. if your batteries are empty, they cannot perform an import peak shave. This can be inferred, but is not explicitly visible. 

- **Files Changed:**
  - `home assistant/dashboard.yaml`
  - `home assistant/packages/house_battery_control.yaml`
  - `node-red/01 start-flow.json`
  - `node-red/02 strategy-charge.json`
  - `node-red/02 strategy-dynamic.json`
  - `node-red/02 strategy-self-consumption.json`
  - `node-red/02 strategy-sell.json`

## 4.4.2
- **Fix: Zonneplan integration sensor name change (fixes #76)**
  * Added support for renamed Zonneplan sensor via new datasource option 'Zonneplan (one)'

- **Fix: Spelling corrections in documentation and dashboard**
  * Corrected 17 spelling errors across documentation files and dashboard
  * Thanks to Residenteur, sammyjo468, BSmelik and others for pointing out the eye wattering errors and promoting some maintenance.

- **Files Changed:**
  - `home assistant/dashboard.yaml`
  - `node-red/02 strategy-dynamic.json`

## 4.4.1
- **Fix: Frank Energie integration support (fixes #75)**
  * Added support for Frank Energie via the [HiDiHo01 Home Assistant integration](https://github.com/HiDiHo01/home-assistant-frank_energie)
  * Dynamic strategy now includes proper sensor configuration for Frank Energie users

- **Fix: Dollarless JSONata not working for some users (fixes #72)**
  * Resolved compatibility issues with JSONata expressions

- **Setup: Improved P1 sensor configuration instructions (fixes #64)**
  * Enhanced documentation in getting started guide for P1 meter setup
  * Clarified configuration examples in `house_battery_control_config.yaml`

- **Documentation: Alternative energy provider guidance (fixes #57)**
  * Added suggestions for users whose energy provider isn't directly supported
  * Improved dynamic strategy setup documentation

- **Files Changed:**
  - `home assistant/dashboard.yaml`
  - `home assistant/packages/house_battery_control_config.yaml`
  - `node-red/02 strategy-dynamic.json`

## 4.4.0
- **Feature: Selectable strategies per period in Dynamic strategy**
  * **Choose your strategy per period** - Select which strategy to use during cheapest, expensive, and regular periods independently
  * **Baseline strategy** - Choose between Charge PV, Self-consumption, or Full stop for regular hours
  * **Cheapest period strategy** - Choose between Charge or Charge PV during low-price windows
  * **Expensive period strategy** - Choose between Self-consumption or Sell during high-price windows
  * **Smart activation thresholds** - Configure when cheapest period activates (tariff limit) and when expensive period activates (minimum price spread)
  * **Price data table (insights mode)** - Table shows hourly prices for today and tomorrow to help you analyze strategy performance, when insights mode is enabled
  * **Estimated profit calculator** - See the estimated profit per kWh based on current price spreads
  * **Negative price support** - Cheapest period threshold can now be set to 0, enabling strategies that only activate during negative energy prices

- **Improvements in Dynamic strategy**
  * **Improved period detection** - Checks period every 15 mins accurately and without delay
  * **Better update frequency** - Data Source updates every 60 minutes (this could be turned into 1x per day at 15:00 hrs)

- **Fix: Insight Mode reliability (formerly Debug Mode)**
  * **Possibly resolved issue #63** - Fixed Insight Mode not working reliably for some users
  * **Renamed "Debug Mode" to "Insight Mode"** - Avoids confusion between Node-RED's "debug NNNode" vs HBC's "debug MMMode"

- **Files Changed:**
  - `home assistant/dashboard.yaml`
  - `home assistant/packages/house_battery_control.yaml`
  - `node-red/01 start-flow.json`
  - `node-red/02 strategy-dynamic.json`

## 4.3.3
- **[Docs.homebatterycontrol.com live](https://docs.homebatterycontrol.com)** celebrating the supporters of this project
  * **Updated documentation links** - All documentation now points to docs.homebatterycontrol.com
  * **Documentation navigation and table of contents** - The docs now have next/previous navi and a Table of Contents
  * **Extravagant unnecessary styling** - Yes, required.

- **Dashboard tweaks**
  * **More pretty info & warnings** - Replaced old formatting with modern ha-alert components
  * **Tweaked texts and visibility** - mostly on the home

- **Experimental** an 'all-flows-in-file.json' has been added
  * To possibly ease initial project import or updates. Feedback? Join our Discord.

- **Files Changed:**
  - `home assistant/dashboard.yaml`

## 4.3.2
- **Fix: Improve PID controller safety, logging, and integral term handling**
  * **Controller disabled warning** - Added clear warning message when all PID gains are zero to prevent silent failures
  * **Simplified load distribution** - Removed redundant debug flag system and streamlined logging for better maintainability
  * **Integral term safety** - Fixed divide-by-zero issue when Integral gain was set to 0, improving controller robustness

- **Files Changed:**
  - `home assistant/dashboard.yaml`
  - `node-red/02 strategy-self-consumption.json`

- **License Changed:**
  - This open source project started in the community of tinkerers, hobbyists and off-time engineers and should stay available for said community. Providing an open way to control and manage your energy systems. And I aim for any development on the project to also benefit said community.
  - The GPL 3.0 license seems to better reflect this goal. This and upcoming versions will be released using this license.
  - Kind regards and happy tinkering, @gitcodebob

## 4.3.1
- **Fix: Deprecated YAML syntax**
  * **Trigger platform** - Updated event trigger syntax in trace sensor from deprecated `platform: event`

- **Files Changed:**
  - `home assistant/packages/house_battery_control.yaml`

## 4.3.0
- **Feature: new Sell strategy and updated charge strategy**
  * **Configurable goals** - Control behavior with SoC target, Energy target or unlimitted goals.
  * **Configurable power** - Set for maximum or power limited (dis)charging. Choosing between speed or lower peak power.
  * **Rebuilt charge control** - Charge strategy rebuilt to match Sell strategy capabilities with maximum power and regulated charging options
  * **Dashboard controls** - New UI controls for charge and sell settings
  * **Note** - Please review your Charge Strategy settings. Old charge settings have reset or been discarded. 

- **Improvement: Exception handling**
  * **Error resilience** - All strategy flows now handle unhandled exceptions gracefully
  * **Better diagnostics** - Exceptions are caught, logged and displayed on the debug dashboard for troubleshooting

- **Improvement: Version labeling**
  * **Clear versioning** - All strategy flow tabs now display version numbers

- **Files Changed:**
  - `home assistant/dashboard.yaml`
  - `home assistant/packages/house_battery_control.yaml`
  - `node-red/01 start-flow.json`
  - `node-red/02 strategy-charge-pv.json`
  - `node-red/02 strategy-charge.json`
  - `node-red/02 strategy-dynamic.json`
  - `node-red/02 strategy-full-stop.json`
  - `node-red/02 strategy-self-consumption.json`
  - `node-red/02 strategy-sell.json`
  - `node-red/02 strategy-timed.json`

## 4.2.0
- **Feature: Hideable onboarding section**
  * **Hide onboarding UI** - New button allows users to hide the onboarding section after completing setup

- **Files Changed:**
  - `home assistant/dashboard.yaml`
  - `home assistant/packages/house_battery_control.yaml`

## 4.1.0
- **Feature: Configurable battery charge limits**
  * **User-controlled SoC limits** - New input helpers allow you to set custom minimum and maximum State of Charge (SoC) limits per battery
  * **Override hardware defaults** - The system now always uses these input helpers instead of reading limits from the battery device, providing more flexibility
  * **Settings tab** - The battery configuration settings are now consolidated on the settings tab
  * **Documentation included** - New section in Advanced Features explains how to use charge limits effectively
  * Kuddos to [@hugovdberg](https://github.com/Hugovdberg)

- **Fix: Grid power sensor configuration**
  * Corrected grid power sensor name property in the `house_battery_control_**config**.yaml` to prevent Home Assistant from generating incorrect entity id.
  * Note: this is relevant for new users and fresh installs only. 

- **Files Changed:**
  - `home assistant/dashboard.yaml`
  - `home assistant/packages/house_battery_control.yaml`
  - `home assistant/packages/house_battery_control_config.yaml`
  - `node-red/01 start-flow.json`

## 4.0.0
- **Feat: Add visual flow execution tracking and detailed logging to dashboard**
  * **Visual flow execution tracking** - You can now see which strategy flows your system executed and in what order, helping you understand the decision-making process in real-time
  * **Execution time transparency** - Each flow step displays its duration in seconds, allowing you to identify if any part of your system is running slower than expected
  * **Performance insights** - The "Total" execution time at the bottom of the trace shows you how long your entire battery control cycle takes, helping to identify fitting rate limits
  * **Detailed explanations in plain language** - The system now logs human-readable explanations of what it's doing, color-coded by severity (info=teal, log=green, warn=orange, error=red), with emoji indicators for quick scanning
  * **Troubleshooting made easy** - When something isn't working as expected, you can toggle Debug Mode on to see up to 100 detailed log entries showing what decisions the system made and why
  * **Battery operation clarity** - Specific logs explain why each battery was charged, discharged, skipped, or stopped, including SoC percentages and power levels
  * **Strategy switching transparency** - You can now see why the system switched between strategies (e.g., from default to expensive period) with tariff comparisons and price deltas
  * **Auto-disable safety feature** - Debug mode automatically turns off after 5 minutes to prevent performance degradation from excessive logging
  * **Clearer errors/warnings** - When *expected errors* occur, the log explains exactly what's wrong and which flow/node encountered the problem
  * **Cleaner logbook** - Debug sensors are excluded from Home Assistant's main logbook to prevent clutter while still being accessible in the Debug dashboard

- **Tweaks and fixes**
  * Dynamic Strategy only looks at today by default. (Switches over at midnight.)
  * Examples `node-red/examples` have been updated for v4 layout

- **Files Changed:**
  - `home assistant/dashboard.yaml`
  - `home assistant/packages/house_battery_control.yaml`
  - `node-red/01 start-flow.json`
  - `node-red/02 strategy-charge-pv.json`
  - `node-red/02 strategy-charge.json`
  - `node-red/02 strategy-dynamic.json`
  - `node-red/02 strategy-full-stop.json`
  - `node-red/02 strategy-self-consumption.json`
  - `node-red/02 strategy-timed.json`

## 4.0.0 - Release candidate 1
- **Feat: Improved system insight and documentation**
  - Improved dashboard layout with better configuration guidance
  - Show active sub-strategy on home tab and all strategy tabs
  - Add debug mode for troubleshooting
  - Debug mode includes execution trace display showing current system activity
  - Update strategy documentation with clearer examples

- **Files Changed:**
  - `home assistant/dashboard.yaml`
  - `home assistant/packages/house_battery_control.yaml`
  - `node-red/01 start-flow.json`
  - `node-red/02 strategy-charge-pv.json`
  - `node-red/02 strategy-charge.json`
  - `node-red/02 strategy-dynamic.json`
  - `node-red/02 strategy-full-stop.json`
  - `node-red/02 strategy-self-consumption.json`
  - `node-red/02 strategy-timed.json`

## 3.5.8
- **Docs: Improve documentation formatting and navigation**
  - Add GitHub Pages link to README
  - Restructure dynamic strategy setup guide with clearer video sections and internal links

- **Files Changed:**
  - None, docs only.

## 3.5.7
- **Fix: P1 rate limitter making application unresponsive at constant grid_power values**
  - Resolved issue where rate limiter prevented control loop from executing when grid power remained constant
  - Improved system responsiveness during stable grid conditions

- **Files Changed:**
  - `node-red/01 start-flow.json`
  - `home assistant/dashboard.yaml`

## 3.5.6
- **Docs upgrade: Restructured documentation and added GitHub Pages support**
  - Separate README into compact landing page and detailed docs in /docs folder
  - Add setup tips when running Node-RED in docker (reported by https://github.com/jeroen85)
  - Add strategy explainers and videos
  - Add GitHub Pages support
  - Update all existing documentation links in README and dashboard.yaml

- **Files Changed:**
  - `home assistant/dashboard.yaml`

## 3.5.5
- **Docs: Add Modbus connection guide and improve dashboard UX**
  - Add new "Modbus to Home Assistant" section with Fonske project examples
  - Improve dashboard visibility and warning colors
  - Add Dynamic strategy information table

- **Files Changed:**
  - `home assistant/dashboard.yaml`

## 3.5.4
- **Chore: Update copilot instructions and minor improvements**
  - Add initial value of 0 to `house_target_grid_consumption_in_w` as new users were reporting a -15000 and getting confused
  - PID output is no longer excluded from the data recorder
  - Add Tibber sensor default configuration for core integration
  - Remove min/max SoC reference from README (no longer applicable with V3 compatibility)

- **Files Changed:**
  - `.github/copilot-instructions.md` - Updated commit workflow to automatically include specific files in release notes
  - `home assistant/packages/house_battery_control.yaml` - Added initial value and adjusted recorder exclusions
  - `node-red/02 strategy-dynamic.json` - Improved test area organization and added Tibber configuration

## 3.5.3
- **Fix: Replace dynamic SoC cutoff capacity with hardcoded values for Marstek V3 compatibility**
  - Replaced API calls to fetch `discharging_cutoff_capacity` and `charging_cutoff_capacity` entities with hardcoded values (12% min, 100% max)
  - Marstek V3 does not expose these SoC min/max parameters, so fixed values are used to maintain functionality
  - This change ensures compatibility with both Marstek V2 and V3 hardware versions

- **Files Changed:**
  - `node-red/01 start-flow.json` - Replaced two API current-state nodes with change nodes setting fixed SoC cutoff values

## 3.5.2
- **Fix: Improve dynamic strategy configuration and template sensor**
  - Updated `house_battery_strategy_dynamic_expensive_hrs` maximum value from 8 to 23 hours for greater flexibility
  - Added missing `unique_id` to "EV is charging" template sensor for proper entity management
  - Added complete configuration support for "Tibber, Nordpool (core)" data source with proper attribute mappings

- **Files Changed:**
  - `home assistant/packages/house_battery_control.yaml` - Updated expensive hours max value and added template sensor unique_id
  - `node-red/02 strategy-dynamic.json` - Enhanced data source configuration for Tibber/Nordpool and improved comments

## 3.5.1
- **Fix: Excessive Home Assistant Logbook Entries**
  - Added `recorder:` configuration to `house_battery_control.yaml` package to filter high-frequency technical entities from the logbook
  - Reduces logbook noise by ~90-95% while preserving user-relevant events (Master Switch, Strategy changes, configuration updates)
  - Excluded entities (14 total):
    - 9 PID control/analytics signals (updated every 2-40 seconds during operation)
    - 3 Dynamic strategy calculated averages (updated hourly)
    - 1 Total available energy status field
    - 1 Battery time remaining template sensor
  - History graphs and statistics remain fully functional
  - User configuration changes and important state transitions still appear in logbook

- **Files Changed:**
  - `home assistant/packages/house_battery_control.yaml` - Added recorder exclusion configuration
  - `home assistant/dashboard.yaml` - Bumped version to v3.5.1
  - `README.md` - Added logbook filtering documentation

## 3.5.0
- **Feature: Sunset of Grid-Charge-Or-Wait Strategy**
  - The deprecated "Grid-Charge-Or-Wait" strategy has been completely removed from the system.
  - All associated entities, configuration options, and Node-RED flows have been deleted.
  - This strategy was deprecated in version 3.0.0 and has now been fully removed.
  - **Migration Path:** Users previously using Grid-Charge-Or-Wait should migrate to:
    - **Dynamic Strategy** - For users with dynamic tariff contracts and the Cheapest Hours HACS add-on
    - **Timed Strategy** - For scheduled charging/discharging with time-based control

- **Files Changed:**
  - `home assistant/packages/house_battery_control.yaml` - Removed all Grid-Charge-Or-Wait entities (input_boolean, input_datetime, input_number, input_select) and strategy option
  - `home assistant/dashboard.yaml` - Removed Grid-Charge-Or-Wait configuration section and bumped version to v3.5.0
  - `node-red/deprecated/02 grid-charge-or-wait.json` - DELETED: Completely removed deprecated flow

## 3.4.0
- **Feature: Dynamic Strategy with Cheapest Hours Integration**
  - Added a new "Dynamic" strategy that leverages the "Cheapest Hours" integration (via HACS) to optimize battery usage based on dynamic energy tariffs.
  - Automatically charges during the cheapest hours and discharges or holds during expensive periods.
  - Requires the "Cheapest Hours" HACS add-on and a dynamic energy contract.
    - See: https://github.com/TheFes/cheapest-energy-hours/blob/main/documentation/1-source_data.md#data-provider-settings
  - Confirmed data source support: 
    - Zonneplan
  - Unconfirmed support:
    - Amber Electric
    - EasyEnergy, EnergyZero (core)
    - ENTSO-E
    - Frank Energie
    - GE-Spot
    - Tibber, Nordpool (core)
    - Tibber (custom)
    - Nordpool (custom)
    - PVPC (Spain)
    - Octopus Energy
    - Omie

- **Files Changed:**
  - `node-red/02 strategy-dynamic.json` - NEW FILE: Dynamic strategy implementation
  - `home assistant/packages/house_battery_control.yaml` - Added Dynamic strategy options and input_datetime entities
  - `home assistant/dashboard.yaml` - Bumped header to `v3.4.0`

## 3.3.1
- **Fix: Dashboard tab navigation**
  - Dashboard layout now uses `navigate` to switch tabs instead of `url`, improving robustness when switching views in Home Assistant.

- **Files Changed:**
  - `home assistant/dashboard.yaml` - Bumped header to `v3.3.1` and updated navigation behavior
  - `RELEASE_NOTES.md` - Added 3.3.1 release note

## 3.3.0
- **Feature: Third time period for Timed Strategy**
  - Added 3rd period to timed strategy, allowing up to three distinct time periods per day
  - This covers the use case of tackling 2 price peaks (morning and afternoon) and 1 charging period a day.
  - Each period can run different sub-strategies (Self-consumption, Charge, Charge PV, Full stop)

- **Files Changed:**
  - `home assistant/dashboard.yaml` - Added Period C UI controls and configuration
  - `home assistant/packages/house_battery_control.yaml` - Added Period C entities (datetime inputs, boolean toggle, strategy selector)
  - `node-red/02 strategy-timed.json` - Implemented Period C logic with cascading time-period evaluation

## 3.2.0
- **Feature: Charge PV Strategy**
  - New "Charge PV" strategy option available in both main battery strategy and timed sub-strategies
  - Batteries charge only when surplus solar (PV) power is available
  - Batteries will not discharge - ideal for maximizing self-consumption of solar energy
  - Perfect for sunny days when you want to store excess solar without drawing from the grid

- **Improve: Enhanced battery control and stability**
  - Updated Home Assistant WebSocket integration to latest version (0.80.3)
  - Reduced unnecessary system updates with improved change detection
  - Better visual feedback in dashboard with adjusted battery status tile layout
  - Improved clarity for EV stop trigger with updated icons and descriptions

- **Files Changed:**
  - `home assistant/dashboard.yaml` - UI improvements for battery status and EV trigger
  - `home assistant/packages/house_battery_control.yaml` - Added Charge PV strategy options
  - `node-red/02 strategy-charge-pv.json` - NEW FILE: Charge PV strategy implementation
  - `node-red/02 strategy-self-consumption.json` - Enhanced discharge control, updated WebSocket module
  
  Optional:
  - `node-red/01 start-flow.json` - Updated WebSocket module
  - `node-red/02 strategy-charge.json` - Updated WebSocket module, added flow description
  - `node-red/02 strategy-timed.json` - Updated WebSocket module, improved debugging

## 3.1.0
- **Feature: EV Stop Trigger to disable battery operation**
  - Added EV Stop Trigger functionality that overrules ALL active strategies when triggered
  - Prevents home batteries from discharging during EV charging or other heavy appliance usage
  - Configurable via `input_text.house_battery_strategy_ev_sensor_entity_id` in Advanced Settings
  - Automatically applies Full Stop strategy when the configured sensor indicates charging is active
  - Useful for preventing grid overload and power spikes when EV or heavy appliances start

- **Improve: Optimized strategy transitions and reduced unnecessary updates**
  - Timed Strategy now only updates active sub-strategy field when it changes, reducing system overhead
  - Self-consumption strategy now unwinds gracefully when transitioning from Full Stop, preventing power spikes

- **Files Changed:**
  - `node-red/01 start-flow.json` - Added EV trigger detection logic
  - `node-red/02 strategy-charge.json` - Improved unwinding behavior
  - `node-red/02 strategy-self-consumption.json` - Improved unwinding when transitioning from Full Stop
  - `node-red/02 strategy-timed.json` - Optimized to only update active sub-strategy on change
  - `home assistant/dashboard.yaml` - Added EV Stop Trigger configuration UI in Advanced Settings
  - `README.md` - Added documentation for EV Stop Trigger feature

## 3.0.1
- **Fix: Call nodes not working when charge flow is imported before other flows**
  - Resolved import order dependency issues in Node-RED flows
  - Charge strategy flow now works correctly regardless of import order

- **Files Changed:**
  - `node-red/02 strategy-charge.json` - Fixed call node references

## 3.0.0 beta
- **Feature: New timed strategy for scheduled charging/discharging**
  - Added `02 strategy-timed.json` - time-based strategy 
    - Allows timed charging/self-consumption/full stop
    - Charging at a configurable grid power for Belgian energy contract owners
    - Charging at peak power for ASAP situations
    - Set a default strategy 
    - Pick one or two time periods to engage a strategy of your liking.
    - This strategy is superseding grid-charge-or-wait which is now deprecated.
  - Added `02 strategy-charge.json` - simple charge strategy
  - Dashboarding has been improved for ease of use and now supports 3 tabs.
  - Both `timed` and `grid-charge-or-wait` now support 'effective usable energy', no mental arithmetic required.
  - The `battery time remaining` is now more accurate and shows 'effective usable energy'
  - This release is a prelude to dynamic energy contract support
  
- **Refactor: Reorganized Node-RED flows for better maintainability**
  - Moved deprecated flows to `node-red/deprecated/` folder
  - Moved example strategies to `node-red/examples/` folder
  - Improved folder structure for easier navigation and updates

- **Files Changed:**
  - `node-red/02 strategy-timed.json` - New timed strategy flow
  - `node-red/02 strategy-charge.json` - New simple charge strategy flow
  - `node-red/02 strategy-self-consumption.json` - Updated
  - `node-red/01 start-flow.json` - Updated
  - `node-red/function-node.js` - Refactored time window logic
  - `node-red/deprecated/02 grid-charge-or-wait.json` - Moved from root (previously `02 grid-charge-or-wait.json`)
  - `node-red/examples/02 strategy-custom.json` - Moved from root (previously `02 strategy-custom.json`)
  - `home assistant/dashboard.yaml` - Updated
  - `home assistant/packages/house_battery_control.yaml` - Updated for timed strategy support
  - `README.md` - Updated documentation for new folder structure and strategies

## 2.5.3
- **Fix: Node-RED flow compatibility with newest Node-RED versions**
  - The flows are now compatible with the newest versions of Node-RED. The deprecation warnings have been removed.
  - **Important:** Please upgrade Node-RED to version 20.x or newer before applying this update.

- **Files Changed:**
  - `node-red/00 master-switch-flow.json` - Updated for Node-RED 20.x compatibility
  - `node-red/01 start-flow.json` - Updated for Node-RED 20.x compatibility
  - `home assistant/dashboard.yaml` - Updated version to v2.5.3

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
