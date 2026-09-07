'use strict';

// Simple Mustache-like resolver for {{property}} tokens.
function resolveTemplate(template, msg) {
  if (typeof template !== 'string') return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const value = path.split('.').reduce((obj, key) => (obj != null ? obj[key] : undefined), msg);
    return value === undefined ? '' : String(value);
  });
}

class StateProvider {
  /**
   * @param {Map<string, string|number>|Function} [resolver]
   */
  constructor(resolver) {
    if (typeof resolver === 'function') {
      this.resolve = resolver;
    } else if (resolver instanceof Map) {
      this.resolve = (id) => resolver.get(id) ?? '';
    } else {
      this.resolve = () => '';
    }
  }

  getState(entityId) {
    return this.resolve(entityId) ?? '';
  }
}

class TemplateProvider {
  /**
   * @param {Record<string, Function>} templates
   */
  constructor(templates = {}) {
    this.templates = templates;
  }

  render(name, entityId, msg) {
    if (this.templates[name]) {
      return this.templates[name](entityId, msg, resolveTemplate);
    }
    return '';
  }
}

module.exports = {
  resolveTemplate,
  StateProvider,
  TemplateProvider,
};
