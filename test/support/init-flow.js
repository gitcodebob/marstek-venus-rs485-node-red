'use strict';

const { FunctionRunner } = require('../lib/function-runner');
const { ContextStore } = require('../lib/context-store');

class Initializer {
  /**
   * @param {object} options
   * @param {ContextStore} [options.global]
   * @param {boolean} [options.debugMode=false]
   */
  constructor({ global: globalStore, debugMode = false } = {}) {
    this.global = globalStore || new ContextStore();
    this.debugMode = debugMode;
  }

  /**
   * Run the "Custom logger" function, which initializes `logger` and
   * `unhandledException` as globals.
   */
  initialize() {
    const runner = new FunctionRunner({ captureStatus: false, captureWarnings: false, captureErrors: false, captureLogs: false });
    runner.run({
      flowFile: 'node-red/01 start-flow.json',
      node: 'Custom logger',
      msg: {},
      global: this.global,
    });
    this.global.set('debug_mode', this.debugMode);
  }

  /**
   * Provide a no-op logger global for tests that don't need the real one.
   */
  useNoopLogger() {
    this.global.set('logger', () => {});
    this.global.set('unhandledException', () => {});
  }
}

module.exports = { Initializer };
