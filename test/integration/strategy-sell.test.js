'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FlowGraph } = require('../lib/flow-graph');
const { Initializer } = require('../support/init-flow');
const { ContextStore } = require('../lib/context-store');
const { StateProvider } = require('../lib/ha-state-mock');
const { singleVenusE, twoVenusEPerPhase } = require('../fixtures/homes');

describe('Sell strategy integration', () => {
  it('discharges at max power without limits', async () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const graph = new FlowGraph({
      context: new ContextStore(),
      flow: new ContextStore(),
      global: initializer.global,
    });
    graph.load(['node-red/02 strategy-sell.json', 'node-red/02 strategy-full-stop.json']);

    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
      ['input_select.house_battery_strategy_sell_goal', 'state of charge'],
      ['input_number.house_battery_strategy_sell_target_soc', '11'],
      ['input_select.house_battery_strategy_sell_goal_reached', 'Full stop'],
    ]);

    const msg = {
      batteries: singleVenusE({ soc: 90 }),
      grid_power_has_limit_export: false,
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
    const terminals = await graph.run('Sell', msg);

    assert.equal(terminals.length, 1);
    assert.deepEqual(terminals[0].solutions, [
      { id: 'M1', mode: 'discharge', power: 2500 },
    ]);
  });

  it('throttles max-power discharge when phase command limits are lower', async () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const graph = new FlowGraph({
      context: new ContextStore(),
      flow: new ContextStore(),
      global: initializer.global,
    });
    graph.load(['node-red/02 strategy-sell.json', 'node-red/02 strategy-full-stop.json']);

    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
      ['input_select.house_battery_strategy_sell_goal', 'state of charge'],
      ['input_number.house_battery_strategy_sell_target_soc', '11'],
      ['input_select.house_battery_strategy_sell_goal_reached', 'Full stop'],
    ]);

    const msg = {
      batteries: twoVenusEPerPhase({
        0: { soc: 90 },
        1: { soc: 90 },
        2: { soc: 90 },
        3: { soc: 90 },
        4: { soc: 90 },
        5: { soc: 90 },
      }),
      grid_power_has_limit_export: false,
      phase_protection: {
        enabled: false,
        command_limits_available: true,
        command_limit_by_phase: {
          charge: { L1: null, L2: null, L3: null },
          discharge: { L1: 3000, L2: 3000, L3: 3000 },
        },
      },
    };

    graph.stateProvider = new StateProvider(state);
    const terminals = await graph.run('Sell', msg);

    assert.equal(terminals.length, 1);
    const solutions = terminals[0].solutions;
    assert.equal(solutions[0].power, 2500);
    assert.equal(solutions[1].power, 500);
    assert.equal(solutions[2].power, 2500);
    assert.equal(solutions[3].power, 500);
    assert.equal(solutions[4].power, 2500);
    assert.equal(solutions[5].power, 500);
  });
});
