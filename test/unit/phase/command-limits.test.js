'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FunctionRunner } = require('../../lib/function-runner');
const { Initializer } = require('../../support/init-flow');

describe('Phase command limits', () => {
  function runCommandLimits({ batteries, grid_power_phase, phaseLimit = 5500, enabled = true }) {
    const initializer = new Initializer();
    initializer.useNoopLogger();
    const runner = new FunctionRunner();

    const msg = {
      batteries,
      grid_power_phase,
      grid_power_limit_phase: phaseLimit,
      phase_protection: { enabled },
    };

    return runner.run({
      flowFile: 'node-red/01 start-flow.json',
      node: 'Phase command limits',
      msg,
      global: initializer.global,
    });
  }

  it('computes correct charge/discharge limits when readings are within bounds', () => {
    const result = runCommandLimits({
      batteries: [
        { id: 'M1', phase: 'L1', power: 0 },
        { id: 'M2', phase: 'L2', power: 0 },
        { id: 'M3', phase: 'L3', power: 0 },
      ],
      grid_power_phase: { L1: 500, L2: -300, L3: 0 },
    });

    assert.equal(result.phase_protection.command_limits_available, true);
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
    const result = runCommandLimits({
      batteries: [{ id: 'M1', phase: 'L1', power: 0 }],
      grid_power_phase: { L1: 500, L2: null, L3: 0 },
    });

    assert.equal(result.phase_protection.command_limits_available, false);
    assert.deepEqual(result.phase_protection.command_limit_by_phase.charge, {
      L1: null,
      L2: null,
      L3: null,
    });
  });

  it('marks limits unavailable when phase protection is disabled', () => {
    const result = runCommandLimits({
      batteries: [{ id: 'M1', phase: 'L1', power: 0 }],
      grid_power_phase: { L1: 500, L2: -300, L3: 0 },
      enabled: false,
    });

    assert.equal(result.phase_protection.command_limits_available, false);
  });

  describe('across home personas', () => {
    it('single battery with no phase assignment still computes neutral limits', () => {
      const result = runCommandLimits({
        batteries: [{ id: 'M1', phase: 'unassigned', power: 0 }],
        grid_power_phase: { L1: 500, L2: -300, L3: 0 },
      });
      assert.equal(result.phase_protection.command_limits_available, true);
      assert.deepEqual(result.phase_protection.command_limit_by_phase.charge, {
        L1: 5000,
        L2: 5800,
        L3: 5500,
      });
    });

    it('two batteries per phase subtracts their signed contribution from the reading', () => {
      const result = runCommandLimits({
        batteries: [
          { id: 'M1', phase: 'L1', power: 1000 },
          { id: 'M2', phase: 'L1', power: 500 },
          { id: 'M3', phase: 'L2', power: -200 },
          { id: 'M4', phase: 'L2', power: -100 },
          { id: 'M5', phase: 'L3', power: 0 },
          { id: 'M6', phase: 'L3', power: 0 },
        ],
        grid_power_phase: { L1: 2000, L2: -1000, L3: 0 },
      });

      assert.equal(result.phase_protection.command_limits_available, true);
      // L1 reading 2000 - battery contribution 1500 = 500 underlying
      assert.equal(result.phase_protection.command_limit_by_phase.charge.L1, 5000);
      assert.equal(result.phase_protection.command_limit_by_phase.discharge.L1, 6000);
      // L2 reading -1000 - battery contribution -300 = -700 underlying
      assert.equal(result.phase_protection.command_limit_by_phase.charge.L2, 6200);
      assert.equal(result.phase_protection.command_limit_by_phase.discharge.L2, 4800);
    });

    it('heterogeneous battery mix still produces limits for each phase', () => {
      const result = runCommandLimits({
        batteries: [
          { id: 'M1', phase: 'L3', power: 0 },
          { id: 'M2', phase: 'L3', power: 0 },
          { id: 'M3', phase: 'L2', power: 0 },
          { id: 'M4', phase: 'L1', power: 0 },
          { id: 'M5', phase: 'L3', power: 0 },
        ],
        grid_power_phase: { L1: 500, L2: -300, L3: 100 },
      });
      assert.equal(result.phase_protection.command_limits_available, true);
      assert.equal(result.phase_protection.command_limit_by_phase.charge.L1, 5000);
      assert.equal(result.phase_protection.command_limit_by_phase.charge.L2, 5800);
      assert.equal(result.phase_protection.command_limit_by_phase.charge.L3, 5400);
    });
  });
});
