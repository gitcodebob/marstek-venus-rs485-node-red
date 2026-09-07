'use strict';

function expectSolutions(actual, expectedById) {
  if (!Array.isArray(actual)) {
    throw new Error(`expected solutions array, got ${typeof actual}`);
  }
  const byId = Object.fromEntries(actual.map((s) => [s.id, s]));
  for (const [id, expected] of Object.entries(expectedById)) {
    const solution = byId[id];
    if (!solution) {
      throw new Error(`expected solution for ${id} but not found`);
    }
    if (expected.mode !== undefined && solution.mode !== expected.mode) {
      throw new Error(`expected ${id} mode ${expected.mode}, got ${solution.mode}`);
    }
    if (expected.power !== undefined && solution.power !== expected.power) {
      throw new Error(`expected ${id} power ${expected.power}, got ${solution.power}`);
    }
  }
  if (actual.length !== Object.keys(expectedById).length) {
    throw new Error(`expected ${Object.keys(expectedById).length} solutions, got ${actual.length}`);
  }
}

module.exports = { expectSolutions };
