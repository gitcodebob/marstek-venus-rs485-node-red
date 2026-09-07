'use strict';
const { it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

it('combined export matches individual flow nodes and has no broken links or duplicate controllers', () => {
  const dir = path.resolve(__dirname, '../../node-red');
  const combined = JSON.parse(fs.readFileSync(path.join(dir, 'all-flows-in-one-file.json'), 'utf8'));
  const byId = new Map(combined.map(n => [n.id, n]));
  assert.equal(byId.size, combined.length, 'node IDs must be unique');
  const tabs = combined.filter(n => n.type === 'tab');
  assert.equal(new Set(tabs.map(t => t.label)).size, tabs.length, 'no duplicate tabs');
  const expectedIds = new Set();
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'all-flows-in-one-file.json')) {
    const nodes = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const node of nodes) {
      if (['server', 'global-config'].includes(node.type)) continue;
      expectedIds.add(node.id);
      assert.deepEqual(byId.get(node.id), node, `${file}: ${node.name || node.label || node.id} differs`);
    }
  }
  for (const node of combined) {
    if (!['server', 'global-config'].includes(node.type)) assert.ok(expectedIds.has(node.id), `stale node ${node.id}`);
    const refs = [...(node.wires || []).flat(), ...(node.links || []), ...(node.nodes || []),
      ...(Array.isArray(node.scope) ? node.scope : []), ...[node.z, node.g, node.server].filter(Boolean)];
    for (const ref of refs) assert.ok(byId.has(ref), `${node.id} references missing node ${ref}`);
  }
});
