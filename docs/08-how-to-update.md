---
layout: default
title: How to Update
nav_order: 8
---

# How to Update

1. Remember or write down your current version, visible on the HA dashboard.
1. [Review the Release Notes](https://github.com/gitcodebob/marstek-venus-rs485-node-red/blob/main/RELEASE_NOTES.md), these often explain which files were changed and what was added.
   1. Below we assume a lot of files have changed and you need to update nearly everything

## Home Assistant

1. Download or copy the [`home assistant/packages/house_battery_control.yaml`](https://github.com/gitcodebob/marstek-venus-rs485-node-red/blob/main/home%20assistant/packages/house_battery_control.yaml) and replace your current version with this new one.
   1. Go to HA developer tools ("ontwikkelhulpmiddelen" in NL/BE) and check the config → restart → reload yaml
   1. Some changes, like those to the data recorder, require a full restart of HA. A yaml reload won't be enough. Release notes often mention this.
1. Always update the provided dashboard
   1. Go to the `HA Home Battery Control dashboard` and click `Edit (pencil)` → `Raw configuration`
   1. Paste the new dashboard config from [`home assistant/dashboard.yaml`](https://github.com/gitcodebob/marstek-venus-rs485-node-red/blob/main/home%20assistant/dashboard.yaml)
   1. Save

## Node-RED

### All flows in one go (recommended)
1. Go to **Node-RED** and _delete_ or _disable_ ALL HBC flows
1. Go to **GitHub** and copy the raw code from [`node-red/all-flows-in-one-file.json`](https://github.com/gitcodebob/marstek-venus-rs485-node-red/blob/main/node-red/all-flows-in-one-file.json) to replace all flows in 1 import. *Easy!*
1. Back to **Node-RED** and go to the burger menu and choose `Import`
    - Paste the json 
    - Choose `Import to` → 'new flow' 
1. When done, do a _Full Deploy_ of flows via the red button in the top right. *Enjoy your new update!*
    - If you disabled old flows instead of deleting them. This might be good time to clean them up.

### Only specific flow(s)
1. Go to any flows that were updated between your version and latest
1. Per flow, go to the burger menu and choose `Import`
1. Copy the code from [`github/node-red/<<your flow>>.json`](https://github.com/gitcodebob/marstek-venus-rs485-node-red/tree/main/node-red)
   - Choose `Import to` → 'current flow', or if you want to compare old and new versions: choose 'new flow'
   - If you choose new flow, you will have to disable the old flow. Having both flows active causes problems.
1. Done, do a _Full Deploy_ of flows via the red button in the top right

You can now use the latest update.

## Recommendations

- Check [release notes](https://github.com/gitcodebob/marstek-venus-rs485-node-red/blob/main/RELEASE_NOTES.md) or [YouTube tutorials](http://www.youtube.com/@gitcodebob) for explanations and help on new features
- Check the Node-RED debug window for any strange errors and messages during first operation
- There are reports of Node-RED sometimes having glitches, like partially responding to changes. A restart of Node-RED itself might help. Also check the Node-RED log files to see NR is operating as it should.
- Please note most of us are not HA or NR contributors. We share what we know, but most is learned via tinkering.
