'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { WriteRunner } = require('../../support/write-runner');
const { makeBattery } = require('../../fixtures/homes');
function message(powers = [100], mode = 'charge') {
  return { batteries: powers.map((_,i) => makeBattery({id:`M${i+1}`,phase:'L1',power:-2000})),
    solutions: powers.map((power,i) => ({id:`M${i+1}`,mode,power})) };
}
function previous(r, id='M1', mode='discharge', power=2000) {
  r.global.set('lastBatteryCommands',{...(r.global.get('lastBatteryCommands')||{}),[id]:{mode,power}});
}

describe('Parallel battery command cycles', () => {
  it('clears both registers before reversing direction, then applies power', () => {
    const r = new WriteRunner(); previous(r);
    const [t] = r.begin(message());
    const calls = [];
    for (let c; (c=r.step(t));) {
      calls.push(c);
      assert.equal(r.global.get('lastBatteryCommands').M1.mode,'discharge','record only after all acknowledgements');
    }
    assert.deepEqual(calls.map(c=>[c.action,c.data]),[
      ['number.set_value',{value:0}],['select.select_option',{option:'charge'}],['number.set_value',{value:100}]]);
    assert.equal(calls[0].target.entity_id.length,2);
    assert.equal(r.global.get('lastBatteryCommands').M1.power,100);
    assert.equal(r.flow.get('battery_commands_busy'),false);
  });
  it('changes same-mode power directly and retains a delayed direction handoff', () => {
    const r = new WriteRunner(); previous(r);
    const issue = m => r.complete(r.begin(m)[0]);
    assert.equal(issue(message()).length,3);
    assert.equal(r.global.get('lastBatteryCommands').M1.handoff_pending,true);
    for(const power of [100,200,300]) {
      assert.ok(issue(message([power])).every(c=>c.action==='number.set_value'&&c.data.value===power));
      assert.equal(r.global.get('lastBatteryCommands').M1.handoff_pending,true);
    }
    const m=message([300]);m.batteries[0].power=300;
    assert.deepEqual(issue(m),[]);
    assert.equal(r.global.get('lastBatteryCommands').M1.handoff_pending,false);
    m.solutions[0]={id:'M1',mode:'discharge',power:500};
    assert.equal(issue(m).length,3);
  });
  it('starts batteries in parallel and unlocks only after every battery finishes', () => {
    const r = new WriteRunner();const [a,b]=r.begin(message([100,200]));
    assert.equal(r.step(a).data.value,0);
    assert.equal(r.step(b).data.value,0,'M2 starts before M1 completes');
    r.complete(b);
    assert.equal(r.flow.get('battery_commands_busy'),true);
    assert.ok(r.flow.get('write_inflight'));
    r.time+=2400;r.complete(a);
    assert.equal(r.flow.get('write_inflight'),null);
    assert.equal(r.flow.get('write_execution_time'),2.4);
  });
  it('invalidates a failed battery, drains its peers, then retries its entire handoff', () => {
    const r = new WriteRunner();previous(r);const [a,b]=r.begin(message([100,200]));
    r.step(a);r.fail(a);
    assert.equal(r.global.get('lastBatteryCommands').M1,undefined);
    assert.equal(r.flow.get('battery_commands_busy'),true);
    r.complete(b);
    assert.equal(r.flow.get('battery_commands_busy'),false);
    assert.equal(r.flow.get('write_pending'),true);
    const [retry]=r.begin(message());
    assert.equal(r.step(retry).data.value,0);
  });
  it('coalesces updates without advancing recovery and reruns with a clean message', () => {
    const r = new WriteRunner();const [a]=r.begin(message());
    for(const power of [200,300,400]) assert.equal(r.begin(message([power])),null);
    assert.equal(r.flow.get('protection_recovery'),undefined);
    r.complete(a);
    const fresh=r.node('Pending evaluation?',{solutions:[{power:400}],grid_power:9999});
    assert.deepEqual(fresh,{hbc_rerun:true});
    assert.equal(r.node('Pending evaluation?',{}),null);
  });
  it('does not count duplicate completions or allow an old cycle to affect a new cycle', () => {
    const r = new WriteRunner();const [a,b]=r.begin(message([100,200]));
    const old=structuredClone(a);r.complete(a);
    assert.equal(r.node('Collect completions',a),null);
    assert.ok(r.flow.get('write_inflight'));
    r.complete(b);const [fresh]=r.begin(message([300]));
    const cycle=structuredClone(r.flow.get('write_inflight'));
    old.error={message:'Late old failure'};
    assert.equal(r.node('Battery command failed',old),null);
    assert.equal(r.node('Collect completions',old),null);
    assert.equal(r.node('Next battery command',old),null);
    assert.deepEqual(r.flow.get('write_inflight'),cycle);
    r.complete(fresh);
    assert.equal(r.global.get('lastBatteryCommands').M1.power,300);
  });
  it('quarantines timed-out writes until all outstanding replies drain', () => {
    const r = new WriteRunner();const [a,b]=r.begin(message([100,200]));
    r.step(a);r.step(b);r.time+=30000;
    assert.equal(r.node('Write watchdog',{}),null);
    assert.equal(r.flow.get('write_inflight').quarantined,true);
    assert.equal(r.begin(message([900])),null);
    assert.equal(r.step(a),null,'no further mode/power after a timed-out service replies');
    assert.ok(r.flow.get('write_inflight'),'M2 still outstanding');
    r.step(b);
    assert.equal(r.flow.get('write_inflight'),null);
    assert.equal(r.global.get('lastBatteryCommands').M1,undefined);
    assert.deepEqual(r.node('Pending evaluation?',{}),{hbc_rerun:true});
    assert.ok(r.begin(message()));
  });
  it('recovers an evaluation timeout and rejects its late protected result', () => {
    const r = new WriteRunner();const m=r.node('Write limiter',message());
    r.time+=30000;
    assert.deepEqual(r.node('Write watchdog',{}),{hbc_rerun:true});
    const newer=r.node('Write limiter',message([300]));
    const old=r.prepare({...m,target:'Charge'});
    assert.equal(r.finish(old),null);
    assert.equal(r.flow.get('protection_recovery'),undefined);
    assert.equal(r.node('Fan out batteries',m),null);
    assert.equal(r.flow.get('write_inflight').id,newer.write_cycle);
  });
  it('finishes empty evaluations without retaining a lock', () => {
    const r=new WriteRunner();assert.deepEqual(r.begin(message([])),[]);
    assert.equal(r.flow.get('write_inflight'),null);
  });
  it('includes measured write duration in rate-limit feedback', () => {
    const r=new WriteRunner();r.flow.set('strategy_execution_time',0.01);r.flow.set('write_execution_time',2);
    const m=r.node('Operational thresholds ',{grid_power:100});
    assert.equal(m.p1_rate_limit.high_load_detected,true);
    assert.equal(m.p1_rate_limit.previous_write_time,2);
  });
  for (const direction of [1,-1]) for (const aggregate of [false,true]) {
    it(`preserves ${aggregate ? 'aggregate' : 'phase'} reservations during parallel ${direction > 0 ? 'charge' : 'discharge'} redistribution to delayed M5`, () => {
      const r=new WriteRunner();
      const mode=direction>0 ? 'charge' : 'discharge';
      const m={target:direction>0 ? 'Charge':'Sell',
        batteries:['L3','L2','L2','L1','L2'].map((phase,i)=>makeBattery({id:`M${i+1}`,phase,power:i===1 ? direction*2000:0})),
        solutions:Array.from({length:5},(_,i)=>({id:`M${i+1}`,mode:i===1 ? mode:'stop',power:i===1 ? 2000:0})),
        grid_power:direction*5500, grid_power_phase:{L1:0,L2:direction*5500,L3:0},
        grid_power_limit_phase:5750,phase_protection:{enabled:!aggregate},
        grid_power_has_limit_import:aggregate&&direction>0,grid_power_has_limit_export:aggregate&&direction<0,
        grid_power_limit_import:5500,grid_power_limit_export:5500,
        protection_recovery_settings:{phase_target_w:5500,phase_hysteresis_w:100,delay_s:10,rate_w_per_s:100}};
      const evaluate=()=>{
        const triggered=r.node('Write limiter',structuredClone(m));
        return r.finish(r.prepare(triggered));
      };
      let out=evaluate();
      let transactions=r.dispatch(out);transactions.forEach(t=>r.complete(t));
      r.time+=1000;
      m.solutions[1]={id:'M2',mode:'stop',power:0};
      m.solutions[4]={id:'M5',mode,power:2000};
      out=evaluate();
      assert.equal(out.solutions.find(s=>s.id==='M5').power,0,'an unobserved M2 reduction cannot fund M5');
      transactions=r.dispatch(out);
      // M5 acknowledges later than the other four batteries.
      transactions.slice(0,4).forEach(t=>r.complete(t));
      assert.equal(r.flow.get('battery_commands_busy'),true);
      r.time+=5000;r.complete(transactions[4]);
      r.time+=1000;out=evaluate();
      assert.equal(out.solutions.find(s=>s.id==='M5').power,0,'HA completion does not replace physical telemetry');
      r.dispatch(out).forEach(t=>r.complete(t));
    });
  }
  it('connects parallel fanout, transaction acknowledgements, fresh rereads and watchdog', () => {
    const nodes=JSON.parse(fs.readFileSync('node-red/01 start-flow.json'));
    const node=name=>nodes.find(n=>n.type!=='group'&&n.name===name);
    assert.deepEqual(node('Set Batteries').wires[0],[node('Next battery command').id]);
    assert.deepEqual(node('Apply battery command').wires,[[node('Next battery command').id]]);
    assert.deepEqual(node('Next battery command').wires[1],[node('Collect completions').id]);
    assert.deepEqual(node('Fan out batteries').wires[0],[node('Set Batteries').id]);
    assert.deepEqual(node('Pending evaluation?').wires,[[node('Refresh P1 for pending evaluation').id]]);
    assert.equal(node('Refresh P1 for pending evaluation').entity_id,'sensor.p1_meter_power');
    assert.deepEqual(node('Check write watchdog').wires,[[node('Write watchdog').id]]);
    assert.ok(node('Call "Link in" node').wires[0].includes(node('Protection recovery').id));
  });
});
