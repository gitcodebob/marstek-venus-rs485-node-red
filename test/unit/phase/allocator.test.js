'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Initializer } = require('../../support/init-flow');

describe('phasePowerAllocator', () => {
  function allocator() {
    const initializer = new Initializer();
    initializer.initialize();
    return initializer.global.get('phasePowerAllocator');
  }

  it('exposes the expected phases', () => {
    const pa = allocator();
    assert.deepEqual(pa.phases, ['L1', 'L2', 'L3']);
  });

  describe('getPhase', () => {
    it('maps known phases to uppercase and unknown to unassigned', () => {
      const pa = allocator();
      assert.equal(pa.getPhase({ phase: 'L1' }), 'L1');
      assert.equal(pa.getPhase({ phase: 'l2' }), 'L2');
      assert.equal(pa.getPhase({ phase: 'unknown' }), 'unassigned');
      assert.equal(pa.getPhase({ phase: '' }), 'unassigned');
      assert.equal(pa.getPhase({}), 'unassigned');
    });
  });

  describe('getResponsivePowerLimit', () => {
    it('returns the requested power for a normal charge request', () => {
      const pa = allocator();
      const battery = { soc: 50, soc_max: 100, soc_min: 10, power: 0 };
      assert.equal(pa.getResponsivePowerLimit(battery, 2500, 'charge'), 2500);
    });

    it('returns zero when charge would exceed SoC max', () => {
      const pa = allocator();
      const battery = { soc: 100, soc_max: 100, soc_min: 10, power: 0 };
      assert.equal(pa.getResponsivePowerLimit(battery, 2500, 'charge'), 0);
    });

    it('returns zero when discharge would fall below SoC min', () => {
      const pa = allocator();
      const battery = { soc: 10, soc_max: 100, soc_min: 10, power: 0 };
      assert.equal(pa.getResponsivePowerLimit(battery, 2500, 'discharge'), 0);
    });

    it('caps charge power when the battery is near full and underusing a sustained command', () => {
      const pa = allocator();
      const tenSecondsAgo = Date.now() - 10_000;
      const battery = {
        soc: 97,
        soc_max: 100,
        soc_min: 10,
        power: 800,
        last_command: { mode: 'charge', power: 2500, since: tenSecondsAgo },
      };
      assert.equal(pa.getResponsivePowerLimit(battery, 2500, 'charge'), 900);
    });

    it('does not cap charge power before sustained underuse when not near full', () => {
      const pa = allocator();
      const twoSecondsAgo = Date.now() - 2_000;
      const battery = {
        soc: 80,
        soc_max: 100,
        soc_min: 10,
        power: 800,
        last_command: { mode: 'charge', power: 2500, since: twoSecondsAgo },
      };
      assert.equal(pa.getResponsivePowerLimit(battery, 2500, 'charge'), 2500);
    });

    it('ignores unrelated past command modes when deciding underuse', () => {
      const pa = allocator();
      const tenSecondsAgo = Date.now() - 10_000;
      const battery = {
        soc: 50,
        soc_max: 100,
        soc_min: 10,
        power: 800,
        last_command: { mode: 'discharge', power: 2500, since: tenSecondsAgo },
      };
      assert.equal(pa.getResponsivePowerLimit(battery, 2500, 'charge'), 2500);
    });
  });

  describe('allocateWaterFill', () => {
    it('distributes a tight budget evenly across equal capacities', () => {
      const pa = allocator();
      const items = [{ capacity: 2500 }, { capacity: 2500 }, { capacity: 2500 }];
      const result = pa.allocateWaterFill(items, 3000, (item) => item.capacity);
      assert.equal(result.get(items[0]), 1000);
      assert.equal(result.get(items[1]), 1000);
      assert.equal(result.get(items[2]), 1000);
    });

    it('caps smaller items and redistributes to larger ones', () => {
      const pa = allocator();
      const items = [{ capacity: 1000 }, { capacity: 2500 }, { capacity: 2500 }];
      const result = pa.allocateWaterFill(items, 5000, (item) => item.capacity);
      // first item takes 1000, remaining 4000 split between the other two = 2000 each
      assert.equal(result.get(items[0]), 1000);
      assert.equal(result.get(items[1]), 2000);
      assert.equal(result.get(items[2]), 2000);
    });

    it('returns zero for every item when the budget is zero', () => {
      const pa = allocator();
      const items = [{ capacity: 2500 }, { capacity: 2500 }];
      const result = pa.allocateWaterFill(items, 0, (item) => item.capacity);
      assert.equal(result.get(items[0]), 0);
      assert.equal(result.get(items[1]), 0);
    });
  });

  describe('allocatePriorityWaterFill', () => {
    it('serves the priority item before regular items', () => {
      const pa = allocator();
      const items = [
        { id: 'A', capacity: 2500, is_priority_battery: true },
        { id: 'B', capacity: 2500 },
      ];
      const result = pa.allocatePriorityWaterFill(items, 3000, (item) => item.capacity);
      // 3000 budget, priority battery A is served first (water-fill within priority group)
      // then B gets remainder
      assert.equal(result.get(items[0]), 2500);
      assert.equal(result.get(items[1]), 500);
    });

    it('falls back to water-fill when no priority items exist', () => {
      const pa = allocator();
      const items = [{ capacity: 2500 }, { capacity: 2500 }];
      const result = pa.allocatePriorityWaterFill(items, 3000, (item) => item.capacity);
      assert.equal(result.get(items[0]), 1500);
      assert.equal(result.get(items[1]), 1500);
    });
  });

  describe('buildMaxPowerStates', () => {
    it('returns requested power when no phase limits apply', () => {
      const pa = allocator();
      const batteries = [{ id: 'M1', phase: 'L1', charging_max: 2500 }];
      const states = pa.buildMaxPowerStates({
        batteries,
        maxPowerProperty: 'charging_max',
        phaseLimits: { L1: Infinity },
      });
      assert.equal(states[0].assignedPower, 2500);
    });

    it('shares a tight phase limit fairly between two batteries', () => {
      const pa = allocator();
      const batteries = [
        { id: 'M1', phase: 'L1', charging_max: 2500 },
        { id: 'M2', phase: 'L1', charging_max: 2500 },
      ];
      const states = pa.buildMaxPowerStates({
        batteries,
        maxPowerProperty: 'charging_max',
        phaseLimits: { L1: 3000 },
      });
      assert.equal(states[0].assignedPower, 1500);
      assert.equal(states[1].assignedPower, 1500);
    });

    it('assigns full requested power when the phase budget is sufficient', () => {
      const pa = allocator();
      const batteries = [
        { id: 'M1', phase: 'L1', charging_max: 2500 },
        { id: 'M2', phase: 'L1', charging_max: 2500 },
      ];
      const states = pa.buildMaxPowerStates({
        batteries,
        maxPowerProperty: 'charging_max',
        phaseLimits: { L1: 6000 },
      });
      assert.equal(states[0].assignedPower, 2500);
      assert.equal(states[1].assignedPower, 2500);
    });

    it('honours priority-first mode', () => {
      const pa = allocator();
      const batteries = [
        { id: 'M1', phase: 'L1', charging_max: 2500, is_priority_battery: true },
        { id: 'M2', phase: 'L1', charging_max: 2500 },
      ];
      const states = pa.buildMaxPowerStates({
        batteries,
        maxPowerProperty: 'charging_max',
        phaseLimits: { L1: 3000 },
        allocationMode: 'priority-first',
      });
      assert.equal(states[0].assignedPower, 2500);
      assert.equal(states[1].assignedPower, 500);
    });
  });
});
