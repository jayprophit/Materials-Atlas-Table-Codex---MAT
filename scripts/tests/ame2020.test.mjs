import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ameNumber,parseAmeMass,parseAmeReactions,joinAmeTables,massSnapshot,reactionSnapshot,reaction2Snapshot} from '../ame2020.mjs';
const rows=joinAmeTables(parseAmeMass(readFileSync(massSnapshot,'utf8')),parseAmeReactions(readFileSync(reactionSnapshot,'utf8')),parseAmeReactions(readFileSync(reaction2Snapshot,'utf8'),2));
test('AME markers distinguish estimated decimals, missing values and genuine zero',()=>{
 const m=ameNumber('12#34','0#05','fixture');assert.equal(m.value,12.34);assert.equal(m.uncertainty,.05);assert.equal(m.estimated,true);assert.equal(m.raw,'12#34');
 assert.equal(ameNumber('*','','fixture').value,null);assert.equal(ameNumber('0.0','0.0','fixture').value,0);
 assert.throws(()=>ameNumber('bad','1','fixture'));assert.throws(()=>ameNumber('1','-2','fixture'));
});
test('fixed-width AME data preserve independently checked light and heavy anchors',()=>{
 assert.equal(rows.length,3558);const at=(Z,A)=>rows.find(r=>r.Z===Z&&r.A===A);
 assert.equal(at(1,3).q_beta_minus.value,18.59202);assert.equal(at(1,3).q_beta_minus.uncertainty,.00006);
 assert.notEqual(at(1,3).q_beta_minus.uncertainty,Math.hypot(at(1,3).mass_excess.uncertainty,at(2,3).mass_excess.uncertainty));
 assert.equal(at(4,8).q_alpha.value,91.8399);assert.equal(at(4,8).q_alpha.uncertainty,.0354);
 assert.equal(at(92,238).q_alpha.value,4269.8581);assert.equal(at(92,238).q_alpha.uncertainty,2.1157);
 assert.equal(at(92,238).q_beta_minus.value,-146.8652);assert.equal(at(6,12).mass_excess.value,0);
 assert.equal(at(1,1).q_beta_minus.value,null);assert.equal(at(2,4).q_alpha.value,0);assert.equal(at(3,3).mass_excess.estimated,true);
});
test('AME join rejects mismatched identities and lost source rows',()=>{
 const m=parseAmeMass(readFileSync(massSnapshot,'utf8')),r=parseAmeReactions(readFileSync(reactionSnapshot,'utf8')),r2=parseAmeReactions(readFileSync(reaction2Snapshot,'utf8'),2);
 assert.throws(()=>joinAmeTables(m,r.slice(1),r2));const changed=r.map(x=>({...x}));changed[0].symbol='H';assert.throws(()=>joinAmeTables(m,changed,r2));
});
test('all reaction columns retain source semantics, page locations and covariance-aware uncertainties',()=>{
 const at=(Z,A)=>rows.find(r=>r.Z===Z&&r.A===A);
 assert.equal(at(1,3).q_double_beta_minus.value,-13717);assert.equal(at(1,3).q_double_beta_minus.estimated,true);
 assert.equal(at(1,4).q_beta_minus_neutron.value,1618.5921);
 assert.equal(at(1,2).separation_neutron.value,2224.5662);assert.equal(at(1,2).separation_neutron.uncertainty,.0004);
 assert.equal(at(1,3).q_deuteron_alpha.value,17589.2999);assert.equal(at(1,3).q_proton_alpha.uncertainty,.0002);
 assert.equal(at(2,3).q_neutron_alpha.value,20577.6211);assert.equal(at(2,4).q_neutron_alpha.value,0);assert.equal(at(2,4).q_neutron_alpha.raw,'-0.0000');
 assert.equal(at(4,16).reaction2_source_line,110);
 assert.equal(at(92,238).separation_proton.value,7508.8625);assert.equal(at(92,238).q_quadruple_beta_minus.value,-2137.4711);assert.equal(at(92,238).q_quadruple_beta_minus.uncertainty,12.2881);
 assert.equal(at(118,295).q_quadruple_beta_minus.value,null);assert.equal(at(118,295).q_neutron_alpha.value,18882);assert.equal(at(118,295).q_neutron_alpha.estimated,true);
 assert.throws(()=>parseAmeReactions(readFileSync(reaction2Snapshot,'utf8')));
 assert.throws(()=>parseAmeReactions(readFileSync(reaction2Snapshot,'utf8').replace('NORMAL END OF PHASE 4','bad'),2));
});
