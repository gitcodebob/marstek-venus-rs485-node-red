'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FlowGraph } = require('../lib/flow-graph');
const { Initializer } = require('../support/init-flow');
const { ContextStore } = require('../lib/context-store');
const { StateProvider } = require('../lib/ha-state-mock');
const {
  singleVenusE,
  oneVenusEPerPhase,
  twoVenusEPerPhase,
} = require('../fixtures/homes');

describe('Self-consumption strategy integration', () => {
  function buildGraph() {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const graph = new FlowGraph({
      context: new ContextStore(),
      flow: new ContextStore(),
      global: initializer.global,
    });
    graph.load(['node-red/02 strategy-self-consumption.json', 'node-red/02 strategy-full-stop.json']);
    return { graph, initializer };
  }

  it('charges surplus power when exporting to the grid', async () => {
    const { graph } = buildGraph();
    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
    ]);

    const msg = {
      batteries: twoVenusEPerPhase({ 0: { soc: 50 }, 1: { soc: 50 }, 2: { soc: 50 }, 3: { soc: 50 }, 4: { soc: 50 }, 5: { soc: 50 } }),
      grid_power: -4000,
      advanced_settings: {},
      phase_protection: {
        enabled: false,
        command_limits_available: false,
        command_limit_by_phase: {
          charge: { L1: null, L2: null, L3: null },
          discharge: { L1: null, L2: null, L3: null },
        },
      },
    };

    graph.stateProvider = new StateProvider(state);
    const terminals = await graph.run('Self-consumption', msg);

    assert.equal(terminals.length, 1);
    assert.equal(terminals[0].solutions.length, 6);
    assert.ok(terminals[0].solutions.every((s) => s.mode === 'charge' && s.power > 0));
  });

  it('discharges to cover import when drawing from the grid', async () => {
    const { graph } = buildGraph();
    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
    ]);

    const msg = {
      batteries: oneVenusEPerPhase([{ soc: 90 }, { soc: 90 }, { soc: 90 }]),
      grid_power: 3000,
      advanced_settings: {},
      phase_protection: {
        enabled: false,
        command_limits_available: false,
        command_limit_by_phase: {
          charge: { L1: null, L2: null, L3: null },
          discharge: { L1: null, L2: null, L3: null },
        },
      },
    };

    graph.stateProvider = new StateProvider(state);
    const terminals = await graph.run('Self-consumption', msg);

    assert.equal(terminals.length, 1);
    assert.equal(terminals[0].solutions.length, 3);
    assert.ok(terminals[0].solutions.every((s) => s.mode === 'discharge' && s.power > 0));
  });

  it('throttles discharge according to per-phase command limits', async () => {
    const { graph } = buildGraph();
    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
      ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
    ]);

    const msg = {
      batteries: oneVenusEPerPhase([{ soc: 90 }, { soc: 90 }, { soc: 90 }]),
      grid_power: 6000,
      advanced_settings: {},
      phase_protection: {
        enabled: true,
        command_limits_available: true,
        command_limit_by_phase: {
          charge: { L1: 3000, L2: 3000, L3: 3000 },
          discharge: { L1: 3000, L2: 3000, L3: 3000 },
        },
      },
    };

    graph.stateProvider = new StateProvider(state);
    const terminals = await graph.run('Self-consumption', msg);

    assert.equal(terminals.length, 1);
    const solutions = terminals[0].solutions;
    assert.equal(solutions.length, 3);
    assert.ok(solutions.every((s) => s.mode === 'discharge' && s.power > 0));
    // Each battery gets no more than its phase discharge limit.
    assert.ok(solutions.every((s) => s.power <= 3000));
  });

  it('redistributes unused phase charge allowance to other batteries on the same phase', async () => {
    const { graph } = buildGraph();
    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
      ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
    ]);

    // First battery on each phase is at 99 % SoC and limited to 1000 W; second
    // battery can use the remaining phase budget.
    const batteries = twoVenusEPerPhase({
      0: { soc: 99 },
      2: { soc: 99 },
      4: { soc: 99 },
    });

    const msg = {
      batteries,
      grid_power: -12000,
      advanced_settings: {},
      phase_protection: {
        enabled: true,
        command_limits_available: true,
        command_limit_by_phase: {
          charge: { L1: 3000, L2: 3000, L3: 3000 },
          discharge: { L1: null, L2: null, L3: null },
        },
      },
    };

    graph.stateProvider = new StateProvider(state);
    const terminals = await graph.run('Self-consumption', msg);

    assert.equal(terminals.length, 1);
    const solutions = terminals[0].solutions;
    assert.equal(solutions.length, 6);
    assert.ok(solutions.every((s) => s.mode === 'charge'));
    for (let i = 0; i < 6; i += 2) {
      assert.equal(solutions[i].power, 1000);
      assert.equal(solutions[i + 1].power, 2000);
    }
  });
});
