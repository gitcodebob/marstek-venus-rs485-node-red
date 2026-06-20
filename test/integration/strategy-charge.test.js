'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FlowGraph } = require('../lib/flow-graph');
const { Initializer } = require('../support/init-flow');
const { ContextStore } = require('../lib/context-store');
const { StateProvider } = require('../lib/ha-state-mock');
const {
  singleVenusE,
  singleVenusEThrottled,
  oneVenusEPerPhase,
  twoVenusEPerPhase,
  heterogeneousSystem,
} = require('../fixtures/homes');

describe('Charge strategy integration', () => {
  function runCharge(home, overrides = {}) {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const graph = new FlowGraph({
      context: new ContextStore(),
      flow: new ContextStore(),
      global: initializer.global,
    });
    graph.load(['node-red/02 strategy-charge.json']);

    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
      ['input_select.house_battery_strategy_charge_goal', 'batteries are full'],
    ]);

    const msg = {
      batteries: home,
      grid_power_has_limit_import: false,
      phase_protection: {
        enabled: false,
        command_limits_available: false,
        command_limit_by_phase: {
          charge: { L1: null, L2: null, L3: null },
          discharge: { L1: null, L2: null, L3: null },
        },
      },
      ...overrides,
    };

    graph.stateProvider = new StateProvider(state);
    return graph.run('Charge', msg);
  }

  it('charges a single battery at max power with no phase limits', async () => {
    const terminals = await runCharge(singleVenusE());
    assert.equal(terminals.length, 1);
    assert.deepEqual(terminals[0].solutions, [
      { id: 'M1', mode: 'charge', power: 2500 },
    ]);
  });

  it('charges one battery per phase at max power with no phase limits', async () => {
    const terminals = await runCharge(oneVenusEPerPhase());
    assert.equal(terminals.length, 1);
    assert.equal(terminals[0].solutions.length, 3);
    assert.ok(terminals[0].solutions.every((s) => s.mode === 'charge' && s.power === 2500));
  });

  it('fairly shares a tight phase limit between two batteries per phase', async () => {
    const phaseProtection = {
      enabled: false,
      command_limits_available: true,
      command_limit_by_phase: {
        charge: { L1: 3000, L2: 3000, L3: 3000 },
        discharge: { L1: null, L2: null, L3: null },
      },
    };
    const terminals = await runCharge(twoVenusEPerPhase(), { phase_protection: phaseProtection });
    assert.equal(terminals.length, 1);
    const solutions = terminals[0].solutions;
    // Two batteries per phase, each wants 2500 W, phase limit 3000 W.
    assert.equal(solutions[0].power, 1500);
    assert.equal(solutions[1].power, 1500);
    assert.equal(solutions[2].power, 1500);
    assert.equal(solutions[3].power, 1500);
    assert.equal(solutions[4].power, 1500);
    assert.equal(solutions[5].power, 1500);
  });

  it('charges the full budget for single battery per phase when limited', async () => {
    const phaseProtection = {
      enabled: false,
      command_limits_available: true,
      command_limit_by_phase: {
        charge: { L1: 1800, L2: 2000, L3: 2200 },
        discharge: { L1: null, L2: null, L3: null },
      },
    };
    const terminals = await runCharge(oneVenusEPerPhase(), { phase_protection: phaseProtection });
    assert.equal(terminals.length, 1);
    const solutions = terminals[0].solutions;
    assert.equal(solutions[0].power, 1800);
    assert.equal(solutions[1].power, 2000);
    assert.equal(solutions[2].power, 2200);
  });

  it('preserves charge priority under phase throttling', async () => {
    const batteries = twoVenusEPerPhase();
    // Mark the second battery in each phase priority.
    batteries[1].is_priority_battery = true;
    batteries[3].is_priority_battery = true;
    batteries[5].is_priority_battery = true;

    const phaseProtection = {
      enabled: false,
      command_limits_available: true,
      command_limit_by_phase: {
        charge: { L1: 3000, L2: 3000, L3: 3000 },
        discharge: { L1: null, L2: null, L3: null },
      },
    };
    const terminals = await runCharge(batteries, { phase_protection: phaseProtection });
    assert.equal(terminals.length, 1);
    const solutions = terminals[0].solutions;
    // M2, M4, M6 are priority and get 2500 W first; M1, M3, M5 get the 500 W remainder.
    assert.equal(solutions[0].power, 500);
    assert.equal(solutions[1].power, 2500);
    assert.equal(solutions[2].power, 500);
    assert.equal(solutions[3].power, 2500);
    assert.equal(solutions[4].power, 500);
    assert.equal(solutions[5].power, 2500);
  });

  it('redistributes unused phase charge allowance to other batteries on the same phase', async () => {
    // Two batteries per phase, one on each phase requests only 1000 W.
    const batteries = twoVenusEPerPhase({
      0: { chargeMaxW: 1000 },
      2: { chargeMaxW: 1000 },
      4: { chargeMaxW: 1000 },
    });

    const phaseProtection = {
      enabled: false,
      command_limits_available: true,
      command_limit_by_phase: {
        charge: { L1: 3000, L2: 3000, L3: 3000 },
        discharge: { L1: null, L2: null, L3: null },
      },
    };
    const terminals = await runCharge(batteries, { phase_protection: phaseProtection });
    assert.equal(terminals.length, 1);
    const solutions = terminals[0].solutions;
    // Phase budget 3000. First battery takes 1000, second gets the remaining 2000.
    for (let i = 0; i < 6; i += 2) {
      assert.equal(solutions[i].power, 1000);
      assert.equal(solutions[i + 1].power, 2000);
    }
  });

  it('leaves an unassigned single battery unchanged when phase limits are active', async () => {
    const phaseProtection = {
      enabled: true,
      command_limits_available: true,
      command_limit_by_phase: {
        charge: { L1: 500, L2: 500, L3: 500 },
        discharge: { L1: null, L2: null, L3: null },
      },
    };
    // Single battery with no phase assignment is not throttled by per-phase limits.
    const terminals = await runCharge(singleVenusE(), { phase_protection: phaseProtection });
    assert.equal(terminals.length, 1);
    assert.deepEqual(terminals[0].solutions, [
      { id: 'M1', mode: 'charge', power: 2500 },
    ]);
  });
});
