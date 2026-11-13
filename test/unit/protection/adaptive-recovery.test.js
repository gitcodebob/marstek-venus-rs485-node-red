'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ProtectionRunner, signed } = require('../../support/protection-runner');
const { makeBattery } = require('../../fixtures/homes');

function message(power = 0, options = {}) {
  const { direction = 1, load = 3000, factor = 0.5, total = false, count = 1 } = options;
  return {
    target: 'Charge',
    batteries: Array.from({ length: count }, (_, i) => makeBattery({ id: `M${i}`, phase: 'L1', power: direction * power / count })),
    solutions: Array.from({ length: count }, (_, i) => ({ id: `M${i}`, mode: direction === 1 ? 'charge' : 'discharge', power: 2500 })),
    grid_power_phase: { L1: direction * (load + power), L2: 0, L3: 0 },
    grid_power: direction * (load + power),
    grid_power_limit_phase: 6000, phase_protection: { enabled: !total },
    grid_power_has_limit_import: total && direction === 1, grid_power_limit_import: 5800,
    grid_power_has_limit_export: total && direction === -1, grid_power_limit_export: 5800,
    protection_recovery_settings: { delay_s: 5, rate_w_per_s: 500, recovery_factor: factor,
      phase_target_w: 5800, phase_hysteresis_w: 100 },
  };
}
function diagnostic(out, direction = 1, total = false) {
  return out.protection_recovery.bounds.find(b => b.scope === (total ? 'total' : 'L1') && b.direction === (direction === 1 ? 'import' : 'export'));
}

describe('Adaptive protection recovery', () => {
  for (const total of [false, true]) for (const direction of [1, -1]) {
    it(`tapers ${total ? 'whole-house' : 'phase'} ${direction === 1 ? 'import' : 'export'} recovery and shares the ceiling`, () => {
      const r = new ProtectionRunner();
      const options = { total, direction, count: 2 };
      let power = 0;
      r.run(message(power, options));
      assert.equal(diagnostic(r.run(message(power, options), 5), direction, total).recovery_allowance_w, 0);
      const speeds = [];
      for (let tick = 0; tick < 25; tick++) {
        const out = r.run(message(power, options), 1);
        const next = direction * out.solutions.reduce((s, b) => s + signed(b), 0);
        const diag = diagnostic(out, direction, total);
        assert.ok(next - power <= 500 && next >= power);
        assert.ok(next <= 2800);
        speeds.push(diag.recovery_rate_w_per_s);
        power = next;
      }
      assert.equal(speeds[0], 500);
      assert.ok(speeds.some(speed => speed > 0 && speed < 200), 'recovery must taper near the target');
      assert.ok(power >= 2700, 'phase reaches holding band and aggregate approaches its limit');
      if (!total) {
        const out = r.run(message(power, options), 1);
        assert.equal(out.strategy.display, 'Phase Protection');
        assert.equal(diagnostic(out, direction).state, 'holding');
      }
    });
  }

  it('uses the factor to tune approach speed independently of the 500 W/s maximum', () => {
    const amounts = [0.05, 0.5, 2].map(factor => {
      const r = new ProtectionRunner();
      const m = message(0, { load: 5300, factor });
      r.run(m);
      return diagnostic(r.run(m, 6)).recovery_allowance_w;
    });
    assert.ok(amounts[0] < amounts[1] && amounts[1] < amounts[2]);
    assert.ok(Math.abs(amounts[1] - 500 * (1 - Math.exp(-0.5))) < 1e-8);
  });

  it('advances authorized pending output, pauses on telemetry loss, and corrects immediately', () => {
    const r = new ProtectionRunner();
    r.run(message());
    let out = r.run(message(), 6);
    assert.equal(signed(out.solutions[0]), 500);
    for (let tick = 0; tick < 5; tick++) {
      out = r.run(message(), 1);
      assert.ok(signed(out.solutions[0]) > 500);
      assert.ok(signed(out.solutions[0]) <= 2500);
    }
    const missing = message();
    missing.grid_power_phase.L1 = 'unavailable';
    out = r.run(missing, 20);
    assert.equal(diagnostic(out).state, 'paused');
    out = r.run(message(500), 1);
    assert.equal(diagnostic(out).remaining_delay_s, 5);
    out = r.run(message(500, { load: 6200 }), 1);
    assert.equal(signed(out.solutions[0]), -400);
    assert.equal(diagnostic(out).reason, 'hard ceiling exceeded');
    out = r.run(message(-400), 1);
    assert.equal(diagnostic(out).remaining_delay_s, 5);
  });

  it('caps processing gaps at three seconds and uses elapsed time for short intervals', () => {
    const r = new ProtectionRunner();
    r.run(message());
    r.run(message(), 5);
    let out = r.run(message(), 0.2);
    assert.equal(signed(out.solutions[0]), 100);
    out = r.run(message(100), 60);
    assert.ok(signed(out.solutions[0]) - 100 <= 1500);
    assert.equal(diagnostic(out).recovery_allowance_w, 1500);
  });

  it('normalizes missing and invalid factors', () => {
    for (const factor of [undefined, null, '', 'unavailable', 0, -1, 3]) {
      const r = new ProtectionRunner();
      const m = message();
      m.protection_recovery_settings.recovery_factor = factor;
      assert.equal(r.run(m).protection_recovery.settings.recovery_factor, 0.5);
    }
  });
});
