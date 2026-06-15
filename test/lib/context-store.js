'use strict';

class ContextStore {
  /**
   * @param {Record<string, unknown>} [initial]
   */
  constructor(initial = {}) {
    this.store = new Map(Object.entries(initial));
  }

  /**
   * @param {string} key
   */
  get(key) {
    return this.store.get(key);
  }

  /**
   * @param {string} key
   * @param {unknown} value
   */
  set(key, value) {
    this.store.set(key, value);
    return value;
  }

  /**
   * @returns {string[]}
   */
  keys() {
    return Array.from(this.store.keys());
  }
}

module.exports = { ContextStore };
