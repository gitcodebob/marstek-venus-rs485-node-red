'use strict';
const { FunctionRunner } = require('../lib/function-runner');
const { ContextStore } = require('../lib/context-store');
const { Initializer } = require('./init-flow');

// Runs the actual exported function nodes with persistent state and a fake clock.
class ProtectionRunner {
  constructor() {
    this.time = 100000;
    this.flow = new ContextStore();
    this.global = new Initializer({ clock: { now: () => this.time } }).useNoopLogger().global;
    this.runner = new FunctionRunner({ clock: { now: () => this.time } });
  }
  node(name, msg) {
    return this.runner.run({ flowFile: 'node-red/01 start-flow.json', node: name,
      msg, flow: this.flow, global: this.global });
  }
  prepare(msg) { return this.node('Prepare protection recovery', msg); }
  finish(msg) { return this.node('Protection recovery', msg); }
  deliver(msg) {
    // Simulate successful HA service calls, independently of physical telemetry.
    const commands = this.global.get('lastBatteryCommands') || {};
    for (const s of msg.solutions || []) {
      const previous = commands[s.id];
      const changed = previous?.mode !== s.mode || Math.abs((previous?.power ?? Infinity) - s.power) > 25;
      commands[s.id] = { ...s, since: changed ? this.time : previous.since, updated: this.time };
    }
    this.global.set('lastBatteryCommands', commands);
    this.flow.set('battery_commands_busy', false);
    return msg;
  }
  run(msg, seconds = 0) {
    this.time += seconds * 1000;
    return this.deliver(this.finish(this.prepare(structuredClone(msg))));
  }
}
const signed = s => s.mode === 'charge' ? s.power : s.mode === 'discharge' ? -s.power : 0;
module.exports = { ProtectionRunner, signed };
