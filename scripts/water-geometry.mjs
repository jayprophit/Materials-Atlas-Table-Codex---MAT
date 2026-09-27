import assert from 'node:assert/strict';
export const snapshot='data/catalog/sources/nist-water-geometry-2026-09-26.html.txt';
export const dataPath='records/0001-Hydrogen-H/data/compounds/0001-Hydrogen-H-Water-Geometry.yaml';
export function parseWaterGeometry(raw){
 assert.match(raw,/1979Hoy\/Bun:1/);assert.match(raw,/<H1>Listing of experimental geometry data for H<sub>2<\/sub>O /);assert.match(raw,/name=formula value = 7732185>/);
 const rows=raw.split(/\r?\n/),metric=(name,unit)=>{
  const re=new RegExp('<TD>'+name+'</TD>\\s*<TD class="exper num">([0-9.]+)</TD>','i'),m=re.exec(raw);
  assert.ok(m,'Missing '+name);const line=raw.slice(0,m.index).split(/\r?\n/).length;
  return {value:Number(m[1]),unit,uncertainty:null,uncertainty_status:'UNKNOWN',evidence_type:'EVALUATED',source_id:'SRC-000308',source_locator:snapshot+'#line='+line,raw:m[1],native_reference:'1979Hoy/Bun:1',state:'Isolated neutral water molecule; experimentally inferred equilibrium geometry'};
 };
 const bond=metric('rOH','angstrom'),angle=metric('aHOH','degree');
 const matrix=rows.findIndex(l=>l.includes('<TR><TH>O1</TH><TD></TD><TH>'));
 assert.ok(matrix>=0);const m=/<TR><TH>O1<\/TH><TD><\/TD><TH>([0-9.]+)<\/TH><TH>\1<\/TH>/.exec(rows[matrix]);assert.ok(m,'Missing symmetric O-H matrix distances');
 const distance={...bond,value:Number(m[1]),raw:m[1],source_locator:snapshot+'#line='+(matrix+1),source_section:'Atom-atom distance matrix'};
 assert.ok(angle.value>0&&angle.value<180&&distance.value>0);assert.equal(Number(distance.value.toFixed(3)),bond.value);
 return {internal_coordinate_bond:bond,bond_angle:angle,distance_matrix_bond:distance};
}
export function constructWater(r,theta){
 assert.ok(Number.isFinite(r)&&r>0&&Number.isFinite(theta)&&theta>0&&theta<180);
 const a=theta*Math.PI/360,x=r*Math.sin(a),y=-r*Math.cos(a);
 return {oxygen:[0,0],hydrogen_left:[-x,y],hydrogen_right:[x,y],hydrogen_separation:2*x};
}
