# Release Notes


All releases follow Semantic Versioning (SemVer).

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
