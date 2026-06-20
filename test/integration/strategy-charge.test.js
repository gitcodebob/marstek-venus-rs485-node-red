'use strict';

// NOTE: The `phase_protection` payload is preserved in these tests even though
// the current `main` branch does not implement phase-aware throttling. It will
// become relevant in the upcoming phase-protection PR, keeping future diffs small.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FlowGraph } = require('../lib/flow-graph');
const { Initializer } = require('../support/init-flow');
const { ContextStore } = require('../lib/context-store');
const { StateProvider } = require('../lib/ha-state-mock');
const { singleVenusEThrottled } = require('../fixtures/homes');

describe('Charge strategy integration', () => {
  it('charges at max power without limits', async () => {
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
      batteries: singleVenusEThrottled(),
      grid_power_has_limit_import: false,
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
    const terminals = await graph.run('Charge', msg);

    assert.equal(terminals.length, 1);
    assert.deepEqual(terminals[0].solutions, [
      { id: 'M1', mode: 'charge', power: 2500 },
    ]);
  });

});
