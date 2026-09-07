'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FlowGraph } = require('../lib/flow-graph');
const { ContextStore } = require('../lib/context-store');
const { StateProvider } = require('../lib/ha-state-mock');
const { Initializer } = require('../support/init-flow');
const {
  singleVenusE,
  oneVenusEPerPhase,
  twoVenusEPerPhase,
} = require('../fixtures/homes');

describe('Dynamic 2 strategy integration', () => {
  function buildGraph(subStrategy) {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const flow = new ContextStore();
    flow.set('dynamic_strategy', subStrategy);

    const graph = new FlowGraph({
      context: new ContextStore(),
      flow,
      global: initializer.global,
    });
    graph.load([
      'node-red/02 strategy-dynamic-2.json',
      'node-red/02 strategy-charge.json',
      'node-red/02 strategy-sell.json',
      'node-red/02 strategy-self-consumption.json',
      'node-red/02 strategy-full-stop.json',
    ]);

    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
      ['input_select.house_battery_strategy_charge_goal', 'batteries are full'],
      ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
      ['input_select.house_battery_strategy_sell_goal', 'state of charge'],
      ['input_number.house_battery_strategy_sell_target_soc', '11'],
      ['input_select.house_battery_strategy_sell_goal_reached', 'Full stop'],
    ]);
    graph.stateProvider = new StateProvider(state);

    return { graph, flow, initializer };
  }

  function makeMsg(batteries) {
    return {
      batteries,
      grid_power_has_limit_import: false,
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
  }

  it('executes the cached Charge sub-strategy without phase limits', async () => {
    const { graph } = buildGraph('Charge');
    const msg = makeMsg(oneVenusEPerPhase());

    const terminals = await graph.run('Dynamic 2', msg);

    assert.equal(terminals.length, 1);
    assert.equal(terminals[0].solutions.length, 3);
    assert.ok(terminals[0].solutions.every((s) => s.mode === 'charge' && s.power === 2500));
  });

  it('executes the cached Sell sub-strategy without phase limits', async () => {
    const { graph } = buildGraph('Sell');
    const msg = makeMsg(oneVenusEPerPhase([{ soc: 90 }, { soc: 90 }, { soc: 90 }]));

    const terminals = await graph.run('Dynamic 2', msg);

    assert.equal(terminals.length, 1);
    assert.equal(terminals[0].solutions.length, 3);
    assert.ok(terminals[0].solutions.every((s) => s.mode === 'discharge' && s.power === 2500));
  });

  it('throttles Charge via per-phase command limits', async () => {
    const { graph } = buildGraph('Charge');
    const msg = makeMsg(twoVenusEPerPhase());
    msg.phase_protection = {
      enabled: false,
      command_limits_available: true,
      command_limit_by_phase: {
        charge: { L1: 3000, L2: 3000, L3: 3000 },
        discharge: { L1: null, L2: null, L3: null },
      },
    };

    const terminals = await graph.run('Dynamic 2', msg);

    assert.equal(terminals.length, 1);
    const solutions = terminals[0].solutions;
    assert.equal(solutions.length, 6);
    assert.ok(solutions.every((s) => s.mode === 'charge'));
    for (let i = 0; i < 6; i += 2) {
      assert.equal(solutions[i].power, 1500);
      assert.equal(solutions[i + 1].power, 1500);
    }
  });

  it('throttles Sell via per-phase command limits', async () => {
    const { graph } = buildGraph('Sell');
    const msg = makeMsg(twoVenusEPerPhase({
      0: { soc: 90 },
      1: { soc: 90 },
      2: { soc: 90 },
      3: { soc: 90 },
      4: { soc: 90 },
      5: { soc: 90 },
    }));
    msg.phase_protection = {
      enabled: false,
      command_limits_available: true,
      command_limit_by_phase: {
        charge: { L1: null, L2: null, L3: null },
        discharge: { L1: 3000, L2: 3000, L3: 3000 },
      },
    };

    const terminals = await graph.run('Dynamic 2', msg);

    assert.equal(terminals.length, 1);
    const solutions = terminals[0].solutions;
    assert.equal(solutions.length, 6);
    assert.ok(solutions.every((s) => s.mode === 'discharge'));
    for (let i = 0; i < 6; i += 2) {
      assert.equal(solutions[i].power, 1500);
      assert.equal(solutions[i + 1].power, 1500);
    }
  });

  it('leaves an unassigned single battery untouched by phase limits', async () => {
    const { graph } = buildGraph('Charge');
    const msg = makeMsg(singleVenusE());
    msg.phase_protection = {
      enabled: true,
      command_limits_available: true,
      command_limit_by_phase: {
        charge: { L1: 500, L2: 500, L3: 500 },
        discharge: { L1: null, L2: null, L3: null },
      },
    };

    const terminals = await graph.run('Dynamic 2', msg);

    assert.equal(terminals.length, 1);
    assert.deepEqual(terminals[0].solutions, [
      { id: 'M1', mode: 'charge', power: 2500 },
    ]);
  });
});
