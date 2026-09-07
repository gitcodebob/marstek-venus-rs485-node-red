'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FunctionRunner } = require('../../lib/function-runner');
const { Initializer } = require('../../support/init-flow');

describe('Phase protection guard', () => {
  function runGuard({ target, batteries, grid_power_phase, phaseLimit = 5500 }) {
    const initializer = new Initializer();
    initializer.useNoopLogger();
    const runner = new FunctionRunner();

    const msg = {
      target,
      batteries,
      grid_power_phase,
      grid_power_limit_phase: phaseLimit,
      phase_protection: { enabled: true },
    };

    return runner.run({
      flowFile: 'node-red/01 start-flow.json',
      node: 'Phase protection guard',
      msg,
      global: initializer.global,
    });
  }

  describe('preempts direct strategies on an import overload', () => {
    it('Charge', () => {
      const result = runGuard({
        target: 'Charge',
        batteries: [{ id: 'M1', phase: 'L1', power: 0 }],
        grid_power_phase: { L1: 6000, L2: 0, L3: 0 },
      });
      assert.equal(result.target, 'Standby / peak shave');
      assert.equal(result.phase_protection.preempted_strategy, 'Charge');
    });

    it('Sell', () => {
      const result = runGuard({
        target: 'Sell',
        batteries: [{ id: 'M1', phase: 'L1', power: 0 }],
        grid_power_phase: { L1: 6000, L2: 0, L3: 0 },
      });
      assert.equal(result.target, 'Standby / peak shave');
      assert.equal(result.phase_protection.preempted_strategy, 'Sell');
    });

    it('Dynamic 2', () => {
      const result = runGuard({
        target: 'Dynamic 2',
        batteries: [{ id: 'M1', phase: 'L1', power: 0 }],
        grid_power_phase: { L1: 6000, L2: 0, L3: 0 },
      });
      assert.equal(result.target, 'Standby / peak shave');
      assert.equal(result.phase_protection.preempted_strategy, 'Dynamic 2');
    });
  });

  describe('preempts direct strategies on an export overload', () => {
    it('Charge', () => {
      const result = runGuard({
        target: 'Charge',
        batteries: [{ id: 'M1', phase: 'L1', power: 0 }],
        grid_power_phase: { L1: -6000, L2: 0, L3: 0 },
      });
      assert.equal(result.target, 'Standby / peak shave');
    });

    it('Sell', () => {
      const result = runGuard({
        target: 'Sell',
        batteries: [{ id: 'M1', phase: 'L1', power: 0 }],
        grid_power_phase: { L1: -6000, L2: 0, L3: 0 },
      });
      assert.equal(result.target, 'Standby / peak shave');
    });
  });

  it('does not preempt Full stop', () => {
    const result = runGuard({
      target: 'Full stop',
      batteries: [{ id: 'M1', phase: 'L1', power: 0 }],
      grid_power_phase: { L1: 6000, L2: 0, L3: 0 },
    });
    assert.equal(result.target, 'Full stop');
  });

  it('does nothing when phase sensors are missing', () => {
    const result = runGuard({
      target: 'Charge',
      batteries: [{ id: 'M1', phase: 'L1', power: 0 }],
      grid_power_phase: { L1: 6000, L2: null, L3: 0 },
    });
    assert.equal(result.target, 'Charge');
  });

  describe('across home personas', () => {
    const cases = [
      {
        name: 'single battery with no phase assigned',
        batteries: [{ id: 'M1', phase: 'unassigned', power: 0 }],
        expectPreempt: false,
        reason: 'no phase has an assigned battery',
      },
      {
        name: 'single battery on the overloaded phase',
        batteries: [{ id: 'M1', phase: 'L1', power: 0 }],
        expectPreempt: true,
      },
      {
        name: 'one battery per phase',
        batteries: [
          { id: 'M1', phase: 'L1', power: 0 },
          { id: 'M2', phase: 'L2', power: 0 },
          { id: 'M3', phase: 'L3', power: 0 },
        ],
        expectPreempt: true,
      },
      {
        name: 'two batteries per phase',
        batteries: [
          { id: 'M1', phase: 'L1', power: 0 },
          { id: 'M2', phase: 'L1', power: 0 },
          { id: 'M3', phase: 'L2', power: 0 },
          { id: 'M4', phase: 'L2', power: 0 },
          { id: 'M5', phase: 'L3', power: 0 },
          { id: 'M6', phase: 'L3', power: 0 },
        ],
        expectPreempt: true,
      },
      {
        name: 'no battery on the overloaded phase',
        batteries: [
          { id: 'M1', phase: 'L2', power: 0 },
          { id: 'M2', phase: 'L3', power: 0 },
        ],
        expectPreempt: false,
        reason: 'L1 has no assigned battery',
      },
    ];

    for (const { name, batteries, expectPreempt, reason } of cases) {
      it(name, () => {
        const result = runGuard({
          target: 'Charge',
          batteries,
          grid_power_phase: { L1: 6000, L2: 0, L3: 0 },
        });
        if (expectPreempt) {
          assert.equal(result.target, 'Standby / peak shave');
        } else {
          assert.equal(result.target, 'Charge', reason || 'expected no preempt');
        }
      });
    }
  });
});
