'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ProtectionRunner } = require('../../support/protection-runner');
const { makeBattery } = require('../../fixtures/homes');

function msg(power, mode = 'charge') {
  return { batteries: [makeBattery({ id: 'M1', phase: 'L1', power: -2000 })], battery_index: 1,
    solutions: [{ id: 'M1', mode, power }] };
}

describe('Ordered battery command transactions', () => {
  it('clears power before reversing direction, then sets the limited power', () => {
    const r = new ProtectionRunner();
    r.global.set('lastBatteryCommands', { M1: { mode: 'discharge', power: 2000 } });
    const m = r.node('Set Batteries', msg(100));
    const calls = [];
    while (true) {
      const [service, complete] = r.node('Next battery command', m);
      if (complete) break;
      calls.push(structuredClone(service.payload));
      assert.equal(r.global.get('lastBatteryCommands').M1.mode, 'discharge', 'not recorded until services finish');
    }
    assert.deepEqual(calls.map(c => [c.action, c.data]), [
      ['number.set_value', { value: 0 }],
      ['select.select_option', { option: 'charge' }],
      ['number.set_value', { value: 100 }],
    ]);
    assert.equal(calls[0].target.entity_id.length, 2, 'both directional registers must be cleared');
    assert.equal(r.global.get('lastBatteryCommands').M1.power, 100);
  });

  it('changes same-mode power without briefly stopping the battery', () => {
    const r = new ProtectionRunner();
    r.global.set('lastBatteryCommands', { M1: { mode: 'discharge', power: 2000 } });
    const m = r.node('Set Batteries', msg(1900, 'discharge'));
    assert.deepEqual(m.battery_command.calls.map(c => c.data), [{ value: 1900 }]);
  });

  it('does not restart a direction handoff while old telemetry is still arriving', () => {
    const r = new ProtectionRunner();
    r.global.set('lastBatteryCommands', { M1: { mode: 'discharge', power: 2000 } });
    function issue(message) {
      const transaction = r.node('Set Batteries', message);
      const calls = [];
      while (true) {
        const [service, complete] = r.node('Next battery command', transaction);
        if (complete) break;
        calls.push(structuredClone(service.payload));
      }
      return calls;
    }
    assert.equal(issue(msg(100)).length, 3, 'a real direction change clears power once');
    assert.equal(r.global.get('lastBatteryCommands').M1.handoff_pending, true);
    for (const power of [100, 200, 300]) {
      const calls = issue(msg(power)); // still reports -2000 W
      assert.ok(calls.every(c => c.action === 'number.set_value' && c.data.value === power));
      assert.equal(r.global.get('lastBatteryCommands').M1.handoff_pending, true);
    }
    const observed = msg(300);
    observed.batteries[0].power = 300;
    assert.deepEqual(issue(observed), []);
    assert.equal(r.global.get('lastBatteryCommands').M1.handoff_pending, false);
    const reversal = msg(500, 'discharge');
    reversal.batteries[0].power = 300;
    assert.equal(issue(reversal).length, 3, 'a subsequent real reversal gets its own safe handoff');
  });

  it('invalidates uncertain commands and unlocks the cohort when a service fails', () => {
    const r = new ProtectionRunner();
    r.flow.set('battery_commands_busy', true);
    r.global.set('lastBatteryCommands', { M1: { mode: 'discharge', power: 2000 } });
    const m = r.node('Set Batteries', msg(100));
    r.node('Battery command failed', m);
    assert.equal(r.flow.get('battery_commands_busy'), false);
    assert.equal(r.global.get('lastBatteryCommands').M1, undefined);
    const retry = r.node('Set Batteries', msg(100));
    assert.equal(retry.battery_command.calls[0].data.value, 0);
  });

  it('drops overlapping evaluations without advancing recovery state', () => {
    const r = new ProtectionRunner();
    const m = r.prepare({ ...msg(100), target: 'Charge', phase_protection: { enabled: true },
      grid_power_limit_phase: 5500, grid_power_phase: { L1: 0, L2: 0, L3: 0 } });
    r.flow.set('battery_commands_busy', true);
    assert.equal(r.finish(m), null);
    assert.equal(r.flow.get('protection_recovery'), undefined);
  });

  it('routes each service completion back to the transaction before advancing the battery loop', () => {
    const nodes = JSON.parse(fs.readFileSync('node-red/01 start-flow.json', 'utf8'));
    const byName = name => nodes.find(n => n.type !== 'group' && n.name === name);
    const set = byName('Set Batteries');
    const next = byName('Next battery command');
    const api = byName('Apply battery command');
    assert.deepEqual(set.wires, [[next.id]]);
    assert.deepEqual(next.wires[0], [api.id]);
    assert.deepEqual(api.wires, [[next.id]]);
    assert.equal(next.wires[1][0], '7a4def72c1f4a75b');
    const guard = byName('Protection recovery');
    const strategyCall = byName('Call "Link in" node');
    assert.ok(strategyCall.wires[0].includes(guard.id));
    assert.ok(!strategyCall.wires[0].includes('a376501fd2fbda42'), 'evaluation cannot bypass protection');
  });
});
