// Nomenclature is deterministic identification, not evidence of discovery.
export function systematicElement(z){
 if(!Number.isInteger(z)||z<101||z>999)throw Error('Systematic three-digit atomic number required');
 const roots=['nil','un','bi','tri','quad','pent','hex','sept','oct','enn'],parts=String(z).split('').map(d=>roots[Number(d)]);
 const name=(parts.join('')+'ium').replaceAll('ennnil','ennil').replace(/(bi|tri)ium$/,m=>m.replace('iium','ium'));
 const symbol=parts.map(p=>p[0]).join('');
 return {name:name[0].toUpperCase()+name.slice(1),symbol:symbol[0].toUpperCase()+symbol.slice(1)};
}
export const proposedScope={first:119,last:188,recognised_last:118,recognition_checked:'2026-09-26',source_ids:['SRC-000306','SRC-000307']};
