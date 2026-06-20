'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FlowGraph } = require('../lib/flow-graph');
const { Initializer } = require('../support/init-flow');
const { ContextStore } = require('../lib/context-store');
const { StateProvider } = require('../lib/ha-state-mock');
const { oneVenusEPerPhase } = require('../fixtures/homes');

describe('Partials strategy integration', () => {
  it('peak shaves import by discharging when grid power exceeds import limit', async () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const graph = new FlowGraph({
      context: new ContextStore(),
      flow: new ContextStore(),
      global: initializer.global,
    });

    graph.load([
      'node-red/02 strategy-partials.json',
      'node-red/02 strategy-self-consumption.json',
      'node-red/02 strategy-full-stop.json',
    ]);

    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_import', 'on'],
      ['input_number.house_battery_grid_power_limit_import', '2500'],
      ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
    ]);

    const msg = {
      target: 'Standby / peak shave',
      batteries: oneVenusEPerPhase([{ soc: 90 }, { soc: 90 }, { soc: 90 }]),
      grid_power: 5000,
      grid_power_limit_import: 2500,
      grid_power_has_limit_import: true,
      grid_power_has_limit_export: false,
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
    const terminals = await graph.run('Standby / peak shave', msg);

    assert.equal(terminals.length, 1);
    assert.equal(terminals[0].solutions.length, 3);
    assert.ok(terminals[0].solutions.every((s) => s.mode === 'discharge' && s.power > 0));
  });

  it('peak shaves export by charging when grid power exceeds export limit', async () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const graph = new FlowGraph({
      context: new ContextStore(),
      flow: new ContextStore(),
      global: initializer.global,
    });

    graph.load([
      'node-red/02 strategy-partials.json',
      'node-red/02 strategy-self-consumption.json',
      'node-red/02 strategy-full-stop.json',
    ]);

    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_export', 'on'],
      ['input_number.house_battery_grid_power_limit_export', '2500'],
      ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
    ]);

    const msg = {
      target: 'Standby / peak shave',
      batteries: oneVenusEPerPhase([{ soc: 50 }, { soc: 50 }, { soc: 50 }]),
      grid_power: -5000,
      grid_power_limit_export: 2500,
      grid_power_has_limit_import: false,
      grid_power_has_limit_export: true,
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
    const terminals = await graph.run('Standby / peak shave', msg);

    assert.equal(terminals.length, 1);
    assert.equal(terminals[0].solutions.length, 3);
    assert.ok(terminals[0].solutions.every((s) => s.mode === 'charge' && s.power > 0));
  });
});
