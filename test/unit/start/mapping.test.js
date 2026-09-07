'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FunctionRunner } = require('../../lib/function-runner');
const { Initializer } = require('../../support/init-flow');

const FLOW = 'node-red/01 start-flow.json';

const HEALTHY = {
  battery_index: 1,
  battery_phase: 'L2',
  battery_power: '-120',
  max_charge_power: '2500',
  max_discharge_power: '2500',
  battery_state_of_charge: '87',
  charging_cutoff_capacity: '100',
  discharging_cutoff_capacity: '12',
  inverter_state: 'on',
  battery_remaining_capacity: '4.35',
  battery_total_energy: '5',
  rs485_control_mode: 'enable',
};

function mapBattery(overrides = {}) {
  const initializer = new Initializer();
  initializer.useNoopLogger();

  const runner = new FunctionRunner({});
  const msg = runner.run({
    flowFile: FLOW,
    node: 'Mapping',
    msg: { batteries: [], ...HEALTHY, ...overrides },
    global: initializer.global,
  });

  return msg.batteries[0];
}

describe('Mapping', () => {
  it('maps a healthy battery unchanged', () => {
    const battery = mapBattery();

    assert.deepEqual(
      {
        id: battery.id,
        phase: battery.phase,
        power: battery.power,
        charging_max: battery.charging_max,
        discharging_max: battery.discharging_max,
        soc: battery.soc,
        soc_max: battery.soc_max,
        soc_min: battery.soc_min,
        energy: battery.energy,
        energy_max: battery.energy_max,
        rs485: battery.rs485,
      },
      {
        id: 'M1',
        phase: 'L2',
        power: -120,
        charging_max: 2500,
        discharging_max: 2500,
        soc: 87,
        soc_max: 100,
        soc_min: 12,
        energy: 4.35,
        energy_max: 5,
        rs485: 'enable',
      }
    );
  });

  for (const unreadable of ['unavailable', 'unknown', '', undefined, null]) {
    it(`maps ${JSON.stringify(unreadable)} telemetry to null, never NaN`, () => {
      const battery = mapBattery({
        battery_power: unreadable,
        max_charge_power: unreadable,
        max_discharge_power: unreadable,
        battery_state_of_charge: unreadable,
        charging_cutoff_capacity: unreadable,
        discharging_cutoff_capacity: unreadable,
        battery_remaining_capacity: unreadable,
        battery_total_energy: unreadable,
      });

      for (const field of [
        'power',
        'charging_max',
        'discharging_max',
        'soc',
        'soc_max',
        'soc_min',
        'energy',
        'energy_max',
      ]) {
        assert.equal(battery[field], null, `${field} should be null, got ${battery[field]}`);
      }
    });
  }

  it('keeps a genuine zero reading', () => {
    const battery = mapBattery({ battery_power: '0', discharging_cutoff_capacity: '0' });

    assert.equal(battery.power, 0);
    assert.equal(battery.soc_min, 0);
  });
});
