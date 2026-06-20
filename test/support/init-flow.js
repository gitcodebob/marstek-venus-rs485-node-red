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
   * Run the branch-101 "Custom logger" function, which also initializes
   * `phasePowerAllocator`, `logger`, and `unhandledException` as globals.
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
   * This still runs `initialize()` so that `phasePowerAllocator` and other
   * globals created by the "Custom logger" node are available, then silences
   * logging.
   */
  useNoopLogger() {
    this.initialize();
    this.global.set('logger', () => {});
    this.global.set('unhandledException', () => {});
    return this;
  }
}

module.exports = { Initializer };
