'use strict';

function phasePower(readings) {
  return {
    L1: readings.L1 ?? null,
    L2: readings.L2 ?? null,
    L3: readings.L3 ?? null,
  };
}

function phaseBatteryPower(readings) {
  return {
    signed: { L1: 0, L2: 0, L3: 0 },
    charge: { L1: 0, L2: 0, L3: 0 },
    discharge: { L1: 0, L2: 0, L3: 0 },
    ...readings,
  };
}

function phaseProtectionOptions(options = {}) {
  return {
    enabled: true,
    available: options.available ?? true,
    active: options.active ?? false,
    direction: options.direction ?? null,
    limit: options.limit ?? 5500,
    sensors_available: options.sensors_available ?? true,
    assignments_available: options.assignments_available ?? true,
    assigned_phases: options.assigned_phases ?? ['L1', 'L2', 'L3'],
    active_phases: options.active_phases ?? [],
    required_by_phase: { L1: 0, L2: 0, L3: 0 },
    required_phase_power: 0,
    aggregate_required_power: 0,
    aggregate_residual_power: 0,
    required_total_power: 0,
    target_grid_consumption_in_w: null,
    unassigned_violations: [],
    ...options,
  };
}

module.exports = {
  phasePower,
  phaseBatteryPower,
  phaseProtectionOptions,
};
