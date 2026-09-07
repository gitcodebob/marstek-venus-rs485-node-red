'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ProtectionRunner, signed } = require('../../support/protection-runner');
const { makeBattery } = require('../../fixtures/homes');

function message({ load = 3500, power = 0, desired = 2500, phase = true, totalImport = false, totalExport = false } = {}) {
  return {
    target: 'Charge', batteries: [makeBattery({ id: 'M1', phase: 'L1', power })],
    solutions: [{ id: 'M1', mode: desired >= 0 ? 'charge' : 'discharge', power: Math.abs(desired) }],
    grid_power: load + power, grid_power_phase: { L1: load + power, L2: 0, L3: 0 },
    grid_power_limit_phase: 5750, phase_protection: { enabled: phase },
    grid_power_has_limit_import: totalImport, grid_power_limit_import: 5500,
    grid_power_has_limit_export: totalExport, grid_power_limit_export: 5500,
  };
}
function bound(result, scope = 'L1', direction = 'import') {
  return result.protection_recovery.bounds.find(b => b.scope === scope && b.direction === direction);
}

describe('Shared protection recovery', () => {
  it('holds for ten seconds, then recovers at 100 W/s, capped by headroom', () => {
    const r = new ProtectionRunner();
    let m = message({ power: 2500 });
    let out = r.run(m);
    assert.equal(signed(out.solutions[0]), 2000);
    m = message({ power: 2000, load: 2500 });
    out = r.run(m, 1);
    assert.equal(signed(out.solutions[0]), 2000);
    out = r.run(m, 9);
    assert.equal(signed(out.solutions[0]), 2000);
    out = r.run(m, 2);
    assert.equal(signed(out.solutions[0]), 2100);
    m = message({ power: 2100, load: 2500 });
    out = r.run(m, 3);
    assert.equal(signed(out.solutions[0]), 2400);
    out = r.run(message({ power: 2400, load: 3000 }), 1);
    // Entering the band holds the allowance; small headroom changes do not reset it.
    assert.equal(signed(out.solutions[0]), 2400);
    assert.equal(bound(out).remaining_delay_s, 0);
  });

  it('tightens immediately on renewed overload and restarts the wait', () => {
    const r = new ProtectionRunner();
    r.run(message({ power: 2000, load: 3500 }));
    let out = r.run(message({ power: 2000, load: 5000 }), 15);
    assert.equal(signed(out.solutions[0]), 500);
    assert.equal(bound(out).remaining_delay_s, 10);
    out = r.run(message({ power: 500, load: 3500 }), 1);
    assert.equal(signed(out.solutions[0]), 500);
  });

  for (const direction of [1, -1]) {
    it(`withdraws ${direction === 1 ? 'import' : 'export'} shaving gradually through zero`, () => {
      const r = new ProtectionRunner();
      const request = (load, power) => message({ load: direction * load, power: direction * power, desired: direction * 2500 });
      let out = r.run(request(6500, 0));
      assert.equal(signed(out.solutions[0]), direction * -1000);
      // Successful shaving is not evidence that the underlying overload vanished.
      out = r.run(request(6500, -1000), 1);
      assert.equal(signed(out.solutions[0]), direction * -1000);
      out = r.run(request(3000, -1000), 1);
      assert.equal(signed(out.solutions[0]), direction * -1000);
      out = r.run(request(3000, -1000), 11);
      assert.equal(signed(out.solutions[0]), direction * -900);
      for (let p = -800; p <= 200; p += 100) {
        out = r.run(request(3000, p - 100), 1);
        assert.equal(signed(out.solutions[0]), direction * p || 0);
      }
    });
  }

  it('shares the rate across batteries on one phase', () => {
    const r = new ProtectionRunner();
    const m = message({ load: 3000, power: 0 });
    m.batteries.push(makeBattery({ id: 'M2', phase: 'L1' }));
    m.solutions.push({ id: 'M2', mode: 'charge', power: 2500 });
    r.run(m);
    const out = r.run(m, 11);
    assert.equal(out.solutions.reduce((s, b) => s + signed(b), 0), 100);
  });

  it('shares whole-house recovery across phases while honoring phase bounds', () => {
    const r = new ProtectionRunner();
    const m = message({ load: 3000, power: 0, totalImport: true });
    m.batteries.push(makeBattery({ id: 'M2', phase: 'L2' }));
    m.solutions.push({ id: 'M2', mode: 'charge', power: 2500 });
    r.run(m);
    const out = r.run(m, 11);
    assert.equal(out.solutions.reduce((s, b) => s + signed(b), 0), 100);
    assert.ok(out.solutions.every(s => signed(s) <= 100));
  });

  it('lets new aggregate hard protection override opposing phase recovery', () => {
    const r = new ProtectionRunner();
    const m = message({ load: 3000, power: 0, totalImport: true });
    m.batteries.push(makeBattery({ id: 'M2', phase: 'L2' }));
    m.grid_power_phase.L2 = 3000;
    m.grid_power = 6000;
    m.solutions.push({ id: 'M2', mode: 'charge', power: 2500 });
    const out = r.run(m);
    assert.equal(out.solutions.reduce((s, b) => s + signed(b), 0), -500);
    assert.equal(bound(out, 'total').unmet_w, 0);
  });

  it('pauses for missing telemetry and requires a new stable interval', () => {
    const r = new ProtectionRunner();
    r.run(message({ load: 3500, power: 2000 }));
    const missing = message({ load: 2500, power: 2000 });
    missing.grid_power_phase.L1 = null;
    let out = r.run(missing, 20);
    assert.equal(signed(out.solutions[0]), 2000);
    assert.equal(bound(out).state, 'paused');
    out = r.run(message({ load: 2500, power: 2000 }), 30);
    assert.equal(signed(out.solutions[0]), 2000);
    assert.equal(bound(out).remaining_delay_s, 10);
    out = r.run(message({ load: 2500, power: 2000 }), 11);
    assert.equal(signed(out.solutions[0]), 2100);
  });

  it('does not bank unused allowance or ratchet up against delayed battery telemetry', () => {
    const r = new ProtectionRunner();
    r.run(message({ load: 2500, power: 0 }));
    let out = r.run(message({ load: 2500, power: 0 }), 100);
    assert.equal(signed(out.solutions[0]), 300);
    // The battery still has not applied the command. Another tick is not another
    // increment on top of that unobserved command.
    out = r.run(message({ load: 2500, power: 0 }), 1);
    assert.equal(signed(out.solutions[0]), 100);
    out = r.run(message({ load: 2500, power: 0, desired: 0 }), 100);
    assert.equal(signed(out.solutions[0]), 0);
    out = r.run(message({ load: 2500, power: 0 }), 1);
    assert.equal(signed(out.solutions[0]), 100);
  });

  it('preserves restrictions across strategy changes and PID deadband', () => {
    const r = new ProtectionRunner();
    r.run(message({ load: 6500, power: 0 }));
    const m = message({ load: 6500, power: -1000 });
    m.target = 'Self-consumption';
    delete m.solutions;
    const out = r.run(m, 1);
    assert.equal(signed(out.solutions[0]), -1000);
    assert.equal(out.strategy.is_peak_shaving, true);
  });

  it('lets Standby withdraw a shave even if the PID returns no solution', () => {
    const r = new ProtectionRunner();
    r.run(message({ load: 6500, power: 0 }));
    const m = message({ load: 3000, power: -1000 });
    m.target = 'Standby / peak shave';
    delete m.solutions;
    r.run(m, 1);
    const out = r.run(m, 11);
    assert.equal(signed(out.solutions[0]), -900);
  });

  it('respects empty/full/unavailable batteries and reports unmet requirements', () => {
    for (const [load, change] of [[6500, { soc: 10 }], [-6500, { soc: 100 }], [6500, { rs485: 'disable' }]]) {
      const r = new ProtectionRunner();
      const m = message({ load });
      Object.assign(m.batteries[0], change);
      const out = r.run(m);
      assert.equal(signed(out.solutions[0]), 0);
      assert.ok(out.protection_recovery.unmet_target_w >= 1000);
    }
  });

  it('stops immediately and resumes conservatively after Full stop', () => {
    const r = new ProtectionRunner();
    r.run(message({ load: 6500, power: 0 }));
    const m = message({ load: 6500, power: -1000 });
    m.target = 'Full stop';
    let out = r.run(m, 1);
    assert.equal(signed(out.solutions[0]), 0);
    out = r.run(message({ load: 3000, power: 0 }), 1);
    assert.equal(signed(out.solutions[0]), 0);
  });

  it('only explicit disabling removes existing restrictions', () => {
    const r = new ProtectionRunner();
    r.run(message({ power: 2000 }));
    const m = message({ load: 2500, power: 2000 });
    m.protection_recovery_settings = { phase_enabled: 'unavailable' };
    let out = r.run(m, 1);
    assert.equal(signed(out.solutions[0]), 2000);
    m.protection_recovery_settings.phase_enabled = 'off';
    out = r.run(m, 1);
    assert.equal(signed(out.solutions[0]), 2500);
    assert.deepEqual(r.flow.get('protection_recovery').records, {});
  });

  it('initializes conservatively after a restart or phase reassignment', () => {
    const r = new ProtectionRunner();
    r.run(message({ power: 2000 }));
    const m = message({ load: 2000, power: 500 });
    m.batteries[0].phase = 'L2';
    m.grid_power_phase = { L1: 0, L2: 2500, L3: 0 };
    const out = r.run(m, 50);
    assert.equal(signed(out.solutions[0]), 500);
    assert.equal(bound(out, 'L2').remaining_delay_s, 10);
    const restarted = new ProtectionRunner();
    assert.equal(signed(restarted.run(m).solutions[0]), 500);
  });

  it('normalizes configurable settings, including zero delay and invalid input', () => {
    const r = new ProtectionRunner();
    const m = message({ load: 2500 });
    m.protection_recovery_settings = JSON.stringify({ delay_s: 0, rate_w_per_s: 250 });
    r.run(m);
    assert.equal(signed(r.run(m, 1).solutions[0]), 250);
    m.protection_recovery_settings = { delay_s: '', rate_w_per_s: null };
    assert.deepEqual(r.run(m, 1).protection_recovery.settings, { delay_s: 10, rate_w_per_s: 100, phase_target_w: 5500, phase_hysteresis_w: 100 });
  });
  it('allows normal charging to stop without inventing an export shave', () => {
    const r = new ProtectionRunner();
    r.run(message({ power: 2000, load: 1000 }));
    const out = r.run(message({ power: 2000, load: 1000, desired: 0 }), 1);
    assert.equal(signed(out.solutions[0]), 0);
  });

  for (const direction of [1, -1]) {
    it(`recovers whole-house ${direction === 1 ? 'import' : 'export'} shaving with phase protection off`, () => {
      const r = new ProtectionRunner();
      const m = message({ load: direction * 6500, desired: direction * 2500, phase: false,
        totalImport: direction === 1, totalExport: direction === -1 });
      let out = r.run(m);
      assert.equal(signed(out.solutions[0]), -direction * 1000);
      m.batteries[0].power = -direction * 1000;
      m.grid_power = direction * 2000;
      out = r.run(m, 11);
      assert.equal(signed(out.solutions[0]), -direction * 900);
    });
  }

  it('pauses on missing battery power without converting it to a real zero reading', () => {
    const r = new ProtectionRunner();
    r.run(message({ power: 2000 }));
    const m = message({ power: 2000 });
    m.batteries[0].power = null;
    const out = r.run(m, 20);
    assert.equal(bound(out).state, 'paused');
    assert.equal(bound(out).raw_bound_w, null);
    assert.equal(signed(out.solutions[0]), 0, 'unknown battery has no assignable capacity');
  });

  it('does not apply an older snapshot after a newer strategy evaluation', () => {
    const r = new ProtectionRunner();
    const older = r.prepare(message({ load: 2500 }));
    r.run(message({ load: 5000 }), 1);
    assert.equal(r.finish(older), null);
  });

  for (const direction of [1, -1]) {
    it(`waits for measured reductions before redistributing ${direction === 1 ? 'charge' : 'discharge'} to another battery`, () => {
      const r = new ProtectionRunner();
      const m = message({ load: direction * 3500, power: direction * 2000, desired: direction * 2000 });
      m.batteries.push(makeBattery({ id: 'M2', phase: 'L1' }));
      m.solutions.push({ id: 'M2', mode: 'stop', power: 0 });
      r.run(m);
      m.solutions = [{ id: 'M1', mode: 'stop', power: 0 },
        { id: 'M2', mode: direction === 1 ? 'charge' : 'discharge', power: 2000 }];
      let out = r.run(m, 1);
      assert.equal(signed(out.solutions[0]), 0);
      assert.equal(signed(out.solutions[1]), 0, 'cannot spend headroom from an unobserved reduction');
      out = r.run(m, 1);
      assert.equal(signed(out.solutions[1]), 0, 'pending reduction still has not reached the battery');
      m.batteries[0].power = 0;
      m.grid_power = direction * 3500;
      m.grid_power_phase.L1 = direction * 3500;
      out = r.run(m, 1);
      assert.equal(signed(out.solutions[1]), 0, 'start the stable-headroom wait after the reduction is measured');
      out = r.run(m, 11);
      assert.equal(signed(out.solutions[1]), direction * 100);
    });
  }

  it('handles simultaneous import and export shaving on different phases', () => {
    const r = new ProtectionRunner();
    const m = message({ load: 6500 });
    m.batteries.push(makeBattery({ id: 'M2', phase: 'L2' }));
    m.grid_power_phase.L2 = -6500;
    m.grid_power = 0;
    m.solutions.push({ id: 'M2', mode: 'discharge', power: 2500 });
    const out = r.run(m);
    assert.deepEqual(out.solutions.map(signed), [-1000, 1000]);
    assert.equal(out.protection_recovery.unmet_w, 0);
  });

});
