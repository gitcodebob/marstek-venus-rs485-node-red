'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FunctionRunner } = require('../../lib/function-runner');
const { Initializer } = require('../../support/init-flow');
const { makeBattery } = require('../../fixtures/homes');

function runCheckIfFull(batteries) {
  const initializer = new Initializer();
  initializer.useNoopLogger();

  return new FunctionRunner({}).run({
    flowFile: 'node-red/02 strategy-charge.json',
    node: 'Check if full',
    msg: {
      batteries,
      charge: { goal: 'batteries are full' },
      batteries_available_energy: 9,
      batteries_max_energy: 9,
    },
    global: initializer.global,
  });
}

describe('Check if full', () => {
  it('reports full when every battery is at its SoC ceiling', () => {
    const msg = runCheckIfFull([
      makeBattery({ id: 'M1', soc: 100 }),
      makeBattery({ id: 'M2', soc: 100 }),
    ]);

    assert.equal(msg.charge.threshold_reached, true);
  });

  it('is not full while one battery is still below its ceiling', () => {
    const msg = runCheckIfFull([
      makeBattery({ id: 'M1', soc: 100 }),
      makeBattery({ id: 'M2', soc: 60 }),
    ]);

    assert.equal(msg.charge.threshold_reached, false);
  });

  it('is not full when a battery reports no SoC', () => {
    // Unavailable telemetry normalizes to null and Number(null) is 0, so an unguarded
    // `soc >= soc_max` would read as 0 >= 0 and stop the charge on that battery's word.
    const offline = { ...makeBattery({ id: 'M2' }), soc: null, soc_max: null };
    const msg = runCheckIfFull([makeBattery({ id: 'M1', soc: 100 }), offline]);

    assert.equal(msg.charge.threshold_reached, false);
  });
});
