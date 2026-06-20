'use strict';

const fs = require('fs');
const path = require('path');
const RED = require('./red-util');
const { FunctionRunner } = require('./function-runner');
const { resolveTemplate, StateProvider, TemplateProvider } = require('./ha-state-mock');

function convertRuleValue(value, type, msg, stores) {
  switch (type) {
    case 'str': return String(value);
    case 'num': return Number(value);
    case 'bool': return value === true || value === 'true';
    case 're': return new RegExp(value);
    case 'flow': return stores.flow.get(value);
    case 'global': return stores.global.get(value);
    case 'msg': return RED.getMessageProperty(msg, value);
    default: return value;
  }
}

class FlowGraph {
  /**
   * @param {object} options
   * @param {ContextStore} options.context
   * @param {ContextStore} options.flow
   * @param {ContextStore} options.global
   * @param {StateProvider} [options.stateProvider]
   * @param {TemplateProvider} [options.templateProvider]
   * @param {object} [options.clock]
   */
  constructor(options = {}) {
    this.nodes = new Map();
    this.configNodes = new Map();
    this.idsByName = new Map();
    this.context = options.context;
    this.flow = options.flow;
    this.global = options.global;
    this.stateProvider = options.stateProvider || new StateProvider();
    this.templateProvider = options.templateProvider || new TemplateProvider();
    this.clock = options.clock || { now: () => Date.now() };
    this.runner = new FunctionRunner({ captureStatus: false, captureWarnings: true, captureErrors: true, captureLogs: false });
    this.maxDepth = 200;
    this.onVisit = options.onVisit;
  }

  load(flowFiles) {
    for (const file of flowFiles) {
      const fullPath = path.resolve(__dirname, '../../', file);
      const flow = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      for (const node of flow) {
        if (!node || !node.id) continue;
        if (node.type === 'server' || node.type === 'global-config') {
          this.configNodes.set(node.id, node);
          continue;
        }
        if (!this.nodes.has(node.id)) {
          this.nodes.set(node.id, node);
          if (node.name) {
            const key = `${node.type}:${node.name}`;
            if (!this.idsByName.has(key)) {
              this.idsByName.set(key, node.id);
            }
          }
        }
      }
    }
  }

  getNode(id) { return this.nodes.get(id); }
  getNodeIdByName(type, name) { return this.idsByName.get(`${type}:${name}`); }
  getNodeByName(type, name) { return this.nodes.get(this.getNodeIdByName(type, name)); }

  /**
   * Start at a strategy `link in` by name and run until terminal `link out` return.
   * @param {string} strategyName
   * @param {object} startMsg
   * @returns {Promise<object[]>} terminal messages from link out return nodes
   */
  async run(strategyName, startMsg) {
    const startNode = this.getNodeByName('link in', strategyName);
    if (!startNode) {
      throw new Error(`link in "${strategyName}" not found`);
    }
    const terminals = [];
    await this._visit(startNode.id, startMsg, 0, terminals);
    return terminals;
  }

  async _visit(nodeId, msg, depth, terminals) {
    if (depth > this.maxDepth) {
      throw new Error(`Max traversal depth exceeded at node ${nodeId}`);
    }
    const node = this.nodes.get(nodeId);
    if (!node) return;
    if (this.onVisit) this.onVisit(node, msg, depth);

    const result = await this._execNode(node, msg, depth);

    if (node.type === 'link out') {
      if (node.mode === 'return') {
        terminals.push(msg);
        return;
      }
      // Static link to another node (usually link in "link to End")
      for (const targetId of node.links || []) {
        await this._visit(targetId, msg, depth + 1, terminals);
      }
      return;
    }

    for (let i = 0; i < result.length; i++) {
      const outMsg = result[i];
      if (outMsg === null || outMsg === undefined) continue;
      const wires = node.wires?.[i] || [];
      for (const targetId of wires) {
        await this._visit(targetId, outMsg, depth + 1, terminals);
      }
    }
  }

  async _execNode(node, msg, depth) {
    const stores = { context: this.context, flow: this.flow, global: this.global };

    switch (node.type) {
      case 'function': {
        const result = this.runner.run({ node, msg, context: this.context, flow: this.flow, global: this.global });
        return this._functionOutputs(node, result);
      }
      case 'change': return this._applyChangeRules(node, msg);
      case 'switch': return this._evalSwitch(node, msg);
      case 'link in': return [msg];
      case 'link out': return [];
      case 'link call': return this._evalLinkCall(node, msg, depth);
      case 'api-current-state': return this._evalApiCurrentState(node, msg);
      case 'api-call-service': return [msg];
      case 'api-render-template': return this._evalApiRenderTemplate(node, msg);
      case 'time-range-switch': return this._evalTimeRangeSwitch(node, msg);
      case 'rbe':
      case 'smooth':
      case 'delay':
      case 'trigger':
      case 'inject':
      case 'junction': return [msg];
      case 'debug': return [];
      default: return [msg];
    }
  }

  _functionOutputs(node, result) {
    if (result === null || result === undefined) return [];
    if (Array.isArray(result) && (node.outputs || 1) > 1) {
      const arr = result.slice(0, node.outputs);
      while (arr.length < node.outputs) arr.push(undefined);
      return arr;
    }
    return [result];
  }

