# Examples

This folder contains importable Node-RED example flows and supporting notes for the Marstek-HA-NodeRed integration.

- node-red\examples\02 super-strategy.json _how to build an advanced strategy which selects and executes other sub-strategies_
- node-red\examples\02 strategy-custom.json _a basic subflow to easily adapt to your needs_
- node-red\examples\03 custom-set-daily.json _run once per day and set a Home Assistant input_number to a day-specific value_

## 03 custom-set-daily.json

This example shows a simple daily scheduler pattern:

1. An Inject node triggers every day at `00:01`.
2. A Function node calculates a value based on the current day of week.
3. A Home Assistant service call writes that value to an `input_number` entity.

By default, the example updates:

- `input_number.house_battery_solar_reserved_for_house`

Customize this flow by:

- Changing the weekday logic inside `Determine Daily Value`.
- Selecting your own target entity in `Update Input Number`.
- Adjusting the trigger time in `Daily after Midnight` (cron: `01 00 * * *`).