'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FunctionRunner } = require('../../lib/function-runner');
const { Initializer } = require('../../support/init-flow');
const { oneVenusEPerPhase } = require('../../fixtures/homes');

describe('Phase command limits', () => {
  it('computes correct charge/discharge limits when readings are within bounds', () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const runner = new FunctionRunner();
    const msg = {
      batteries: oneVenusEPerPhase(),
      grid_power_phase: { L1: 500, L2: -300, L3: 0 },
      grid_power_limit_phase: 5500,
      phase_protection: { enabled: true },
    };

    const result = runner.run({
      flowFile: 'node-red/01 start-flow.json',
      node: 'Phase command limits',
      msg,
      global: initializer.global,
    });

    assert.equal(
      result.phase_protection.command_limits_available,
      true,
      'limits should be available'
    );
    assert.deepEqual(result.phase_protection.command_limit_by_phase.charge, {
      L1: 5000,
      L2: 5800,
      L3: 5500,
    });
    assert.deepEqual(result.phase_protection.command_limit_by_phase.discharge, {
      L1: 6000,
      L2: 5200,
      L3: 5500,
    });
  });

  it('marks limits unavailable when a phase sensor is missing', () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const runner = new FunctionRunner();
    const msg = {
      batteries: oneVenusEPerPhase(),
      grid_power_phase: { L1: 500, L2: null, L3: 0 },
      grid_power_limit_phase: 5500,
      phase_protection: { enabled: true },
    };

    const result = runner.run({
      flowFile: 'node-red/01 start-flow.json',
      node: 'Phase command limits',
      msg,
      global: initializer.global,
    });

    assert.equal(result.phase_protection.command_limits_available, false);
    assert.deepEqual(result.phase_protection.command_limit_by_phase.charge, {
      L1: null,
      L2: null,
      L3: null,
    });
  });

  it('marks limits unavailable when phase protection is disabled', () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const runner = new FunctionRunner();
    const msg = {
      batteries: oneVenusEPerPhase(),
      grid_power_phase: { L1: 500, L2: -300, L3: 0 },
      grid_power_limit_phase: 5500,
      phase_protection: { enabled: false },
    };

    const result = runner.run({
      flowFile: 'node-red/01 start-flow.json',
      node: 'Phase command limits',
      msg,
      global: initializer.global,
    });

    assert.equal(result.phase_protection.command_limits_available, false);
  });
});
