'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ProtectionRunner, signed } = require('../../support/protection-runner');
const { makeBattery } = require('../../fixtures/homes');

function message(load = 3680, power = 5000, desired = 5000) {
  return { target: 'Charge',
    batteries: [makeBattery({ id: 'M1', phase: 'L1', power, chargeMaxW: 5000, dischargeMaxW: 5000 })],
    solutions: [{ id: 'M1', mode: desired > 0 ? 'charge' : desired < 0 ? 'discharge' : 'stop', power: Math.abs(desired) }],
    grid_power: load + power, grid_power_phase: { L1: load + power, L2: 0, L3: 0 },
    grid_power_limit_phase: 5750, phase_protection: { enabled: true },
    grid_power_has_limit_import: false, grid_power_has_limit_export: false,
    protection_recovery_settings: { phase_target_w: 5500, phase_hysteresis_w: 100 } };
}
function diagnostic(out, direction = 'import') {
  return out.protection_recovery.bounds.find(d => d.scope === 'L1' && d.direction === direction);
}
function completeCommand(r, out, index = 1) {
  out.battery_index = index;
  const pending = r.node('Set Batteries', out);
  const calls = [];
  while (true) {
    const [service, complete] = r.node('Next battery command', pending);
    if (complete) break;
    calls.push(structuredClone(service.payload));
  }
  r.flow.set('battery_commands_busy', false);
  return calls;
}

