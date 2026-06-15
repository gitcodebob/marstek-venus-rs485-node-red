'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FunctionRunner } = require('../../lib/function-runner');
const { Initializer } = require('../../support/init-flow');

describe('Phase protection guard', () => {
  it('preempts Charge to Standby/peak shave on an import overload', () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();
    const runner = new FunctionRunner();

    const msg = {
      target: 'Charge',
      batteries: [
        { id: 'M1', phase: 'L1', power: 0 },
        { id: 'M2', phase: 'L2', power: 0 },
      ],
      grid_power_phase: { L1: 6000, L2: 0, L3: 0 },
      grid_power_limit_phase: 5500,
      phase_protection: { enabled: true },
    };

    const result = runner.run({
      flowFile: 'node-red/01 start-flow.json',
      node: 'Phase protection guard',
      msg,
      global: initializer.global,
    });

    assert.equal(result.target, 'Standby / peak shave');
    assert.equal(result.phase_protection.preempted_strategy, 'Charge');
  });

  it('does not preempt Full stop', () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();
    const runner = new FunctionRunner();

    const msg = {
      target: 'Full stop',
      batteries: [
        { id: 'M1', phase: 'L1', power: 0 },
      ],
      grid_power_phase: { L1: 6000, L2: 0, L3: 0 },
      grid_power_limit_phase: 5500,
      phase_protection: { enabled: true },
    };

    const result = runner.run({
      flowFile: 'node-red/01 start-flow.json',
      node: 'Phase protection guard',
      msg,
      global: initializer.global,
    });

    assert.equal(result.target, 'Full stop');
  });

  it('does nothing when phase sensors are missing', () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();
    const runner = new FunctionRunner();

    const msg = {
      target: 'Charge',
      batteries: [
        { id: 'M1', phase: 'L1', power: 0 },
      ],
      grid_power_phase: { L1: 6000, L2: null, L3: 0 },
      grid_power_limit_phase: 5500,
      phase_protection: { enabled: true },
    };

    const result = runner.run({
      flowFile: 'node-red/01 start-flow.json',
      node: 'Phase protection guard',
      msg,
      global: initializer.global,
    });

    assert.equal(result.target, 'Charge');
  });

  it('does nothing when no battery has a phase assigned', () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();
    const runner = new FunctionRunner();

    const msg = {
      target: 'Charge',
      batteries: [
        { id: 'M1', phase: 'unassigned', power: 0 },
      ],
      grid_power_phase: { L1: 6000, L2: 0, L3: 0 },
      grid_power_limit_phase: 5500,
      phase_protection: { enabled: true },
    };

    const result = runner.run({
      flowFile: 'node-red/01 start-flow.json',
      node: 'Phase protection guard',
      msg,
      global: initializer.global,
    });

    assert.equal(result.target, 'Charge');
  });
});
