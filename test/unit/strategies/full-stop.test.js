'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FunctionRunner } = require('../../lib/function-runner');

const { Initializer } = require('../../support/init-flow');

describe('Full stop strategy', () => {
  it('stops every battery at 0 W', () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const runner = new FunctionRunner();
    const msg = {
      batteries: [
        { id: 'M1', power: 1200 },
        { id: 'M2', power: -800 },
      ],
    };
    const result = runner.run({
      flowFile: 'node-red/02 strategy-full-stop.json',
      node: 'Stop all batteries',
      msg,
      global: initializer.global,
    });

    assert.deepEqual(result.solutions, [
      { id: 'M1', mode: 'stop', power: 0 },
      { id: 'M2', mode: 'stop', power: 0 },
    ]);
  });
});