describe('Phase operating target and hysteresis', () => {
  it('throttles 5000 W directly to 1820 W, with no zero, stop, or mode command', () => {
    const r = new ProtectionRunner();
    r.global.set('lastBatteryCommands', { M1: { mode: 'charge', power: 5000 } });
    let m = r.node('Phase command limits', message());
    m = r.prepare(m);
    m = r.runner.run({ flowFile: 'node-red/02 strategy-charge.json', node: 'Max power solution', msg: m, global: r.global, flow: r.flow });
    const out = r.finish(m);
    assert.equal(signed(out.solutions[0]), 1820);
    const d = diagnostic(out);
    assert.equal(d.non_battery_power_w, 3680);
    assert.equal(d.permitted_charge_w, 1820);
    assert.equal(d.target_bound_w, 1820);
    assert.equal(d.raw_bound_w, 2070, 'hard headroom must remain distinct from target headroom');
    assert.equal(d.state, 'correcting');
    assert.deepEqual(completeCommand(r, out).map(c => [c.action, c.data]), [['number.set_value', { value: 1820 }]]);
  });

  it('shares 1820 W across the phase and leaves other phases operating', () => {
    const r = new ProtectionRunner();
    const m = message();
    m.batteries = [makeBattery({ id: 'M1', phase: 'L1', power: 2500 }),
      makeBattery({ id: 'M2', phase: 'L1', power: 2500 }),
      makeBattery({ id: 'M3', phase: 'L2', power: 1200 }), makeBattery({ id: 'M4', phase: 'L3', power: 1400 })];
    m.solutions = m.batteries.map(b => ({ id: b.id, mode: 'charge', power: b.power }));
    m.grid_power_phase = { L1: 8680, L2: 2500, L3: 3000 };
    m.grid_power = 14180;
    r.global.set('lastBatteryCommands', Object.fromEntries(m.solutions.map(s => [s.id, { ...s }])));
    const out = r.finish(r.prepare(m));
    assert.deepEqual(out.solutions.map(signed), [910, 910, 1200, 1400]);
    for (const index of [1, 2]) {
      const calls = completeCommand(r, structuredClone(out), index);
      assert.deepEqual(calls.map(c => [c.action, c.data]), [['number.set_value', { value: 910 }]]);
    }
  });

  it('retains charging priority when distributing the calculated throttle', () => {
    const r = new ProtectionRunner();
    const m = message();
    m.batteries = [makeBattery({ id: 'M1', phase: 'L1', power: 2500 }),
      { ...makeBattery({ id: 'M2', phase: 'L1', power: 2500 }), is_priority_battery: true }];
    m.solutions = m.batteries.map(b => ({ id: b.id, mode: 'charge', power: 2500 }));
    const out = r.run(m);
    assert.deepEqual(out.solutions.map(signed), [0, 1820]);
  });

  for (const sign of [1, -1]) {
    const direction = sign === 1 ? 'import' : 'export';
    it(`holds ${direction} power despite ten minutes of noise inside the band`, () => {
      const r = new ProtectionRunner();
      let out = r.run(message(sign * 3680, sign * 5000, sign * 5000));
      assert.equal(signed(out.solutions[0]), sign * 1820);
      out = r.run(message(sign * 3680, sign * 1820, sign * 5000), 1);
      const initialTimer = r.flow.get('protection_recovery').records[`L1:${direction}`].stable_since;
      for (let tick = 0; tick < 600; tick++) {
        const noise = [-80, -20, 0, 70, 100, -100][tick % 6];
        out = r.run(message(sign * (3680 + noise), sign * 1820, sign * 5000), 1);
        assert.equal(signed(out.solutions[0]), sign * 1820, `unexpected command at tick ${tick}`);
        assert.equal(diagnostic(out, direction).state, 'holding');
        assert.equal(diagnostic(out, direction).remaining_delay_s, 0);
        assert.equal(r.flow.get('protection_recovery').records[`L1:${direction}`].stable_since, initialTimer);
        assert.equal(out.protection_recovery.unmet_target_w, 0, 'in-band tolerance is not an unmet target');
      }
    });

    it(`makes only the needed ${direction} correction above the band and at the hard ceiling`, () => {
      const r = new ProtectionRunner();
      r.run(message(sign * 3680, sign * 1820, sign * 5000));
      let out = r.run(message(sign * 3830, sign * 1820, sign * 5000), 1);
      assert.equal(signed(out.solutions[0]), sign * 1670); // 5650 -> 5500 W
      assert.equal(diagnostic(out, direction).reason, 'above operating band');
      out = r.run(message(sign * 4330, sign * 1670, sign * 5000), 1);
      assert.equal(signed(out.solutions[0]), sign * 1170); // 6000 -> 5500 W
      assert.equal(diagnostic(out, direction).reason, 'hard ceiling exceeded');
    });

    it(`waits for continuous headroom, then settles in the ${direction} band instead of recovering to 5750 W`, () => {
      const r = new ProtectionRunner();
      r.run(message(sign * 3680, sign * 1820, sign * 5000));
      // First excursion below the lower edge starts the wait.
      let out = r.run(message(sign * 3280, sign * 1820, sign * 5000), 30);
      assert.equal(signed(out.solutions[0]), sign * 1820);
      // Small load changes below the band do not restart the wait.
      for (let tick = 0; tick < 10; tick++) {
        out = r.run(message(sign * (3280 + tick % 2), sign * 1820, sign * 5000), 1);
        assert.equal(signed(out.solutions[0]), sign * 1820);
      }
      let power = 1820;
      for (let tick = 0; tick < 120; tick++) {
        out = r.run(message(sign * 3280, sign * power, sign * 5000), 1);
        const next = sign * signed(out.solutions[0]);
        assert.ok(next - power <= 100);
        power = next;
      }
      assert.ok(3280 + power >= 5400 && 3280 + power <= 5500);
      assert.equal(diagnostic(out, direction).state, 'holding');
    });
  }

  it('only adds discharge support when stopping charge cannot reach the operating band', () => {
    const r = new ProtectionRunner();
    let out = r.run(message(5550, 500, 5000));
    assert.equal(signed(out.solutions[0]), 0, 'stopping charge is sufficient at 5550 W');
    assert.equal(out.protection_recovery.unmet_target_w, 0);
    out = r.run(message(6000, 0, 5000), 1);
    assert.equal(signed(out.solutions[0]), -500, 'only 500 W of support is needed to reach 5500 W');
  });

  it('retains the last valid settings and preserves the hard ceiling', () => {
    const r = new ProtectionRunner();
    const m = message(3000, 1000);
    m.protection_recovery_settings = { phase_target_w: 5400, phase_hysteresis_w: 50 };
    r.run(m);
    for (const pair of [{ phase_target_w: 5700, phase_hysteresis_w: 100 },
      { phase_target_w: 5500, phase_hysteresis_w: 250 },
      { phase_target_w: 5500, phase_hysteresis_w: 0 },
      { phase_target_w: -10, phase_hysteresis_w: 100 },
      { phase_target_w: 'unavailable', phase_hysteresis_w: 'unknown' }]) {
      m.protection_recovery_settings = pair;
      const out = r.run(m, 1);
      assert.equal(out.grid_power_limit_phase, 5750);
      assert.equal(out.protection_recovery.phase_settings_status, 'retained');
      assert.equal(out.protection_recovery.settings.phase_target_w, 5400);
      assert.equal(out.protection_recovery.settings.phase_hysteresis_w, 50);
    }
    m.grid_power_limit_phase = 5300;
    const out = r.run(m, 1);
    assert.equal(out.grid_power_limit_phase, 5300);
    assert.equal(out.protection_recovery.phase_settings_status, 'fallback');
    assert.equal(out.protection_recovery.settings.phase_target_w, 5050);
    assert.equal(out.protection_recovery.settings.phase_hysteresis_w, 100);
  });

  it('uses the conservative cold-start fallback when the new helpers are absent', () => {
    const r = new ProtectionRunner();
    const m = message();
    delete m.protection_recovery_settings;
    m.grid_power_limit_phase = 5500;
    const out = r.run(m);
    assert.equal(out.protection_recovery.settings.phase_target_w, 5250);
    assert.equal(out.protection_recovery.settings.phase_hysteresis_w, 100);
    assert.equal(out.grid_power_limit_phase, 5500);
  });

  it('lets a changed phase target leave whole-house recovery settings and limits intact', () => {
    const r = new ProtectionRunner();
    const m = message(6000, 0);
    m.phase_protection.enabled = false;
    m.grid_power_has_limit_import = true;
    m.grid_power_limit_import = 5750;
    m.protection_recovery_settings.phase_target_w = 5200;
    const out = r.run(m);
    assert.equal(signed(out.solutions[0]), -250, 'aggregate protection continues to use its own 5750 W limit');
  });
});
