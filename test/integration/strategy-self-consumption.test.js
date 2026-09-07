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
  fourBatteriesUnevenPhases,
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
    // The 1 W idle also satisfies `power > 0`, so assert real work was assigned.
    assert.ok(terminals[0].pid.load_assigned > 0);
    assert.equal(terminals[0].pid.load_unassigned, 0);
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

  it('concentrates aggregate discharge on one battery when no phase is overloaded', async () => {
    const { graph } = buildGraph();
    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
      ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
    ]);

    // Per-phase command limits are available (per-phase peak shaving is switched on)
    // but no phase is actually in violation, so `phase_protection.active` stays unset.
    // The demand is well under a single inverter's rating and must not be spread.
    const msg = {
      batteries: fourBatteriesUnevenPhases([{ soc: 100 }, { soc: 100 }, { soc: 98 }, { soc: 98 }]),
      grid_power: 900,
      advanced_settings: {},
      phase_protection: {
        enabled: true,
        command_limits_available: true,
        command_limit_by_phase: {
          charge: { L1: 5000, L2: 5000, L3: 5000 },
          discharge: { L1: 5000, L2: 5000, L3: 5000 },
        },
      },
    };

    graph.stateProvider = new StateProvider(state);
    const terminals = await graph.run('Self-consumption', msg);

    assert.equal(terminals.length, 1);
    const solutions = terminals[0].solutions;
    assert.equal(solutions.length, 4);

    // Everything above the 1 W "keep the relay engaged" idle counts as real load.
    const working = solutions.filter((s) => s.power > 1);
    assert.equal(
      working.length,
      1,
      `expected a single battery to carry the load, got ${JSON.stringify(solutions)}`
    );
    assert.equal(working[0].power, terminals[0].pid.load_assigned);
    assert.ok(solutions.every((s) => s.power <= 2500));
  });

  it('still splits a phase-protection requirement across the batteries on that phase', async () => {
    const { graph } = buildGraph();
    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
      ['input_boolean.house_battery_grid_power_has_limit_export', 'off'],
    ]);

    // L3 is in violation and carries two batteries; the correction is shared between
    // them rather than being dumped on the first one.
    const msg = {
      batteries: fourBatteriesUnevenPhases([{ soc: 100 }, { soc: 100 }, { soc: 98 }, { soc: 98 }]),
      grid_power: 900,
      advanced_settings: {},
      phase_protection: {
        enabled: true,
        active: true,
        direction: 'import',
        active_phases: ['L3'],
        required_by_phase: { L1: 0, L2: 0, L3: 1000 },
        aggregate_residual_power: 0,
        required_total_power: 1000,
        command_limits_available: true,
        command_limit_by_phase: {
          charge: { L1: 5000, L2: 5000, L3: 5000 },
          discharge: { L1: 5000, L2: 5000, L3: 5000 },
        },
      },
    };

    graph.stateProvider = new StateProvider(state);
    const terminals = await graph.run('Self-consumption', msg);

    assert.equal(terminals.length, 1);
    const byId = new Map(terminals[0].solutions.map((s) => [s.id, s.power]));
    assert.equal(byId.get('M1'), 500);
    assert.equal(byId.get('M2'), 500);
    // Batteries on the healthy phases are not recruited for a phase correction.
    assert.ok(byId.get('M3') <= 1);
    assert.ok(byId.get('M4') <= 1);
  });

  it('skips a battery whose SoC floor is unavailable instead of discharging it', async () => {
    const { graph } = buildGraph();
    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
    ]);

    // M1 did not report, so its SoC and floor normalize to null. Number(null) is 0, so an
    // unguarded check reads the floor as 0 % and would happily discharge it flat.
    const batteries = oneVenusEPerPhase([{ soc: 90 }, { soc: 90 }, { soc: 90 }]);
    batteries[0].soc = null;
    batteries[0].soc_min = null;

    const msg = {
      batteries,
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

    const byId = new Map(terminals[0].solutions.map((s) => [s.id, s.power]));
    // At most the 1 W idle that keeps the relay engaged — never a real discharge.
    assert.ok(byId.get('M1') <= 1, `M1 should not be discharged, got ${byId.get('M1')} W`);
    // A healthy battery still covers the import.
    const working = terminals[0].solutions.filter((s) => s.power > 1);
    assert.equal(working.length, 1);
    assert.notEqual(working[0].id, 'M1');
  });

  it('treats an unknown per-phase limit as no limit, not as a 0 W ceiling', async () => {
    const { graph } = buildGraph();
    const state = new Map([
      ['input_boolean.house_battery_grid_power_has_limit_import', 'off'],
    ]);

    // `Phase command limits` publishes null limits whenever per-phase peak shaving is
    // off. Number(null) is 0, so an unguarded clamp would pin every phase-assigned
    // battery at 0 W and the pack would never discharge.
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
    // Full capacity is available, and the correction is actually assigned.
    assert.equal(terminals[0].pid.load_capacity, 7500);
    assert.equal(terminals[0].pid.load_assigned, terminals[0].pid.load);
    assert.equal(terminals[0].pid.load_unassigned, 0);
  });
});
