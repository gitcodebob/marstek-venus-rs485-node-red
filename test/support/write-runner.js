'use strict';
const { ProtectionRunner } = require('./protection-runner');

// Execute exported scheduling and transaction functions; acknowledgements are
// explicit so tests can interleave actual per-battery service completions.
class WriteRunner extends ProtectionRunner {
  begin(message) {
    const m = this.node('Write limiter', structuredClone(message));
    if (!m) return null;
    return this.dispatch(m);
  }
  dispatch(message) {
    const [messages, empty] = this.node('Fan out batteries', message);
    if (empty) { this.node('Collect completions', empty); return []; }
    this.flow.set('battery_commands_busy', true);
    return messages.map(m => {
      const [transaction, failed] = this.node('Set Batteries', m);
      if (failed) this.node('Collect completions', failed);
      return transaction;
    });
  }
  step(transaction) {
    const result = this.node('Next battery command', transaction);
    if (!result) return null;
    const [service, complete] = result;
    if (complete) this.node('Collect completions', complete);
    return service ? structuredClone(service.payload) : null;
  }
  complete(transaction) {
    const calls = [];
    for (let call; (call = this.step(transaction));) calls.push(call);
    return calls;
  }
  fail(transaction) {
    transaction.error = { message: 'Simulated service failure' };
    const failed = this.node('Battery command failed', transaction);
    if (failed) this.node('Collect completions', failed);
  }
}
module.exports = { WriteRunner };
