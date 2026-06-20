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

describe('Partials strategy integration', () => {
  function buildGraph() {
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
    return { graph, initializer };
  }

  it('peak shaves import by discharging when grid power exceeds import limit', async () => {
    const { graph } = buildGraph();
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
    const { graph } = buildGraph();
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

  describe('per-phase peak shaving when aggregate grid power is inside limits', () => {
    function makeMsg(batteries) {
      return {
        target: 'Charge',
        batteries,
        grid_power: 0,
        grid_power_limit_phase: 5500,
        grid_power_has_limit_import: false,
        grid_power_has_limit_export: false,
        phase_protection: {
          enabled: true,
          command_limits_available: true,
          command_limit_by_phase: {
            charge: { L1: 3000, L2: 3000, L3: 3000 },
            discharge: { L1: 3000, L2: 3000, L3: 3000 },
          },
        },
        advanced_settings: {},
      };
    }

    it('triggers import peak shave when a single phase is overloaded', async () => {
      const { graph } = buildGraph();
      const state = new Map([
        ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
        ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
      ]);

      const msg = makeMsg(oneVenusEPerPhase([{ soc: 90 }, { soc: 90 }, { soc: 90 }]));
      msg.grid_power_phase = { L1: 6000, L2: 0, L3: 0 };

      graph.stateProvider = new StateProvider(state);
      const terminals = await graph.run('Standby / peak shave', msg);

      assert.equal(terminals.length, 1);
      assert.equal(terminals[0].target, 'Self-consumption');
      assert.ok(terminals[0].solutions.some((s) => s.mode === 'discharge' && s.power > 0));
      assert.ok(terminals[0].solutions.every((s) => s.power <= 3000));
    });

    it('triggers export peak shave when a single phase is overloaded', async () => {
      const { graph } = buildGraph();
      const state = new Map([
        ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
        ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
      ]);

      const msg = makeMsg(oneVenusEPerPhase([{ soc: 50 }, { soc: 50 }, { soc: 50 }]));
      msg.grid_power_phase = { L1: -6000, L2: 0, L3: 0 };

      graph.stateProvider = new StateProvider(state);
      const terminals = await graph.run('Standby / peak shave', msg);

      assert.equal(terminals.length, 1);
      assert.equal(terminals[0].target, 'Self-consumption');
      assert.ok(terminals[0].solutions.some((s) => s.mode === 'charge' && s.power > 0));
      assert.ok(terminals[0].solutions.every((s) => s.power <= 3000));
    });

    it('is not relevant for a single unassigned battery', async () => {
      const { graph } = buildGraph();
      const state = new Map([
        ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
        ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
      ]);

      const msg = makeMsg(singleVenusE({ soc: 90 }));
      msg.grid_power_phase = { L1: 6000, L2: 0, L3: 0 };

      graph.stateProvider = new StateProvider(state);
      const terminals = await graph.run('Standby / peak shave', msg);

      // The partials logic may return no terminal early when there is no
      // assigned battery on the overloaded phase. If it does return, the
      // solution must not create a meaningful active discharge.
      assert.ok(
        terminals.length === 0 ||
          terminals[0].solutions.every((s) => s.mode === 'stop' || s.power === 0 || s.power === 1),
        'expected no meaningful discharge from an unassigned battery'
      );
    });
  });
});
