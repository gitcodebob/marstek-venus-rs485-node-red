'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ProtectionRunner, signed } = require('../support/protection-runner');
const { makeBattery } = require('../fixtures/homes');
const { FlowGraph } = require('../lib/flow-graph');
const { ContextStore } = require('../lib/context-store');
const { StateProvider } = require('../lib/ha-state-mock');

function baseMessage(batteries, grid, target = 'Charge') {
  return { target, batteries, grid_power_phase: grid,
    grid_power: Object.values(grid).reduce((a, b) => a + b, 0),
    grid_power_limit_phase: 5750, phase_protection: { enabled: true },
    grid_power_has_limit_import: false, grid_power_has_limit_export: false };
}

describe('Protection across repeated strategy evaluations', () => {
  for (const phaseTarget of [5500, 5400]) {
  it(`settles without sawtooth at a ${phaseTarget} W target with independently cycling EV regulation`, () => {
    const r = new ProtectionRunner();
    const phases = ['L1', 'L2', 'L3', 'L3'];
    let actual = [2500, 2500, 2500, 2500];
    let queue = [actual.slice(), actual.slice()]; // two seconds of battery response delay
    let ev = 16 * 230;
    let previous;
    let peakAfterSettling = 0;
    let reachedFullEV = false;
    const settled = [];
    for (let t = 0; t < 600; t++) {
      const batteryByPhase = { L1: actual[0], L2: actual[1], L3: actual[2] + actual[3] };
      const physicalGrid = Object.fromEntries(Object.entries(batteryByPhase).map(([p, b]) => [p, b + ev + 200]));
      const noise = [-20, 10, 0, 20, -10][t % 5];
      const grid = Object.fromEntries(Object.entries(physicalGrid).map(([p, watts]) => [p, watts + noise]));
      if (t > 5) peakAfterSettling = Math.max(peakAfterSettling, ...Object.values(grid));
      const batteries = phases.map((phase, i) => makeBattery({ id: `M${i + 1}`, phase, power: actual[i],
        lastCommand: r.global.get('lastBatteryCommands')?.[`M${i + 1}`] }));
      let msg = baseMessage(batteries, grid);
      msg.protection_recovery_settings = { phase_target_w: phaseTarget, phase_hysteresis_w: 100 };
      r.time += 1000;
      // Exercise actual phase headroom calculation and Charge allocation, then
      // central protection, retaining all controller state between cycles.
      msg = r.node('Phase command limits', msg);
      msg = r.prepare(msg);
      msg = r.runner.run({ flowFile: 'node-red/02 strategy-charge.json', node: 'Max power solution',
        msg, global: r.global, flow: r.flow });
      const out = r.deliver(r.finish(msg));
      const next = out.solutions.map(signed);
      const totals = { L1: next[0], L2: next[1], L3: next[2] + next[3] };
      if (previous) for (const phase of ['L1', 'L2', 'L3']) {
        assert.ok(totals[phase] - previous[phase] <= 100, `${phase} jumped at t=${t}: ${previous[phase]} -> ${totals[phase]}`);
      }
      previous = totals;
      if (t >= 450) settled.push({ grid: physicalGrid, totals, ev });
      // EV controller is independent: drop immediately to available current,
      // suspend below 6 A, and reclaim capacity at 1 A/s up to its requested 16 A.
      const room = 5750 - 200 - Math.max(...Object.values(batteryByPhase));
      const requestedEV = t >= 100 && t < 180 ? 10 * 230 : t >= 300 && t < 360 ? 6 * 230 : 16 * 230;
      const available = room < 6 * 230 ? 0 : Math.min(requestedEV, Math.floor(room / 230) * 230);
      ev = available < ev ? available : Math.min(available, ev + 230);
      if (t > 20 && ev === 16 * 230) reachedFullEV = true;
      queue.push(next);
      actual = queue.shift();
    }
    assert.ok(reachedFullEV, 'EV gets the opportunity to reclaim its full requested load');
    for (const sample of settled) {
      // At 5500±100 W, a held phase near 5570 W leaves less than one
      // 230 W EV increment. The lower configurable target supplies that reserve.
      assert.equal(sample.ev, (phaseTarget === 5500 ? 9 : 16) * 230);
      for (const phase of ['L1', 'L2', 'L3']) {
        const atBatteryMaximum = phase !== 'L3' && sample.totals[phase] === 2500;
        assert.ok(sample.grid[phase] <= phaseTarget + 100 && (sample.grid[phase] >= phaseTarget - 100 || atBatteryMaximum),
          `${phase} did not settle in the operating band: ${sample.grid[phase]} W`);
        assert.equal(sample.totals[phase], settled[0].totals[phase], 'no recurring throttle/recovery cycle after settling');
      }
    }
    assert.ok(peakAfterSettling < 6500, `Repeated peak was ${peakAfterSettling} W, approaching the reported 35 A rebound`);
  });

  }

  it('runs Standby through the normal partial path and retains phase shaving outside the PID', async () => {
    const r = new ProtectionRunner();
    const graph = new FlowGraph({ context: new ContextStore(), flow: new ContextStore(), global: r.global,
      clock: { now: () => r.time }, stateProvider: new StateProvider() });
    graph.load(['node-red/02 strategy-partials.json', 'node-red/02 strategy-self-consumption.json']);
    for (let tick = 0; tick < 3; tick++) {
      const batteryPower = tick === 0 ? 0 : -1000;
      let msg = baseMessage([makeBattery({ id: 'M1', phase: 'L1', power: batteryPower })],
        { L1: 6500 + batteryPower, L2: 0, L3: 0 }, 'Standby / peak shave');
      msg = r.prepare(r.node('Phase command limits', msg));
      const results = await graph.run('Standby / peak shave', msg);
      assert.equal(results.length, 1);
      const out = r.deliver(r.finish(results[0]));
      assert.equal(signed(out.solutions[0]), -1000);
      assert.equal(out.phase_protection.command_limits_available, true);
      assert.equal(out.strategy.is_peak_shaving, true);
      r.time += 1000;
    }
  });
});
