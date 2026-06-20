'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { FlowGraph } = require('../lib/flow-graph');
const { Initializer } = require('../support/init-flow');
const { ContextStore } = require('../lib/context-store');
const { singleVenusE } = require('../fixtures/homes');

describe('Full stop strategy integration', () => {
  it('walks from link in to link out and stops every battery', async () => {
    const initializer = new Initializer();
    initializer.useNoopLogger();

    const context = new ContextStore();
    const flow = new ContextStore();
    const globalStore = initializer.global;

    const graph = new FlowGraph({ context, flow, global: globalStore });
    graph.load(['node-red/02 strategy-full-stop.json']);

    const msg = { batteries: singleVenusE() };
    const terminals = await graph.run('Full stop', msg);

    assert.equal(terminals.length, 1);
    assert.deepEqual(terminals[0].solutions, [
      { id: 'M1', mode: 'stop', power: 0 },
    ]);
  });
});
