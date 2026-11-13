'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ProtectionRunner, signed } = require('../../support/protection-runner');
const { makeBattery } = require('../../fixtures/homes');

function home(powers, desired, direction = -1, load = 1800, total = false) {
  const phases = ['L3', 'L2', 'L2', 'L1', 'L3'];
  const grid = { L1: load, L2: load, L3: load };
  const batteries = powers.map((p, i) => {
    grid[phases[i]] += p;
    return makeBattery({ id: 'M' + (i + 1), phase: phases[i], power: p,
      chargeMaxW: i === 4 ? 1500 : 2500, dischargeMaxW: i === 4 ? 1500 : 2500 });
  });
  // Explicit eligibility properties match the controller's normalized interface.
  batteries[4].charging_max = batteries[4].discharging_max = 1500;
  return { target: direction < 0 ? 'Sell' : 'Charge', strategy: { display: direction < 0 ? 'Sell' : 'Charge' },
    batteries, solutions: desired.map((p, i) => ({ id: 'M' + (i + 1),
      mode: p > 0 ? 'charge' : p < 0 ? 'discharge' : 'stop', power: Math.abs(p) })),
    grid_power_phase: grid, grid_power: Object.values(grid).reduce((a, b) => a + b, 0),
    grid_power_limit_phase: 6000, phase_protection: { enabled: true },
    grid_power_has_limit_import: total, grid_power_has_limit_export: total,
    grid_power_limit_import: 12000, grid_power_limit_export: 12000,
    protection_recovery_settings: { delay_s: 5, rate_w_per_s: 750, recovery_factor: 0.5,
      phase_target_w: 5800, phase_hysteresis_w: 100 } };
}

describe('Five batteries with independent response latency', () => {
  for (const direction of [-1, 1]) for (const delay of [5, 15, 30]) {
    it(`reaches ${direction < 0 ? 'Sell' : 'Charge'} with M5 delayed ${delay}s and M1 non-responsive`, () => {
      const r = new ProtectionRunner();
      let actual = [0, 0, 0, 0, direction * 1500];
      const wanted = [2500, 600, 600, 600, 1500].map(p => direction * p);
      const commandQueue = [];
      const reports = [];
      let previous = [0, 0, 0, 0, direction * 1500], out;
      for (let t = 0; t < 100; t++) {
        for (const job of commandQueue.filter(j => j.at === t)) actual[job.i] = job.power;
        reports.push(actual.slice());
        const measured = actual.slice();
        measured[4] = reports[Math.max(0, t - 3)][4]; // additional independent telemetry delay
        const m = home(measured, wanted, direction, 1800, true);
        // The grid meter sees physical output independently of the delayed M5 report.
        m.grid_power_phase.L3 += actual[4] - measured[4];
        m.grid_power += actual[4] - measured[4];
        out = r.run(m, 1);
        const next = out.solutions.map(signed);
        for (const indices of [[0, 4], [1, 2], [3]]) {
          const increase = indices.reduce((s, i) => s + direction * (next[i] - previous[i]), 0);
          assert.ok(increase <= 750, 'phase recovery rate is shared');
        }
        assert.ok(next.reduce((s, p, i) => s + direction * (p - previous[i]), 0) <= 750,
          'whole-house recovery rate is shared');
        if (t < 5) assert.ok(next.reduce((s, p) => s + direction * p, 0) <= 1500, 'startup delay');
        for (let i = 1; i < 5; i++) commandQueue.push({ at: t + (i === 4 ? delay : 1), i, power: next[i] });
        previous = next;
      }
      assert.deepEqual(out.solutions.map(signed), wanted);
      assert.equal(out.protection_recovery.limited, false);
      assert.equal(out.strategy.display, direction < 0 ? 'Sell' : 'Charge');
      assert.equal(out.protection_recovery.batteries.find(b => b.id === 'M1').awaiting_response, true);
    });
  }

  it('reproduces the reported M1/M5 Sell stall without requiring M1 to catch up', () => {
    const r = new ProtectionRunner();
    let out;
    for (let t = 0; t < 30; t++) out = r.run(home([0, 0, 0, 0, -1589], [-2500, 0, 0, 0, -1500]), 1);
    assert.deepEqual(out.solutions.map(signed), [-2500, 0, 0, 0, -1500]);
    assert.equal(out.strategy.display, 'Sell');
    assert.ok(out.protection_recovery.batteries.find(b => b.id === 'M1').pending_duration_s > 5);
  });

  it('keeps superseded reservations across stale telemetry, failure, and Full stop', () => {
    const r = new ProtectionRunner();
    const first = home([2000, 0, 0, 0, 0], [2000, 0, 0, 0, 0], 1);
    r.run(first);
    const m = home([0, 0, 0, 0, 0], [1000, 0, 0, 0, 0], 1);
    m.batteries[0].power_reported_at = r.time - 1; // cached zero predates reduction
    let out = r.run(m, 1);
    assert.equal(out.protection_recovery.batteries.find(b => b.id === 'M1').reserved_max_w, 2000);
    r.node('Battery command failed', { battery_command: { command: { id: 'M1' } } });
    out = r.run(m, 30);
    assert.equal(out.protection_recovery.batteries.find(b => b.id === 'M1').reserved_max_w, 2000);
    m.target = 'Full stop';
    out = r.run(m, 1);
    assert.ok(out.solutions.every(s => s.power === 0));
    assert.equal(out.protection_recovery.batteries.find(b => b.id === 'M1').reserved_max_w, 2000);
    m.batteries[0].power = 'unavailable';
    m.batteries[0].power_reported_at = r.time + 1000;
    out = r.run(m, 1);
    assert.equal(out.protection_recovery.batteries.find(b => b.id === 'M1').reserved_max_w, 2000,
      'an unavailable report cannot confirm a zero command');
    m.batteries[0].power = 0;
    // A new report after successful stop finally releases the old reservation.
    m.batteries[0].power_reported_at = r.time + 1000;
    out = r.run(m, 1);
    assert.equal(out.protection_recovery.batteries.find(b => b.id === 'M1').reserved_max_w, 0);
  });
});
