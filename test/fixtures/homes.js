'use strict';

const DEFAULTS = {
  venusE: {
    capacityKwh: 5,
    chargeMaxW: 2500,
    dischargeMaxW: 2500,
  },
  venusA: {
    capacityKwh: 12.46,
    chargeMaxW: 1500,
    dischargeMaxW: 1500,
  },
};

function makeBattery({
  id,
  phase = 'unassigned',
  soc = 50,
  socMin = 10,
  socMax = 100,
  chargeMaxW = DEFAULTS.venusE.chargeMaxW,
  dischargeMaxW = DEFAULTS.venusE.dischargeMaxW,
  energyMaxKwh = DEFAULTS.venusE.capacityKwh,
  power = 0,
  rs485 = 'enable',
  lastCommand = null,
}) {
  return {
    id,
    phase,
    power,
    charging_max: chargeMaxW,
    discharging_max: dischargeMaxW,
    soc,
    soc_max: socMax,
    soc_min: socMin,
    inverter: 'on',
    energy: Number(((energyMaxKwh * soc) / 100).toFixed(3)),
    energy_max: energyMaxKwh,
    rs485,
    last_command: lastCommand,
  };
}

function singleVenusE(overrides = {}) {
  return [makeBattery({ id: 'M1', ...DEFAULTS.venusE, ...overrides })];
}

function singleVenusEThrottled(overrides = {}) {
  return [
    makeBattery({
      id: 'M1',
      chargeMaxW: 2500,
      dischargeMaxW: 800,
      ...overrides,
    }),
  ];
}

function oneVenusEPerPhase(overridesPerBattery = []) {
  return ['L1', 'L2', 'L3'].map((phase, index) =>
    makeBattery({
      id: `M${index + 1}`,
      phase,
      ...(overridesPerBattery[index] || {}),
    })
  );
}

function twoVenusEPerPhase(overridesPerBattery = []) {
  const phases = ['L1', 'L1', 'L2', 'L2', 'L3', 'L3'];
  return phases.map((phase, index) =>
    makeBattery({
      id: `M${index + 1}`,
      phase,
      ...(overridesPerBattery[index] || {}),
    })
  );
}

function heterogeneousSystem(overridesPerBattery = []) {
  const definitions = [
    { id: 'M1', phase: 'L3', chargeMaxW: 2200, dischargeMaxW: 2500 },
    { id: 'M2', phase: 'L3', chargeMaxW: 1750, dischargeMaxW: 1750 },
    { id: 'M3', phase: 'L2' },
    { id: 'M4', phase: 'L1' },
    { id: 'M5', phase: 'L3', capacityKwh: 12.46, chargeMaxW: 1500, dischargeMaxW: 1500 },
  ];
  return definitions.map((def, index) =>
    makeBattery({ ...def, ...(overridesPerBattery[index] || {}) })
  );
}

module.exports = {
  makeBattery,
  singleVenusE,
  singleVenusEThrottled,
  oneVenusEPerPhase,
  twoVenusEPerPhase,
  heterogeneousSystem,
};
