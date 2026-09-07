'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FunctionRunner } = require('../../lib/function-runner');
const { Initializer } = require('../../support/init-flow');
const { makeBattery } = require('../../fixtures/homes');

const FLOW = 'node-red/01 start-flow.json';

function runTotals(batteries, { debugMode = false } = {}) {
  const initializer = new Initializer({ debugMode });
  initializer.initialize();

  const runner = new FunctionRunner({ captureWarnings: true });
  const msg = runner.run({
    flowFile: FLOW,
    node: 'Batteries (totals)',
    msg: { batteries },
    global: initializer.global,
  });

  return { msg, warnings: runner.warnings };
}

describe('Batteries (totals)', () => {
  it('sums every total when all batteries report', () => {
    const { msg } = runTotals([
      makeBattery({ id: 'M1', soc: 50, power: 100 }),
      makeBattery({ id: 'M2', soc: 50, power: -250 }),
    ]);

    assert.equal(msg.batteries_total_power, -150);
    assert.equal(msg.batteries_max_charge_power, 5000);
    assert.equal(msg.batteries_max_discharge_power, 5000);
    // 2 x (2.5 kWh stored - 5 kWh x 10 % floor) = 4 kWh usable
    assert.equal(msg.batteries_available_energy, 4);
    // 2 x 5 kWh x (100 % - 10 %) = 9 kWh
    assert.equal(msg.batteries_max_energy, 9);
    assert.equal(msg.batteries_totals_complete, true);
  });

  it('keeps the totals finite when one battery reports nothing', () => {
    const healthy = makeBattery({ id: 'M1', soc: 50, power: 100 });
    const offline = {
      ...makeBattery({ id: 'M2' }),
      power: null,
      charging_max: null,
      discharging_max: null,
      soc: null,
      soc_max: null,
      soc_min: null,
      energy: null,
      energy_max: null,
    };

    const { msg } = runTotals([healthy, offline]);

    for (const key of [
      'batteries_total_power',
      'batteries_max_charge_power',
      'batteries_max_discharge_power',
      'batteries_available_energy',
      'batteries_max_energy',
    ]) {
      assert.ok(Number.isFinite(msg[key]), `${key} should stay finite, got ${msg[key]}`);
    }

    // The healthy battery still contributes its full share.
    assert.equal(msg.batteries_total_power, 100);
    assert.equal(msg.batteries_max_charge_power, 2500);
    assert.equal(msg.batteries_available_energy, 2);
    assert.equal(msg.batteries_totals_complete, false);
  });

  it('never lets a NaN reading through to the dashboard totals', () => {
    const poisoned = { ...makeBattery({ id: 'M2' }), energy: NaN, soc_min: NaN };
    const { msg } = runTotals([makeBattery({ id: 'M1', soc: 50 }), poisoned]);

    assert.ok(Number.isFinite(msg.batteries_available_energy));
    assert.equal(msg.batteries_totals_complete, false);
  });

  it('explains which batteries were skipped', () => {
    // The shared logger only speaks in debug (Insights) mode, like every other
    // explanation in this flow.
    const offline = { ...makeBattery({ id: 'M2' }), energy: null };
    const { msg } = runTotals([makeBattery({ id: 'M1', soc: 50 }), offline], { debugMode: true });

    const warning = (msg.log || []).find((entry) => entry.level === 'warn');
    assert.ok(warning, 'expected a warning explanation');
    assert.match(warning.payload, /telemetry unavailable for: M2/);
  });
});

describe('Totals available?', () => {
  function runGuard(msg) {
    return new FunctionRunner({ captureStatus: true }).run({
      flowFile: FLOW,
      node: 'Totals available?',
      msg,
      global: new Initializer().useNoopLogger().global,
    });
  }

  it('passes the message on when every battery reported', () => {
    const msg = { batteries_available_energy: 4, batteries_totals_complete: true };
    assert.equal(runGuard(msg), msg);
  });

  it('drops the message while a battery is unreadable', () => {
    assert.equal(runGuard({ batteries_available_energy: 2, batteries_totals_complete: false }), null);
  });

  it('passes the message on when the flag is absent, for older messages', () => {
    const msg = { batteries_available_energy: 4 };
    assert.equal(runGuard(msg), msg);
  });
});