  _applyChangeRules(node, msg) {
    for (const rule of node.rules || []) {
      const p = rule.p;
      const pt = rule.pt || 'msg';
      switch (rule.t) {
        case 'set': {
          let value;
          if (rule.tot === 'entityState') {
            value = this.stateProvider.getState(resolveTemplate(node.entity_id, msg));
          } else {
            value = this._convertValue(rule.to, rule.tot, msg);
          }
          this._setProperty(pt, p, value, msg);
          break;
        }
        case 'delete': {
          this._deleteProperty(pt, p, msg);
          break;
        }
        case 'move': {
          const src = this._getProperty(rule.p, msg);
          this._deleteProperty(pt, rule.p, msg);
          this._setProperty(rule.to_pt || 'msg', rule.to, src, msg);
          break;
        }
        case 'change': {
          const current = this._getProperty(pt, p, msg);
          if (typeof current === 'string') {
            const from = new RegExp(rule.from, 'g');
            this._setProperty(pt, p, current.replace(from, rule.to), msg);
          }
          break;
        }
      }
    }
    return [msg];
  }

  _getProperty(pt, p, msg) {
    if (pt === 'msg') return RED.getMessageProperty(msg, p);
    if (pt === 'flow') return this.flow.get(p);
    if (pt === 'global') return this.global.get(p);
    if (pt === 'payload') return msg.payload;
    return undefined;
  }

  _setProperty(pt, p, value, msg) {
    if (pt === 'msg') RED.setMessageProperty(msg, p, value, true);
    else if (pt === 'flow') this.flow.set(p, value);
    else if (pt === 'global') this.global.set(p, value);
    else if (pt === 'payload') msg.payload = value;
  }

  _deleteProperty(pt, p, msg) {
    if (pt === 'msg') {
      const parts = p.split('.');
      let target = msg;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target?.[parts[i]];
      }
      if (target) delete target[parts[parts.length - 1]];
    }
  }

  _convertValue(value, type, msg) {
    switch (type) {
      case 'str': return String(value);
      case 'num': return Number(value);
      case 'bool': return value === true || value === 'true';
      case 'json': return JSON.parse(value);
      case 'date': return this.clock.now();
      case 'msg': return RED.getMessageProperty(msg, value);
      case 'flow': return this.flow.get(value);
      case 'global': return this.global.get(value);
      case 'env': return process.env[value];
      default: return value;
    }
  }

  _evalSwitch(node, msg) {
    const property = this._getProperty(node.propertyType || 'msg', node.property, msg);
    for (let i = 0; i < (node.rules || []).length; i++) {
      const rule = node.rules[i];
      const check = this._evalSwitchRule(rule, property, msg);
      if (check) {
        const arr = new Array(node.outputs || 1).fill(undefined);
        arr[i] = msg;
        return arr;
      }
    }
    return new Array(node.outputs || 1).fill(undefined);
  }

  _evalSwitchRule(rule, property, msg) {
    const v = convertRuleValue(rule.v, rule.vt, msg, { flow: this.flow, global: this.global });
    switch (rule.t) {
      case 'eq': return String(property) === String(v);
      case 'neq': return String(property) !== String(v);
      case 'gt': return Number(property) > Number(v);
      case 'gte': return Number(property) >= Number(v);
      case 'lt': return Number(property) < Number(v);
      case 'lte': return Number(property) <= Number(v);
      case 'cont': return String(property).includes(String(v));
      case 'true': return property === true;
      case 'false': return property === false;
      case 'null': return property == null;
      case 'nnull': return property != null;
      case 'else': return true;
      default: return false;
    }
  }

  async _evalLinkCall(node, msg, depth) {
    let targetIds = [];
    if (node.linkType === 'dynamic') {
      const targetName = RED.getMessageProperty(msg, 'target');
      const targetId = this.getNodeIdByName('link in', targetName);
      if (!targetId) {
        throw new Error(`Dynamic link call could not resolve link in "${targetName}"`);
      }
      targetIds = [targetId];
    } else {
      targetIds = node.links || [];
    }

    let outMsg = msg;
    for (const targetId of targetIds) {
      const terminals = [];
      await this._visit(targetId, msg, depth + 1, terminals);
      if (terminals.length > 0) {
        outMsg = terminals[0];
      }
    }
    return [outMsg];
  }

  _evalApiCurrentState(node, msg) {
    const entityId = resolveTemplate(node.entity_id, msg);
    const state = this.stateProvider.getState(entityId);
    for (const prop of node.outputProperties || []) {
      let value;
      if (prop.valueType === 'entityState') {
        value = state;
      } else {
        value = this._convertValue(prop.value, prop.valueType, msg);
      }
      this._setProperty(prop.propertyType || 'msg', prop.property, value, msg);
    }
    if (node.state_location) {
      this._setProperty('msg', node.state_location, state, msg);
    }
    return [msg];
  }

  _evalApiRenderTemplate(node, msg) {
    const rendered = this.templateProvider.render(node.name, node.entity_id, msg);
    if (rendered !== undefined) {
      this._setProperty(node.resultsLocationType || 'msg', node.resultsLocation, rendered, msg);
    }
    return [msg];
  }

  _evalTimeRangeSwitch(node, msg) {
    // The timed strategy uses msg.__config set by a preceding function node.
    const config = msg.__config || {};
    const start = config.startTime;
    const end = config.endTime;
    if (!start || !end) {
      return [undefined, msg];
    }
    const now = this.clock.now ? new Date(this.clock.now()) : new Date();
    if (this._isInPeriod(now, start, end)) {
      return [msg, undefined];
    }
    return [undefined, msg];
  }

  _isInPeriod(now, startStr, endStr) {
    const toMinutes = (timeStr) => {
      const [h, m = 0] = String(timeStr).split(':');
      return Number(h) * 60 + Number(m);
    };
    const current = now.getHours() * 60 + now.getMinutes();
    const start = toMinutes(startStr);
    const end = toMinutes(endStr);
    if (start <= end) {
      return current >= start && current < end;
    }
    return current >= start || current < end;
  }
}

module.exports = { FlowGraph };
