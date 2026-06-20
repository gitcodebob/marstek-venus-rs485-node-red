'use strict';

const fs = require('fs');
const path = require('path');
const RED = require('./red-util');
const { ContextStore } = require('./context-store');

class FunctionRunner {
  /**
   * @param {object} [options]
   * @param {boolean} [options.captureStatus=true]
   * @param {boolean} [options.captureWarnings=true]
   * @param {boolean} [options.captureErrors=true]
   * @param {boolean} [options.captureLogs=true]
   */
  constructor(options = {}) {
    this.options = {
      captureStatus: options.captureStatus !== false,
      captureWarnings: options.captureWarnings !== false,
      captureErrors: options.captureErrors !== false,
      captureLogs: options.captureLogs !== false,
    };
    this.reset();
  }

  reset() {
    this.status = [];
    this.warnings = [];
    this.errors = [];
    this.logs = [];
  }

  /**
   * Load a function node body from a flow export.
   * @param {string} flowFile - relative path from project root, e.g. "node-red/02 strategy-full-stop.json"
   * @param {string|{name?: string, id?: string}} nodeRef - function node name or {id}/{name}
   * @returns {string}
   */
  loadFunctionCode(flowFile, nodeRef) {
    const fullPath = path.resolve(__dirname, '../../', flowFile);
    const flow = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    const node = flow.find((n) => {
      if (!n || n.type !== 'function') return false;
      if (typeof nodeRef === 'string') return n.name === nodeRef || n.id === nodeRef;
      if (nodeRef.id) return n.id === nodeRef.id;
      if (nodeRef.name) return n.name === nodeRef.name;
      return false;
    });

    if (!node) {
      throw new Error(
        `Function node ${JSON.stringify(nodeRef)} not found in ${flowFile}`
      );
    }

    return node.func;
  }

  /**
   * Execute a function node.
   * @param {object} params
   * @param {string} params.flowFile
   * @param {string|object} params.node - function node name or {name, id}
   * @param {object} [params.msg={}]
   * @param {ContextStore} [params.context]
   * @param {ContextStore} [params.flow]
   * @param {ContextStore} [params.global]
   * @returns {unknown} - the return value from the function node (may be array)
   */
  run({ flowFile, node: nodeRef, msg = {}, context, flow, global }) {
    this.reset();
    const code = flowFile
      ? this.loadFunctionCode(flowFile, nodeRef)
      : this.loadFunctionCodeByNode(nodeRef);
    return this.execute(code, nodeRef, msg, context, flow, global);
  }

  loadFunctionCodeByNode(node) {
    if (!node || typeof node.func !== 'string') {
      throw new Error('Function node object with func string required');
    }
    return node.func;
  }

  execute(code, nodeRef, msg = {}, context, flow, global) {
    const contextStore = context || new ContextStore();
    const flowStore = flow || new ContextStore();
    const globalStore = global || new ContextStore();

    const fn = new Function('msg', 'node', 'context', 'flow', 'global', 'RED', code);

    const nodeName = typeof nodeRef === 'string'
      ? nodeRef
      : (nodeRef?.name || nodeRef?.id || 'unknown');
    const nodeId = typeof nodeRef === 'object' && nodeRef?.id ? nodeRef.id : nodeName;

    const nodeMock = {
      status: this.options.captureStatus ? (obj) => { this.status.push(obj); } : () => {},
      warn: this.options.captureWarnings ? (text) => { this.warnings.push(text); } : () => {},
      error: this.options.captureErrors ? (text, message) => { this.errors.push({ text, msg: message }); } : () => {},
      log: this.options.captureLogs ? (text) => { this.logs.push(text); } : () => {},
    };

    const thisObj = {
      __node__: { id: nodeId, name: nodeName },
      env: {
        get: (key) => flowStore.get(key),
      },
      msg,
    };

    const REDMock = { util: RED };

    return fn.call(thisObj, msg, nodeMock, contextStore, flowStore, globalStore, REDMock);
  }
}

module.exports = { FunctionRunner };
